import React, { useState, useCallback } from 'react';
import { useToast } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { ZipFile, ZipCompressionLevel } from '../types';
import { generateGenericZip } from '../services/genericZipService';
import { nanoid } from 'nanoid';
import { FolderArchive, Download, RefreshCcw, X, File as FileIcon, Archive, CheckCircle, Info } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { Tooltip } from '../components/Tooltip';

export const ZipFilesPage: React.FC = () => {
  const { addToast } = useToast();
  const [files, setFiles] = useState<ZipFile[]>([]);
  const [result, setResult] = useState<{ blob: Blob, size: number, count: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState<ZipCompressionLevel>('DEFLATE');

  const MAX_FILE_SIZE_MB = 100;
  const MAX_TOTAL_SIZE_MB = 300;

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Check constraints
    const currentTotalSize = files.reduce((acc, f) => acc + f.file.size, 0);
    let newTotalSize = currentTotalSize;
    const validNewFiles: ZipFile[] = [];

    acceptedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        addToast("File Too Large", `${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit.`, "error");
        return;
      }
      
      if (newTotalSize + file.size > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
         addToast("Total Limit Exceeded", `Adding ${file.name} would exceed ${MAX_TOTAL_SIZE_MB}MB total.`, "warning");
         return;
      }

      newTotalSize += file.size;
      validNewFiles.push({ id: nanoid(), file });
    });

    if (validNewFiles.length > 0) {
       setFiles(prev => [...prev, ...validNewFiles]);
    }
  }, [files, addToast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    // Accept all files
  });

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleZip = async () => {
    if (files.length === 0) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      requestAnimationFrame(async () => {
         try {
           const blob = await generateGenericZip(files, compressionLevel, setProgress);
           setResult({ blob, size: blob.size, count: files.length });
         } catch (e) {
           console.error(e);
           addToast("Error", "Zip generation failed.", "error");
         } finally {
           setIsGenerating(false);
           setProgress(0);
         }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `EZtify-Archive-${date}-EZtify.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
  };

  const handleClear = () => {
     setFiles([]);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {files.length === 0 ? (
        <motion.div
          key="hero"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
        >
          <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob bg-amber-500/10" />
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
               <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                 Zip It!
               </h2>
               
               {/* Explanation Section */}
               <HeroPill>
                  <span className="font-bold text-amber-500">Zip It!</span> lets you combine multiple files into a single ZIP archive directly in your browser. 
                  Your files are processed locally and never stored on our servers. 
                  For the best experience, file size limits apply.
               </HeroPill>

               <div className="w-full max-w-xl mb-8 relative z-20">
                 <UploadArea onDrop={onDrop} mode="zip-files" disabled={isGenerating} />
                 <div className="flex items-center justify-center mt-4">
                   <Tooltip content="For best performance: Max 100MB per file, 300MB total." side="bottom">
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-400 dark:text-slate-500 font-medium cursor-help hover:text-charcoal-600 transition-colors">
                        <Info size={14} />
                        <span>Max 100MB per file • 300MB total</span>
                      </div>
                   </Tooltip>
                 </div>
               </div>
               
               <RotatingText />
             </div>
          </section>

          <AdSlot zone="hero" />

          <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
            <HowItWorks mode="zip-files" />
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
          className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto custom-scrollbar"
        >
          {/* CLOSE BUTTON */}
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

          <div className="w-full max-w-xl mb-20 mt-8">
             <AnimatePresence mode="wait">
                {!result ? (
                   <motion.div
                     key="list"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="bg-white dark:bg-charcoal-900 rounded-3xl shadow-xl border border-slate-100 dark:border-charcoal-800 overflow-hidden"
                   >
                      <div className="p-6 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between bg-slate-50/50 dark:bg-charcoal-800/50">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg">
                               <Archive size={20} />
                            </div>
                            <div>
                               <h3 className="font-bold text-charcoal-800 dark:text-white">Files to Zip</h3>
                               <p className="text-xs text-charcoal-500 dark:text-slate-400">
                                  {files.length} items • {(files.reduce((a,b) => a + b.file.size, 0) / (1024*1024)).toFixed(1)} MB
                               </p>
                            </div>
                         </div>
                         <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={buttonTap}
                            onClick={handleClear}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
                         >
                            Clear All
                         </motion.button>
                      </div>

                      <div className="max-h-[40vh] overflow-y-auto custom-scrollbar p-2">
                         <AnimatePresence mode="popLayout">
                            {files.map((f) => (
                               <motion.div
                                 key={f.id}
                                 layout
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                                 className="flex items-center justify-between p-3 mb-2 bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 rounded-xl group hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
                               >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="w-8 h-8 rounded bg-slate-100 dark:bg-charcoal-700 flex items-center justify-center text-charcoal-400 shrink-0">
                                        <FileIcon size={14} />
                                     </div>
                                     <div className="truncate">
                                        <p className="text-sm font-medium text-charcoal-700 dark:text-slate-200 truncate">{f.file.name}</p>
                                        <p className="text-[10px] text-charcoal-400 font-mono">{(f.file.size / 1024).toFixed(0)} KB</p>
                                     </div>
                                  </div>
                                  <motion.button
                                     whileHover={{ scale: 1.1, rotate: 90 }}
                                     whileTap={{ scale: 0.9 }}
                                     onClick={() => handleRemove(f.id)}
                                     className="p-2 text-charcoal-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                                     title="Remove File"
                                  >
                                     <X size={16} />
                                  </motion.button>
                               </motion.div>
                            ))}
                         </AnimatePresence>
                      </div>

                      <div className="p-6 border-t border-slate-100 dark:border-charcoal-800 bg-slate-50/50 dark:bg-charcoal-800/50 space-y-4">
                         {/* Compression Settings */}
                         <div className="flex bg-white dark:bg-charcoal-900 rounded-xl p-1 border border-slate-200 dark:border-charcoal-700">
                            <motion.button
                               whileTap={buttonTap}
                               whileHover={{ scale: 1.02 }}
                               onClick={() => setCompressionLevel('STORE')}
                               className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${compressionLevel === 'STORE' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500' : 'text-charcoal-500 hover:bg-slate-50 dark:hover:bg-charcoal-800'}`}
                            >
                               Fast (Store)
                            </motion.button>
                            <motion.button
                               whileTap={buttonTap}
                               whileHover={{ scale: 1.02 }}
                               onClick={() => setCompressionLevel('DEFLATE')}
                               className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${compressionLevel === 'DEFLATE' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500' : 'text-charcoal-500 hover:bg-slate-50 dark:hover:bg-charcoal-800'}`}
                            >
                               Compact (Deflate)
                            </motion.button>
                         </div>

                         {/* Action Button */}
                         <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleZip}
                            disabled={isGenerating || files.length === 0}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                         >
                            {isGenerating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Zipping {progress > 0 && `${Math.round(progress)}%`}...</span>
                              </>
                            ) : (
                              <>
                                <Archive size={18} /> Zip It!
                              </>
                            )}
                         </motion.button>
                      </div>
                   </motion.div>
                ) : (
                   <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-charcoal-900 rounded-3xl shadow-xl border border-slate-100 dark:border-charcoal-800 p-8 text-center"
                   >
                      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                         <CheckCircle size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-charcoal-800 dark:text-white mb-2">Zip Ready!</h3>
                      <p className="text-charcoal-500 dark:text-slate-400 text-sm mb-6">
                         {result.count} files compressed into {(result.size / (1024*1024)).toFixed(2)} MB
                      </p>

                      <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={downloadResult}
                         className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2 mb-4"
                       >
                          <Download size={20} /> Download ZIP
                       </motion.button>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={handleReset}
                         className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                       >
                          <RefreshCcw size={14} /> Create another ZIP
                       </motion.button>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};