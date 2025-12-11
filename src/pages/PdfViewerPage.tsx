
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { HeroPill } from '../components/HeroPill';
import { RotatingText } from '../components/RotatingText';
import { PdfViewer } from '../components/viewers/PdfViewer';
import { FileText, X, Download, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { staggerContainer, fadeInUp, buttonTap } from '../utils/animations';

export const PdfViewerPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [scale, setScale] = useState(0.7);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
       addToast("Unsupported File", "Please upload a PDF file.", "error");
       return;
    }

    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    if (f.type !== 'application/pdf') {
       addToast("Unsupported Format", "Only PDF files are supported.", "error");
       return;
    }

    setIsProcessingFiles(true);
    setTimeout(() => {
        setFile(f);
        setScale(0.7); 
        setIsProcessingFiles(false);
    }, 600);
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    multiple: false
  });

  const closeViewer = () => {
    setFile(null);
  };

  const handleDownload = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));

  return (
    <>
      <SEO 
        title="PDF Viewer Online – View PDF in Browser – EZtify"
        description="View PDF documents directly in your browser. Private, secure, no uploads required. Fast PDF reader."
        canonical="https://eztify.pages.dev/#/pdf-viewer"
      />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-teal-500/10" />
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
                >
                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                    <HeroPill>Securely view PDF documents directly in your browser.</HeroPill>
                    <UploadArea onDrop={onDrop} mode="pdf-viewer" disabled={false} isProcessing={isProcessingFiles} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <RotatingText />
                  </motion.div>
                </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="pdf-viewer" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Strict flex column layout filling height
            className="flex flex-col h-full w-full bg-slate-50 dark:bg-charcoal-950 overflow-hidden relative"
            {...getRootProps({ onClick: (e) => e.stopPropagation() })}
          >
             <input {...getInputProps()} />
             <DragDropOverlay isDragActive={isDragActive} message="Drop to switch PDF" variant="green" />

             {/* 
                 TOP HEADER BAR 
                 flex-none ensures it doesn't shrink. 
                 z-50 ensures it's above PDF content.
             */}
             <div className="flex-none h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between shadow-sm z-50 relative">
                
                {/* File Info */}
                <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-4">
                   <div className="p-2 bg-slate-100 dark:bg-charcoal-800 rounded-lg text-charcoal-500 hidden sm:block">
                      <FileText size={18} />
                   </div>
                   <div className="truncate">
                      <h3 className="font-bold text-sm text-charcoal-800 dark:text-white truncate max-w-[200px] md:max-w-[400px]">{file.name}</h3>
                   </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                   
                   {/* Zoom Controls in Header (Backup) */}
                   <div className="flex items-center bg-slate-100 dark:bg-charcoal-800 rounded-lg p-1">
                      <button 
                        onClick={handleZoomOut} 
                        disabled={scale <= 0.4} 
                        className="p-1.5 text-charcoal-500 hover:text-charcoal-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors rounded-md hover:bg-white dark:hover:bg-charcoal-700" 
                        title="Zoom Out"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className="text-xs font-mono font-bold w-10 text-center text-charcoal-600 dark:text-slate-300 select-none">
                        {Math.round(scale * 100)}%
                      </span>
                      <button 
                        onClick={handleZoomIn} 
                        disabled={scale >= 3.0} 
                        className="p-1.5 text-charcoal-500 hover:text-charcoal-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors rounded-md hover:bg-white dark:hover:bg-charcoal-700" 
                        title="Zoom In"
                      >
                        <ZoomIn size={16} />
                      </button>
                   </div>

                   <motion.button
                     whileTap={buttonTap}
                     onClick={handleDownload}
                     className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-bold shadow-lg shadow-brand-purple/20 hover:bg-brand-purpleDark transition-colors"
                   >
                      <Download size={16} /> Download
                   </motion.button>

                   <motion.button 
                     whileTap={buttonTap}
                     onClick={closeViewer} 
                     className="p-2 hover:bg-rose-50 hover:text-rose-500 text-charcoal-400 rounded-lg transition-colors" 
                     title="Close"
                   >
                      <X size={20} />
                   </motion.button>
                </div>
             </div>

             {/* Content Area - Fills remaining height */}
             <div className="flex-1 min-h-0 relative w-full">
                <PdfViewer 
                  file={file} 
                  scale={scale}
                  onScaleChange={setScale}
                />
             </div>
             
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
