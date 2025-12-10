import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { HeroPill } from '../components/HeroPill';
import { Skeleton } from '../components/Skeleton';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, SplitMode } from '../types';
import { loadPdfPages, extractPagesToPdf, splitPagesToZip } from '../services/pdfSplitter';
import { Download, RefreshCcw, CheckCircle, Scissors, X, Loader2, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';
import { useDropzone, FileRejection } from 'react-dropzone';

export const SplitPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('extract');
  const [result, setResult] = useState<{ blob: Blob, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [customRange, setCustomRange] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
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
      addToast("Large File", "Loading preview might take a moment.", "warning");
    }

    setFile(f);
    setIsGenerating(true);
    setStatus('Loading PDF...');
    setProgress(0);
    
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      if (loadedPages.length === 0) {
        addToast("Error", "No pages found in PDF.", "error");
        setFile(null);
      } else {
        if (loadedPages.length === 1) {
           addToast("Single Page PDF", "This document only has one page. Nothing to split.", "warning", 5000);
        }
        setPages(loadedPages);
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to load PDF pages.", "error");
      setFile(null);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const togglePageSelection = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleSelectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const handleDeselectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleInvertSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: !p.selected })));
  };

  const handleRemovePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleRemoveSelected = () => {
    setPages(prev => prev.filter(p => !p.selected));
  };

  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    const indices = new Set<number>();
    const parts = rangeStr.split(',');

    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;

      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n, 10));
        if (!isNaN(start) && !isNaN(end)) {
          const s = Math.max(1, Math.min(start, end));
          const e = Math.min(totalPages, Math.max(start, end));
          for (let i = s; i <= e; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(trimmed, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indices.add(pageNum - 1);
        }
      }
    });

    return Array.from(indices);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomRange(val);

    if (!val.trim()) return;

    const selectedIndices = parsePageRange(val, pages.length);
    setPages(prev => prev.map((p, idx) => ({
      ...p,
      selected: selectedIndices.includes(idx)
    })));
  };

  const handleSplit = async () => {
    if (!file) return;
    const selectedIndices = pages.filter(p => p.selected).map(p => p.pageIndex);
    
    if (selectedIndices.length === 0) {
      addToast("No Selection", "Please select at least one page.", "warning");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting...');

    try {
      setTimeout(async () => {
        let blob: Blob;
        let filename: string;

        try {
          if (splitMode === 'extract') {
            blob = await extractPagesToPdf(file, selectedIndices, setProgress, setStatus);
            filename = `EZtify-Extracted-EZtify.pdf`;
          } else {
            blob = await splitPagesToZip(file, selectedIndices, setProgress, setStatus);
            filename = `EZtify-Split-Pages-EZtify.zip`;
          }
          setResult({ blob, name: filename });
        } catch (innerError) {
          console.error(innerError);
          addToast("Error", "Operation failed.", "error");
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
    setPages([]);
    setResult(null);
    setCustomRange('');
    setStatus('');
  };

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-mint/10" />
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
                    Split & Extract PDF Pages <br/> in One Click
                  </motion.h2>
                  
                  <motion.div variants={fadeInUp}>
                    <HeroPill>
                      <span className="font-bold text-brand-blue">Split PDF</span> lets you extract specific pages or separate documents into individual files. 
                      Fast, precise, and completely secure processing.
                    </HeroPill>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-6 md:my-8 relative z-20">
                    <UploadArea onDrop={onDrop} mode="split-pdf" disabled={isGenerating} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <RotatingText />
                  </motion.div>
                </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="split-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            className="flex-1 flex flex-col items-center p-6 relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)]"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={buttonTap}
              onClick={reset}
              className="absolute top-8 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-charcoal-800/90 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 shadow-md backdrop-blur-sm border border-slate-200 dark:border-charcoal-700 transition-colors"
              title="Close and Reset"
            >
              <X size={20} />
            </motion.button>

            <div className="w-full max-w-5xl relative z-10 flex flex-col h-full">
              
              <div className="text-center mb-8">
                 <h3 className="text-lg font-bold text-charcoal-800 dark:text-white truncate">{file.name}</h3>
                 <p className="text-sm text-charcoal-500 dark:text-slate-400">Select pages to split or extract</p>
              </div>

              <AnimatePresence mode="wait">
                {!result ? (
                   <motion.div 
                     key="grid"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.3 }}
                   >
                      {isGenerating && pages.length === 0 ? (
                        <div className="w-full relative">
                          <div className="flex justify-between items-center mb-6 px-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-48" />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
                            {Array(12).fill(0).map((_, i) => (
                              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                            ))}
                          </div>
                          {status && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                              <div className="flex items-center gap-2 p-4 bg-white dark:bg-charcoal-800 rounded-lg shadow-md">
                                <Loader2 className="w-5 h-5 animate-spin text-brand-purple" />
                                <span className="text-sm font-medium text-charcoal-700 dark:text-slate-200">
                                  {status}{' '}
                                  {progress > 0 && progress < 100 && `(${progress}%)`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <SplitPageGrid 
                           pages={pages} 
                           onTogglePage={togglePageSelection}
                           onSelectAll={handleSelectAll}
                           onDeselectAll={handleDeselectAll}
                           onInvertSelection={handleInvertSelection}
                           onRemovePage={handleRemovePage}
                           onRemoveSelected={handleRemoveSelected}
                           onReorder={setPages}
                        />
                      )}
                      
                      {pages.length > 0 && (
                        <>
                          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
                             <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                                
                                <div className="flex-1 w-full md:w-auto min-w-[200px]">
                                   <div className="relative group">
                                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-charcoal-400 dark:text-slate-500">
                                         <ListFilter size={16} />
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Range (e.g. 1-5, 8, 11-13)"
                                        value={customRange}
                                        onChange={handleRangeChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl text-sm font-mono text-charcoal-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all placeholder:text-charcoal-400 dark:placeholder:text-slate-600"
                                      />
                                   </div>
                                </div>

                                <div className="flex bg-slate-100 dark:bg-charcoal-800 rounded-lg p-1 border border-slate-200 dark:border-charcoal-700 shrink-0">
                                   <motion.button
                                     whileTap={buttonTap}
                                     whileHover={{ backgroundColor: splitMode !== 'extract' ? "rgba(255,255,255,0.5)" : undefined }}
                                     onClick={() => setSplitMode('extract')}
                                     className={`px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${splitMode === 'extract' ? 'bg-white dark:bg-charcoal-700 shadow-sm text-brand-purple' : 'text-charcoal-500 dark:text-slate-400'}`}
                                   >
                                     Extract Selected
                                   </motion.button>
                                   <motion.button
                                     whileTap={buttonTap}
                                     whileHover={{ backgroundColor: splitMode !== 'separate' ? "rgba(255,255,255,0.5)" : undefined }}
                                     onClick={() => setSplitMode('separate')}
                                     className={`px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${splitMode === 'separate' ? 'bg-white dark:bg-charcoal-700 shadow-sm text-brand-purple' : 'text-charcoal-500 dark:text-slate-400'}`}
                                   >
                                     Split into Files
                                   </motion.button>
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={handleSplit}
                                  disabled={isGenerating || pages.filter(p => p.selected).length === 0}
                                  className="w-full md:w-auto px-8 py-3 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                                >
                                   {isGenerating ? (
                                     <>
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                       <span className="text-xs">
                                         {status || 'Processing...'}{' '}
                                         {progress > 0 && progress < 100 && `(${progress}%)`}
                                       </span>
                                     </>
                                   ) : (
                                     <>
                                       <Scissors size={18} />
                                       {splitMode === 'extract' ? 'Extract' : 'Split'}
                                     </>
                                   )}
                                </motion.button>
                             </div>
                          </div>
                          <div className="h-40 md:h-32" /> 
                        </>
                      )}
                   </motion.div>
                ) : (
                   <motion.div 
                     key="result"
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     transition={{ type: "spring", stiffness: 300, damping: 25 }}
                     className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full"
                   >
                       <div className="w-full bg-brand-mint/10 border border-brand-mint/20 rounded-2xl p-8 text-center mb-6">
                          <div className="text-brand-mint mb-4 flex justify-center"><CheckCircle size={64} /></div>
                          <h3 className="text-2xl font-bold text-charcoal-800 dark:text-white">Ready!</h3>
                          <p className="text-charcoal-500 dark:text-slate-400 mt-2">
                             Your files have been processed successfully.
                          </p>
                          <div className="mt-4 text-xs font-mono text-charcoal-400 dark:text-slate-500 bg-white dark:bg-charcoal-800 py-1 px-3 rounded-full inline-block border border-brand-mint/20">
                            {result.name}
                          </div>
                       </div>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.96 }}
                         onClick={downloadResult}
                         className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2 mb-4"
                       >
                          <Download size={20} /> Download Now
                       </motion.button>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={reset}
                         className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                       >
                          <RefreshCcw size={14} /> Split another PDF
                       </motion.button>

                       <AdSlot zone="sidebar" className="mt-8" />
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