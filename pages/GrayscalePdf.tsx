
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToGrayscale } from '../services/pdfGrayscale';
import { generatePdfThumbnail } from '../services/pdfThumbnail';
import { PdfFile, CompressionResult } from '../types';
import { nanoid } from 'nanoid';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Download, RefreshCw, Sparkles, Palette, FileText, Lock, Zap, Monitor } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const GrayscalePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  
  // Data State
  const [file, setFile] = useState<PdfFile | null>(null);
  const [colorPreview, setColorPreview] = useState<string | null>(null);
  const [grayPreview, setGrayPreview] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  
  // UI State
  const [isPreparing, setIsPreparing] = useState(false); // Generating thumbnails
  const [isScanning, setIsScanning] = useState(false); // Animation running
  
  // Animation Values
  const scanProgress = useMotionValue(0);
  const clipPath = useTransform(scanProgress, (v) => `inset(0 0 ${100 - v}% 0)`);
  const scannerTop = useTransform(scanProgress, (v) => `${v}%`);
  const scannerOpacity = useTransform(scanProgress, (v) => v >= 100 ? 0 : 1);

  // Helper: Create a visual-only grayscale version of the thumbnail for the animation
  const generateGrayscalePreview = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw grayscale
          ctx.filter = 'grayscale(100%) contrast(1.1)';
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF.", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    const pdfFile = { id: nanoid(), file: f };
    
    setFile(pdfFile);
    setIsPreparing(true);
    // Reset animation
    scanProgress.set(0);

    try {
      // 1. Generate previews
      const thumbUrl = await generatePdfThumbnail(f);
      if (!thumbUrl) throw new Error("Could not generate preview");
      
      setColorPreview(thumbUrl);
      const grayUrl = await generateGrayscalePreview(thumbUrl);
      setGrayPreview(grayUrl);
      
      setIsPreparing(false);
      
      // 2. Start the magic
      runScanSequence(pdfFile);

    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to process PDF preview.", "error");
      setFile(null);
      setIsPreparing(false);
    }
  }, [addToast, scanProgress]);

  const runScanSequence = async (pdfFile: PdfFile) => {
    setIsScanning(true);
    
    // Start the visual scan animation (takes 3.5 seconds)
    const animationControls = animate(scanProgress, 100, { 
        duration: 3.5, 
        ease: "easeInOut",
        onComplete: () => {
            // Optional: Ensure it stays at 100
        }
    });

    // Start the actual heavy lifting
    const conversionPromise = convertPdfToGrayscale(pdfFile);

    try {
      // Wait for conversion
      const conversionResult = await conversionPromise;
      
      // Wait for animation to finish if conversion was fast
      await animationControls.then(); // .then() on animation controls waits for finish
      
      setResult(conversionResult);
    } catch (e) {
      addToast("Error", "Conversion failed.", "error");
      animationControls.stop();
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Success", "PDF downloaded!", "success");
  };

  const reset = () => {
    setFile(null);
    setColorPreview(null);
    setGrayPreview(null);
    setResult(null);
    setIsScanning(false);
    scanProgress.set(0);
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <ToolLandingLayout
            title="Grayscale PDF"
            description="Convert color PDFs to high-quality black and white. Ideal for printing and archiving."
            icon={<Monitor />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isPreparing}
            accentColor="text-slate-600"
            specs={[
              { label: "Mode", value: "Grayscale", icon: <Palette /> },
              { label: "Format", value: "Original", icon: <FileText /> },
              { label: "Privacy", value: "Client-Side", icon: <Lock /> },
              { label: "Speed", value: "Fast", icon: <Zap /> },
            ]}
            tip="Converting to grayscale can significantly reduce ink usage and file size for scanned documents."
          />
        ) : (
          <motion.div 
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6"
          >
            <div className="w-full max-w-5xl mx-auto bg-white dark:bg-charcoal-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-charcoal-700 flex flex-col md:flex-row h-full md:h-[600px] ring-1 ring-black/5">
                
                {/* Left Panel: The Visualizer */}
                <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50 dark:bg-black/20">
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        {/* --- THE SCANNER CONTAINER --- */}
                        <div className="relative shrink-1 min-h-0 rounded-xl shadow-xl overflow-hidden ring-1 ring-slate-200 dark:ring-charcoal-700 bg-white dark:bg-charcoal-800 max-h-full aspect-[1/1.4]">
                            {/* 1. Base Layer: Color Preview */}
                            {colorPreview && (
                            <img 
                                src={colorPreview} 
                                alt="Original" 
                                className="block w-full h-full object-contain transition-opacity duration-500 bg-white dark:bg-charcoal-800"
                                style={{ opacity: 1 }} 
                            />
                            )}

                            {/* 2. Top Layer: Grayscale Preview (Masked) */}
                            {grayPreview && (
                            <motion.div
                                style={{ clipPath }}
                                className="absolute inset-0 z-10 bg-white dark:bg-charcoal-800 pointer-events-none"
                            >
                                <img 
                                src={grayPreview} 
                                alt="Grayscale" 
                                className="w-full h-full object-contain"
                                />
                            </motion.div>
                            )}

                            {/* 3. The Scanner Bar */}
                            <motion.div 
                                style={{ top: scannerTop, opacity: scannerOpacity }}
                                className="absolute left-0 right-0 h-1 bg-brand-purple shadow-[0_0_20px_4px_rgba(124,58,237,0.6)] z-20 pointer-events-none"
                            >
                                <div className="absolute right-2 -top-8 text-[10px] font-mono text-brand-purple font-bold bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-brand-purple/20">
                                    PROCESSING
                                </div>
                            </motion.div>

                            {/* Status Badge */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                                {!result && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="px-3 py-1 rounded-full bg-charcoal-900/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-charcoal-900 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
                                    >
                                        <Sparkles size={12} className="text-brand-purple animate-pulse" />
                                        Scanning
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Actions */}
                <div className="w-full md:w-80 bg-white dark:bg-charcoal-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-charcoal-700 p-6 flex flex-col gap-6 shrink-0 relative z-20">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={14} className="text-charcoal-400" />
                            <h4 className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-widest font-mono">File Manifest</h4>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-charcoal-800 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm mb-4">
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-charcoal-900 dark:text-white truncate font-mono mb-1">{file.file.name}</div>
                                <div className="text-[10px] text-charcoal-500 dark:text-slate-400 font-mono">{(file.file.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                        </div>

                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20"
                            >
                                <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 font-mono uppercase tracking-wide">Optimization Complete</div>
                                <div className="text-[10px] text-green-600 dark:text-green-300 font-mono">
                                    New size: {(result.newSize / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-charcoal-700 md:border-none md:pt-0">
                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div key="done" className="space-y-3 w-full">
                                    <motion.button
                                        whileTap={buttonTap}
                                        onClick={handleDownload}
                                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold font-mono text-sm rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download size={16} /> DOWNLOAD_PDF
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div key="processing" className="w-full py-4 bg-slate-100 dark:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-charcoal-700">
                                    <span className="animate-pulse">PROCESSING_IMAGE_DATA...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button
                            onClick={reset}
                            whileTap={buttonTap}
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl font-bold font-mono text-[10px] text-charcoal-500 dark:text-charcoal-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors uppercase tracking-wide"
                        >
                            <RefreshCw size={12} /> RESET_SYSTEM
                        </motion.button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
