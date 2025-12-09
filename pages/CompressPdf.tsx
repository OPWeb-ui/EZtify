import React, { useState, useCallback } from 'react';
import { useToast } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { CompressionLevel, CompressionResult } from '../types';
import { compressPDF } from '../services/pdfCompressor';
import { Minimize2, CheckCircle, ArrowLeft, Download, RefreshCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { useDropzone, FileRejection } from 'react-dropzone';

export const CompressPdfPage: React.FC = () => {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('normal');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const isImage = fileRejections.some(r => r.file.type.startsWith('image/'));
      if (isImage) {
        addToast("Incorrect File Type", "Image detected. Please upload a PDF file.", "error");
      } else {
        addToast("Invalid File", "Please upload a PDF file.", "error");
      }
      return;
    }

    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    if (f.type !== 'application/pdf') {
      addToast("Invalid File", "Please upload a PDF.", "error");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      addToast("Large File", "Processing large files may take longer.", "warning");
    }
    setFile(f);
    setResult(null);
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleCompress = async () => {
    if (!file) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      requestAnimationFrame(async () => {
        try {
          const res = await compressPDF(file, level, setProgress);
          setResult(res);
        } catch (e) {
          addToast("Error", "Compression failed.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!file ? (
        <motion.div
          key="hero"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
        >
          <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob bg-brand-violet/10" />
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
               <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                 Make Your PDF Smaller <br/> in One Click
               </h2>
               
               <HeroPill>
                  <span className="font-bold text-brand-violet">Compress PDF</span> reduces file size efficiently while maintaining quality. 
                  Optimization happens locally on your device for maximum privacy and speed.
               </HeroPill>

               <div className="w-full max-w-xl mb-8 relative z-20">
                 <UploadArea onDrop={onDrop} mode="compress-pdf" disabled={isGenerating} />
               </div>
               <RotatingText />
             </div>
          </section>

          <AdSlot zone="hero" />

          <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
            <HowItWorks mode="compress-pdf" />
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
          className="flex-1 flex flex-col items-center justify-center p-6 relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)]"
        >
           
           <div className="w-full max-w-lg relative z-10">
              
              {/* CLOSE BUTTON */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={buttonTap}
                onClick={handleReset}
                className="absolute top-0 -right-4 md:-right-12 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-charcoal-800/90 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 shadow-md backdrop-blur-sm border border-slate-200 dark:border-charcoal-700 transition-colors"
                title="Close and Reset"
              >
                <X size={20} />
              </motion.button>

              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-xl shadow-brand-purple/5 border border-slate-100 dark:border-charcoal-700 text-center mb-6">
                 <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <Minimize2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-charcoal-800 dark:text-white truncate px-4">{file.name}</h3>
                 <p className="text-charcoal-500 dark:text-slate-400 font-mono text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>

              <AnimatePresence mode="wait">
                {!result ? (
                   <motion.div 
                     key="options"
                     className="space-y-6"
                     initial={{ opacity: 0, y: 20, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -20, scale: 0.95 }}
                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
                   >
                      <div className="grid grid-cols-2 gap-4">
                         <motion.button
                           whileHover={{ scale: 1.03, y: -2 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setLevel('normal')}
                           className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${level === 'normal' ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-brand-purple/30'}`}
                         >
                            <div className="font-bold text-charcoal-800 dark:text-white mb-1">Normal</div>
                            <div className="text-xs text-charcoal-500 dark:text-slate-400">Optimized structure.</div>
                            {level === 'normal' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}
                         </motion.button>
                         <motion.button
                           whileHover={{ scale: 1.03, y: -2 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setLevel('strong')}
                           className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${level === 'strong' ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-brand-purple/30'}`}
                         >
                            <div className="font-bold text-charcoal-800 dark:text-white mb-1">Strong</div>
                            <div className="text-xs text-charcoal-500 dark:text-slate-400">Max compression.</div>
                            {level === 'strong' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}
                         </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleCompress}
                        disabled={isGenerating}
                        className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all disabled:opacity-50 disabled:cursor-wait relative overflow-hidden"
                      >
                         {isGenerating ? (
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Compressing {progress > 0 && `${Math.round(progress)}%`}...</span>
                           </div>
                         ) : "Compress PDF Now"}
                      </motion.button>
                      
                      <AdSlot zone="sidebar" className="!my-4" />
                   </motion.div>
                ) : (
                   <motion.div 
                     key="result"
                     className="space-y-6"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
                   >
                      <div className="bg-brand-mint/10 border border-brand-mint/20 rounded-2xl p-6 text-center">
                         <div className="text-brand-mint mb-2 flex justify-center"><CheckCircle size={48} /></div>
                         <h3 className="text-xl font-bold text-charcoal-800 dark:text-white">Ready to Download!</h3>
                         <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                            <div className="text-charcoal-400 dark:text-slate-500 line-through">{(result.originalSize / (1024 * 1024)).toFixed(2)} MB</div>
                            <ArrowLeft className="w-4 h-4 text-charcoal-300 dark:text-slate-600 rotate-180" />
                            <div className="text-brand-purple font-bold text-lg">{(result.newSize / (1024 * 1024)).toFixed(2)} MB</div>
                         </div>
                         <div className="mt-2 inline-block px-3 py-1 bg-brand-mint text-white text-xs font-bold rounded-full">
                            Saved {Math.round((1 - result.newSize / result.originalSize) * 100)}%
                         </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={downloadResult}
                        className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2"
                      >
                         <Download size={20} /> Download Compressed PDF
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setFile(null); setResult(null); }}
                        className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                      >
                         <RefreshCcw size={14} /> Compress another file
                      </motion.button>
                      
                      <AdSlot zone="sidebar" />
                   </motion.div>
                )}
              </AnimatePresence>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};