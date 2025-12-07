import React, { useState, useCallback } from 'react';
import { useToast } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { Sidebar } from '../components/Sidebar';
import { StickyBar } from '../components/StickyBar';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { generateZip } from '../services/zipGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderInput, Download, Check } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { buttonTap } from '../utils/animations';

export const PdfToImagePage: React.FC = () => {
  const { addToast } = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConfirm, setShowConfirm] = useState(false);

  // Config State
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'auto', // Use auto to match extracted PDF page dimensions
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.9,
    scale: 1
  });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processPdf = async (file: File) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const extracted = await extractImagesFromPdf(file, setProgress);
      if (extracted.length === 0) {
        addToast("Error", "No images found or PDF is empty.", "error");
      } else {
        setImages(extracted);
        setActiveImageId(extracted[0].id);
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to process PDF.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // 1. Handle explicit rejections from dropzone
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }

    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // 2. Extra check for file type
    if (file.type !== 'application/pdf') {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }

    if (acceptedFiles.length > 1) {
       addToast("Single File", "Please upload one PDF at a time.", "warning");
    }

    processPdf(file);
  }, [addToast]);

  // Dropzone for replacing the PDF (New Batch)
  const { getRootProps: getReplaceRoot, getInputProps: getReplaceInput, open: openReplace } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: true,
    noKeyboard: true
  });

  const handleRotate = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      requestAnimationFrame(async () => {
        try {
          await generateZip(images, exportConfig, setProgress);
        } catch (e) {
          addToast("Error", "Export failed.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const handleDownloadCurrent = async () => {
    const activeImage = images.find(img => img.id === activeImageId);
    if (!activeImage) return;

    try {
      // Create canvas to process image (rotation + format)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = activeImage.previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Handle Rotation logic
      const isRotatedSideways = activeImage.rotation === 90 || activeImage.rotation === 270;
      canvas.width = isRotatedSideways ? img.height : img.width;
      canvas.height = isRotatedSideways ? img.width : img.height;

      // Fill background for JPEGs
      if (exportConfig.format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((activeImage.rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Export
      const mimeType = exportConfig.format === 'png' ? 'image/png' : 'image/jpeg';
      const extension = exportConfig.format === 'png' ? 'png' : 'jpg';
      
      const dataUrl = canvas.toDataURL(mimeType, exportConfig.quality);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      const pageIndex = images.indexOf(activeImage) + 1;
      link.download = `Page-${pageIndex}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast("Saved", `Page ${pageIndex} downloaded as ${extension.toUpperCase()}`, "warning"); 
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to download image", "error");
    }
  };

  const handleNewBatch = () => {
    if (images.length > 0) {
      setShowConfirm(true);
    } else {
      openReplace();
    }
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0); // Approx size

  return (
    <AnimatePresence mode="wait">
      {images.length === 0 ? (
        <motion.div
          key="hero"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
        >
          <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob bg-brand-mint/10" />
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
               <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                 Turn Your PDF Pages <br/> Into Images in Seconds
               </h2>
               <div className="w-full max-w-xl my-6 md:my-8 relative z-20">
                 <UploadArea onDrop={onDrop} mode="pdf-to-image" disabled={isGenerating} />
               </div>
               <RotatingText />
             </div>
          </section>

          <AdSlot zone="hero" />

          <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
            <HowItWorks mode="pdf-to-image" />
            <AdSlot zone="footer" />
            <FAQ />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="workspace"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 0.9, 
            filter: "blur(10px)",
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="flex-1 flex flex-col md:flex-row relative h-[100dvh] overflow-hidden"
        >
          {/* Hidden Replace Input */}
          <div {...getReplaceRoot({ className: 'hidden' })}>
            <input {...getReplaceInput()} />
          </div>

          <Sidebar 
            mode="pdf-to-image"
            config={config} 
            onConfigChange={setConfig} 
            exportConfig={exportConfig}
            onExportConfigChange={setExportConfig}
            isOpen={isSidebarOpen} 
          />

          <div className="flex-1 flex flex-col relative h-full bg-slate-50/30 dark:bg-charcoal-900/30 overflow-hidden">
            
            {/* 1. PREVIEW AREA */}
            <div className="flex-1 relative min-h-0 w-full flex flex-col">
               <Preview 
                 image={activeImage} 
                 config={config} 
                 onReplace={() => {}} // Disabled for PDF pages
                 onDropRejected={() => {}}
                 onClose={handleReset}
               />
               
               {/* Floating Download Button (Correctly aligned with Close button) */}
               <div className="absolute top-4 right-16 md:top-8 md:right-20 z-20">
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={buttonTap}
                    onClick={handleDownloadCurrent}
                    className="h-10 px-4 flex items-center gap-2 rounded-xl bg-white/90 dark:bg-charcoal-800/90 backdrop-blur border border-slate-200 dark:border-charcoal-600 shadow-sm text-charcoal-700 dark:text-slate-200 hover:bg-white dark:hover:bg-charcoal-700 hover:border-brand-mint/30 transition-colors group"
                  >
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform text-brand-mint" />
                      <span className="text-sm font-bold text-brand-mint">Save Page</span>
                  </motion.button>
               </div>
            </div>
            
            {/* 2. FILMSTRIP (Fixed height wrapper) */}
            <div className="flex-none z-10 border-t border-pastel-border bg-white/80 dark:bg-charcoal-900/80 backdrop-blur pb-20 md:pb-24">
              <Filmstrip 
                images={images} 
                activeImageId={activeImageId}
                onReorder={setImages}
                onSelect={setActiveImageId}
                onRemove={handleRemove}
                onRotate={handleRotate}
                isMobile={isMobile}
                className="pt-2"
              />
            </div>

            {/* 3. STICKY BAR */}
            <StickyBar 
              imageCount={images.length} 
              totalSize={totalSize} 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating} 
              progress={progress}
              mode="pdf-to-image"
              onSecondaryAction={handleNewBatch}
              secondaryLabel="New PDF"
              secondaryIcon={<FolderInput className="w-4 h-4" />}
            />
          </div>

          {/* Confirmation Modal */}
          <AnimatePresence>
            {showConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ pointerEvents: 'auto' }}>
                 {/* Backdrop */}
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfirm(false)}
                    className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
                 />
                 {/* Modal */}
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 10 }}
                   className="relative bg-white dark:bg-charcoal-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-charcoal-700 overflow-hidden"
                 >
                   <h3 className="text-lg font-heading font-bold text-charcoal-800 dark:text-white mb-2">Open New PDF?</h3>
                   <p className="text-sm text-charcoal-500 dark:text-slate-400 mb-6 leading-relaxed">
                     This will remove the current pages and start fresh. Any unsaved exports will be lost.
                   </p>
                   <div className="flex justify-end gap-3">
                     <button 
                       onClick={() => setShowConfirm(false)}
                       className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={() => {
                         setShowConfirm(false);
                         openReplace();
                       }}
                       className="px-4 py-2 text-sm font-bold text-white bg-brand-purple hover:bg-brand-purpleDark rounded-lg shadow-lg shadow-brand-purple/20 transition-colors"
                     >
                       Yes, Open New
                     </button>
                   </div>
                 </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};