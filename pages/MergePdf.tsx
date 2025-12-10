import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { MergeFileList } from '../components/MergeFileList';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile } from '../types';
import { mergePdfs } from '../services/pdfMerger';
import { nanoid } from 'nanoid';
import { Plus, CheckCircle, Download, RefreshCcw, X, Loader2 } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';

export const MergePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [result, setResult] = useState<{ blob: Blob, size: number, count: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const isImage = fileRejections.some(r => r.file.type.startsWith('image/'));
      if (isImage) {
         addToast("Incorrect File Type", "Image detected. Please upload PDF files.", "error");
      } else {
         addToast("Invalid File", "Please upload only PDF files.", "error");
      }
      return;
    }

    if (acceptedFiles.length === 0) return;
    
    const newFiles = acceptedFiles
      .filter(f => f.type === 'application/pdf')
      .map(file => ({ id: nanoid(), file }));
    
    if (newFiles.length < acceptedFiles.length) {
      addToast("Ignored Files", "Only PDF files are supported.", "warning");
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [addToast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleMerge = async () => {
    if (files.length === 0) return;

    if (files.length === 1) {
      addToast("Need More Files", "Please add at least 2 PDF files to merge.", "warning", 3000);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting merge...');
    try {
      setTimeout(async () => {
        try {
          const blob = await mergePdfs(files, setProgress, setStatus);
          setResult({ blob, size: blob.size, count: files.length });
        } catch (e) {
          addToast("Error", "Merge failed.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
        }
      }, 50);
    } catch (e) {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setStatus('');
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EZtify-Merged-EZtify.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-orange/10" />
               <motion.div 
                 variants={staggerContainer}
                 initial="hidden"
                 animate="show"
                 className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
               >
                 <motion.h2 
                   variants={fadeInUp}
                   className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight"
                  >
                   Merge Multiple PDFs <br/> Into One File in One Click
                 </motion.h2>
                 
                 <motion.div variants={fadeInUp}>
                   <HeroPill>
                      <span className="font-bold text-brand-orange">Merge PDF</span> combines multiple documents into one organized file. 
                      Rearrange pages easily and merge instantly without sending files to the cloud.
                   </HeroPill>
                 </motion.div>

                 <motion.div variants={fadeInUp} className="w-full max-w-xl mb-8 relative z-20">
                   <UploadArea onDrop={onDrop} mode="merge-pdf" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}>
                   <RotatingText />
                 </motion.div>
               </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="merge-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto custom-scrollbar"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={buttonTap}
              onClick={handleReset}
              className="absolute top-8 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-charcoal-800/90 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 shadow-md backdrop-blur-sm border border-slate-200 dark:border-charcoal-700 transition-colors"
              title="Close and Reset"
            >
              <X size={20} />
            </motion.button>

            <div className="w-full max-w-lg mb-32 mt-8">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                     <MergeFileList 
                       files={files} 
                       onReorder={setFiles} 
                       onRemove={(id) => setFiles(p => p.filter(x => x.id !== id))} 
                     />
                     
                     <div className="mb-8">
                        <motion.div 
                          {...getRootProps()} 
                          whileHover={{ scale: 1.02, borderColor: '#8B5CF6' }}
                          whileTap={buttonTap}
                          className="border-2 border-dashed border-slate-200 dark:border-charcoal-700 rounded-xl p-4 text-center hover:bg-white dark:hover:bg-charcoal-800 cursor-pointer transition-colors"
                        >
                           <input {...getInputProps()} />
                           <span className="text-sm font-bold text-brand-purple flex items-center justify-center gap-2">
                              <Plus size={16} /> Add more PDFs
                           </span>
                        </motion.div>
                     </div>
                     
                     <AdSlot zone="sidebar" className="!my-4 !min-h-[100px]" />

                     <div className="sticky bottom-4 z-30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          animate={shouldShake ? { x: [0, -10, 10, -10, 10, 0], backgroundColor: "#F43F5E" } : { x: 0, backgroundColor: "#8B5CF6" }}
                          transition={{ duration: 0.4 }}
                          onClick={handleMerge}
                          disabled={isGenerating}
                          className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all disabled:opacity-50 disabled:cursor-wait relative overflow-hidden"
                        >
                           {isGenerating ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">
                                  {status || 'Merging...'}{' '}
                                  {progress > 0 && progress < 100 && `(${progress}%)`}
                                </span>
                              </div>
                           ) : "Merge PDFs Now"}
                        </motion.button>
                     </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="space-y-6 mt-12"
                  >
                       <div className="bg-brand-mint/10 border border-brand-mint/20 rounded-2xl p-6 text-center">
                          <div className="text-brand-mint mb-2 flex justify-center"><CheckCircle size={48} /></div>
                          <h3 className="text-xl font-bold text-charcoal-800 dark:text-white">Merge Complete!</h3>
                          <p className="text-charcoal-500 dark:text-slate-400 mt-2 text-sm">Successfully merged {result.count} files.</p>
                          <div className="text-brand-purple font-bold text-lg mt-1">{(result.size / (1024 * 1024)).toFixed(2)} MB</div>
                       </div>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.96 }}
                         onClick={downloadResult}
                         className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2"
                         >
                          <Download size={20} /> Download Merged PDF
                       </motion.button>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={() => { setFiles([]); setResult(null); }}
                         className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                       >
                          <RefreshCcw size={14} /> Merge more files
                       </motion.button>
                       
                       <AdSlot zone="sidebar" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};