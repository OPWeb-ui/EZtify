import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { CompressionLevel, CompressionResult, PdfFile } from '../types';
import { compressPDF } from '../services/pdfCompressor';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';
import { Minimize2, CheckCircle, ArrowLeft, Download, RefreshCcw, X, Loader2, Plus, FileText, FolderArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';
import { useDropzone, FileRejection } from 'react-dropzone';

export const CompressPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [level, setLevel] = useState<CompressionLevel>('normal');
  const [results, setResults] = useState<Map<string, CompressionResult>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload PDF files only.", "error");
      return;
    }
    const currentCount = files.length;
    if (currentCount >= 10) {
      addToast("Limit Reached", "You can compress up to 10 files at once.", "warning");
      return;
    }

    const filesToAdd = acceptedFiles.slice(0, 10 - currentCount);
    if (filesToAdd.length < acceptedFiles.length) {
      addToast("Limit Reached", `Added ${filesToAdd.length} files to reach the 10 file limit.`, "warning");
    }
    
    const newPdfFiles: PdfFile[] = filesToAdd
      .filter(f => f.type === 'application/pdf')
      .map(file => ({ id: nanoid(), file }));

    if (newPdfFiles.length > 0) {
        setFiles(prev => [...prev, ...newPdfFiles]);
        setResults(new Map());
        addToast("Success", `Added ${newPdfFiles.length} PDFs for compression.`, "success");
    }
  }, [addToast, files]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    const newResults = new Map<string, CompressionResult>();

    for (let i = 0; i < files.length; i++) {
        const pdfFile = files[i];
        setStatus(`Compressing ${i + 1}/${files.length}...`);
        try {
            const result = await compressPDF(pdfFile, level);
            newResults.set(pdfFile.id, {
                ...result,
                status: 'Success'
            });
        } catch (e) {
            console.error(`Failed to compress ${pdfFile.file.name}`, e);
            newResults.set(pdfFile.id, {
                id: pdfFile.id,
                originalFileName: pdfFile.file.name,
                originalSize: pdfFile.file.size,
                newSize: 0,
                blob: new Blob(),
                fileName: "Error",
                status: 'Failed'
            });
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setResults(newResults);
    setIsGenerating(false);
    setStatus('');
  };

  const handleReset = () => {
    setFiles([]);
    setResults(new Map());
    setStatus('');
    setProgress(0);
  };
  
  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const downloadResult = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    let fileCount = 0;
    results.forEach(result => {
      if(result.status === 'Success') {
        zip.file(result.fileName, result.blob);
        fileCount++;
      }
    });
    if(fileCount === 0) {
      addToast("No files to download", "No files were compressed successfully.", "error");
      return;
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadResult(zipBlob, `EZtify-Compressed-Files.zip`);
  }

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-violet/10" />
               <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                 <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                   <HeroPill>Reduce the file size of your PDF documents while maintaining quality.</HeroPill>
                   <UploadArea onDrop={onDrop} mode="compress-pdf" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}><RotatingText /></motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="compress-pdf" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="workspace" 
            className="flex-1 flex flex-col items-center justify-center p-6 relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none"
            {...getRootProps()}
          >
             <input {...getInputProps()} />
             
             <AnimatePresence>
              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-brand-purple/10 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-brand-purple rounded-3xl pointer-events-none"
                >
                  <div className="text-center text-brand-purple">
                    <Plus size={64} className="mx-auto mb-4 animate-pulse" />
                    <p className="text-2xl font-bold">Drop more PDFs to add</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

             <div className="w-full max-w-2xl relative z-10">
                {/* Standardized Close/Reset Button */}
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }} 
                  whileHover={{ scale: 1.1, rotate: 90 }} 
                  whileTap={{ scale: 0.9 }} 
                  onClick={(e) => { e.stopPropagation(); handleReset(); }} 
                  className="absolute -top-4 -right-4 md:-right-12 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 shadow-md border border-slate-200 dark:border-charcoal-600 transition-all duration-200" 
                  title="Close and Reset"
                >
                  <X size={20} />
                </motion.button>

                <AnimatePresence mode="wait">
                  {results.size === 0 ? (
                    <motion.div key="options" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}>
                      <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl shadow-brand-purple/5 border border-slate-100 dark:border-charcoal-700 p-6 space-y-4">
                        <div className="max-h-[30vh] overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2">
                          {files.map(f => (
                            <motion.div key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-charcoal-900/50 rounded-lg">
                              <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-charcoal-700 dark:text-slate-300 truncate flex-1">{f.file.name}</span>
                              <span className="text-xs font-mono text-charcoal-400 dark:text-slate-500">{(f.file.size / 1024 / 1024).toFixed(2)}MB</span>
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(f.id); }} className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 text-charcoal-400 hover:text-rose-500"><X size={14} /></button>
                            </motion.div>
                          ))}
                        </div>
                        <motion.button whileTap={buttonTap} onClick={(e) => { e.stopPropagation(); open(); }} className="w-full text-center py-2 text-sm font-bold text-brand-purple border-2 border-dashed border-slate-200 dark:border-charcoal-700 rounded-lg hover:border-brand-purple/50 transition-colors flex items-center justify-center gap-1.5"><Plus size={14} /> Add More Files</motion.button>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setLevel('normal'); }} className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${level === 'normal' ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-brand-purple/30'}`}><div className="font-bold text-charcoal-800 dark:text-white mb-1">Normal</div><div className="text-xs text-charcoal-500 dark:text-slate-400">Good quality.</div>{level === 'normal' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}</motion.button>
                           <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setLevel('strong'); }} className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${level === 'strong' ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-brand-purple/30'}`}><div className="font-bold text-charcoal-800 dark:text-white mb-1">Strong</div><div className="text-xs text-charcoal-500 dark:text-slate-400">Max compression.</div>{level === 'strong' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}</motion.button>
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={(e) => { e.stopPropagation(); handleCompress(); }} disabled={isGenerating} className="mt-6 w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all disabled:opacity-50 disabled:cursor-wait relative overflow-hidden">
                         {isGenerating ? (<div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-medium">{status || 'Compressing...'}{' '}{progress > 0 && progress < 100 && `(${progress}%)`}</span></div>) : `Compress ${files.length} Files`}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                      <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl shadow-brand-purple/5 border border-slate-100 dark:border-charcoal-700 p-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {Array.from(results.values()).map((res: CompressionResult) => (
                          <div key={res.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-charcoal-900/50 rounded-lg">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${res.status === 'Success' ? 'bg-brand-mint/10 text-brand-mint' : 'bg-rose-500/10 text-rose-500'}`}>
                              {res.status === 'Success' ? <CheckCircle size={16} /> : <X size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal-700 dark:text-slate-300 truncate">{res.originalFileName}</p>
                              {res.status === 'Success' ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-charcoal-400 dark:text-slate-500 line-through">{(res.originalSize / 1024 / 1024).toFixed(2)}MB</span>
                                  <ArrowLeft className="w-3 h-3 text-charcoal-300 dark:text-slate-600 rotate-180" />
                                  <span className="font-bold text-brand-purple">{(res.newSize / 1024 / 1024).toFixed(2)}MB</span>
                                  <span className="px-1.5 py-0.5 bg-brand-mint/20 text-brand-mint text-[10px] font-bold rounded-full">-{Math.round((1 - res.newSize / res.originalSize) * 100)}%</span>
                                </div>
                              ) : <p className="text-xs text-rose-500">Failed</p>}
                            </div>
                            {res.status === 'Success' && <motion.button whileTap={buttonTap} onClick={(e) => { e.stopPropagation(); downloadResult(res.blob, res.fileName); }} className="p-2 text-charcoal-400 hover:text-brand-purple"><Download size={16} /></motion.button>}
                          </div>
                        ))}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={(e) => { e.stopPropagation(); downloadAllAsZip(); }} className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2"><FolderArchive size={20} /> Download All (.zip)</motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); handleReset(); }} className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"><RefreshCcw size={14} /> Compress More</motion.button>
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