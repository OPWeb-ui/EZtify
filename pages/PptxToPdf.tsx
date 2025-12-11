

import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPptxToPdf } from '../services/pptxConverter';
import { Download, RefreshCcw, CheckCircle, Presentation, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const PptxToPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
       addToast("Invalid File", "Please upload a .pptx file.", "error");
       return;
    }

    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    // Extra validation
    if (!f.name.toLowerCase().endsWith('.pptx')) {
       addToast("Unsupported Format", "Only .pptx files are supported.", "error");
       return;
    }

    setIsProcessingFiles(true);
    setTimeout(() => {
      setFile(f);
      setIsProcessingFiles(false);
    }, 600);
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    noClick: true,
    noKeyboard: true,
    multiple: false
  });

  const handleConvert = async () => {
    if (!file) return;

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting conversion...');

    try {
       // Small delay to allow UI to update
       setTimeout(async () => {
          try {
             const blob = await convertPptxToPdf(file, setProgress, setStatus);
             
             // Derive filename
             const originalName = file.name;
             const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
             const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
             const name = `${safeName}_EZtify.pdf`;

             setResult({ blob, name });
          } catch (e) {
             console.error(e);
             addToast("Conversion Failed", "Could not convert this presentation.", "error");
          } finally {
             setIsGenerating(false);
             setProgress(0);
             setStatus('');
          }
       }, 50);
    } catch (e) {
       setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('');
    setProgress(0);
  };

  return (
    <>
      <SEO 
        title="PPTX to PDF Online – EZtify"
        description="Convert PowerPoint (PPTX) slides to PDF in your browser. 100% private and client-side conversion."
        canonical="https://eztify.pages.dev/#/pptx-to-pdf"
      />
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-orange-500/10" />
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
                >
                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                    <HeroPill>Convert PowerPoint slides (PPTX) to PDF in your browser.</HeroPill>
                    <UploadArea onDrop={onDrop} mode="pptx-to-pdf" disabled={isGenerating} isProcessing={isProcessingFiles} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <RotatingText />
                  </motion.div>
                </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="pptx-to-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            className="flex-1 flex flex-col items-center justify-center p-6 relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none"
            {...getRootProps({ onClick: (e) => e.stopPropagation() })}
          >
             <input {...getInputProps()} />
             
             <DragDropOverlay 
                isDragActive={isDragActive} 
                message="Drop to Replace" 
                variant="pptOrange"
             />

             <div className="w-full max-w-md bg-white dark:bg-charcoal-900 rounded-3xl shadow-xl border border-slate-100 dark:border-charcoal-800 p-8 text-center relative overflow-hidden">
                {!result ? (
                   <>
                      <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-500">
                         <Presentation size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-800 dark:text-white truncate px-4 mb-2">{file.name}</h3>
                      <p className="text-sm text-charcoal-500 dark:text-slate-400 mb-6">{(file.size / 1024).toFixed(0)} KB</p>
                      
                      <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-3 mb-6 text-xs text-orange-600 dark:text-orange-300 flex items-start gap-2 text-left">
                         <Info size={16} className="shrink-0 mt-0.5" />
                         <p>Converts slide content to PDF pages. Complex animations will be ignored.</p>
                      </div>

                      <div className="flex flex-col gap-3">
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.96 }}
                           onClick={handleConvert}
                           disabled={isGenerating}
                           className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">
                                   {status || 'Converting...'}{' '}
                                   {progress > 0 && progress < 100 && `(${Math.round(progress)}%)`}
                                </span>
                              </>
                            ) : "Convert to PDF"}
                         </motion.button>
                         
                         <button onClick={reset} disabled={isGenerating} className="text-sm text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors">
                            Cancel
                         </button>
                      </div>
                   </>
                ) : (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                         <CheckCircle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-800 dark:text-white mb-2">Ready!</h3>
                      <p className="text-sm text-charcoal-500 dark:text-slate-400 mb-6">Your presentation has been converted.</p>
                      
                      <div className="flex flex-col gap-3">
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.96 }}
                           onClick={downloadResult}
                           className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/20 transition-all flex items-center justify-center gap-2"
                         >
                            <Download size={20} /> Download PDF
                         </motion.button>
                         
                         <button onClick={reset} className="text-sm font-medium text-charcoal-500 hover:text-brand-purple flex items-center justify-center gap-2 mt-2">
                            <RefreshCcw size={14} /> Convert Another
                         </button>
                      </div>
                   </motion.div>
                )}
             </div>
             
             <AdSlot zone="sidebar" className="mt-8" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};