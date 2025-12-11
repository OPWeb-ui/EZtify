

import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { reorderPdf } from '../services/pdfReorder';
import { Download, RefreshCcw, CheckCircle, ArrowLeftRight, X, Loader2, Undo2, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const ReorderPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  // History stack for Undo functionality (stores arrays of page IDs)
  const [history, setHistory] = useState<string[][]>([]);
  
  const [result, setResult] = useState<{ blob: Blob, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

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

    setIsProcessingFiles(true);
    const startTime = Date.now();
    
    try {
      const loadedPages = await loadPdfPages(f, () => {}, () => {});
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
      }

      if (loadedPages.length === 0) {
        addToast("Error", "No pages found in PDF.", "error");
      } else {
        setFile(f);
        setPages(loadedPages);
        setHistory([]); // Reset history
        addToast("Success", `Successfully loaded ${loadedPages.length} pages.`, "success");
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to load PDF pages.", "error");
    } finally {
      setIsProcessingFiles(false);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  const saveToHistory = (currentPages: PdfPage[]) => {
    // Save current order of IDs
    const currentOrder = currentPages.map(p => p.id);
    setHistory(prev => [...prev, currentOrder].slice(-20)); // Keep last 20 states
  };

  const handleReorder = (newPages: PdfPage[]) => {
    // Only save history if order actually changed
    if (JSON.stringify(newPages.map(p => p.id)) !== JSON.stringify(pages.map(p => p.id))) {
       saveToHistory(pages);
       setPages(newPages);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousOrderIds = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    // Reconstruct pages array based on previous ID order
    // Note: We need to handle potential deleted pages. If a page was deleted, it's gone from 'pages'.
    // However, if we support undoing deletion, we need to store full page objects in history or keep a master list.
    // For simplicity given the requirement "Undo last move", let's try to restore order.
    // If we want full undo including undelete, we should store the full 'pages' array in history.
    
    // Let's modify history to store full objects for robust undo/redo including deletion
  };
  
  // Re-implementing history with full objects for robust undo/redo including deletion
  const [fullHistory, setFullHistory] = useState<PdfPage[][]>([]);
  
  const pushHistory = (currentPages: PdfPage[]) => {
    setFullHistory(prev => [...prev, currentPages].slice(-10));
  };
  
  const popHistory = () => {
    if (fullHistory.length === 0) return;
    const previousState = fullHistory[fullHistory.length - 1];
    setFullHistory(prev => prev.slice(0, -1));
    setPages(previousState);
  };

  const handleReorderWithHistory = (newPages: PdfPage[]) => {
     pushHistory(pages);
     setPages(newPages);
  };

  const handleRemovePage = (id: string) => {
    pushHistory(pages);
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleResetOrder = () => {
    if (fullHistory.length > 0) {
        // Reset to very first state if we want "Reset to Original"
        // Or just reload the file. 
        // Let's implement "Reset to Original" by finding the original sorted by index
        pushHistory(pages);
        const sorted = [...pages].sort((a, b) => a.pageIndex - b.pageIndex);
        setPages(sorted);
    }
  };

  // Mock selection handlers required by SplitPageGrid, but we won't use selection for anything other than visual feedback or deletion
  const handleTogglePage = (id: string) => {
     setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleSelectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const handleDeselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));
  const handleInvertSelection = () => setPages(prev => prev.map(p => ({ ...p, selected: !p.selected })));
  
  const handleRemoveSelected = () => {
     pushHistory(pages);
     setPages(prev => prev.filter(p => !p.selected));
  };

  const handleGenerate = async () => {
    if (!file || pages.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setStatus('Processing...');

    try {
      setTimeout(async () => {
        try {
          // Get the original 0-based indices in the new order
          const pageIndices = pages.map(p => p.pageIndex);
          
          const blob = await reorderPdf(file, pageIndices, setProgress, setStatus);
          
          // Derive filename
          const originalName = file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
          const fileName = `${safeName}_EZtify.pdf`;

          setResult({ blob, name: fileName });
        } catch (innerError) {
          console.error(innerError);
          addToast("Error", "Reordering failed.", "error");
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
    setFullHistory([]);
    setStatus('');
  };

  return (
    <>
      <SEO 
        title="Reorder PDF Online – EZtify"
        description="Reorder PDF pages online in your browser. Drag and drop to change page order, then download instantly. 100% private and client-side."
        canonical="https://eztify.pages.dev/#/reorder-pdf"
      />
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-indigo-500/10" />
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
                >
                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                    <HeroPill>Drag and drop to rearrange pages, or remove unwanted ones instantly.</HeroPill>
                    <UploadArea onDrop={onDrop} mode="reorder-pdf" disabled={isGenerating} isProcessing={isProcessingFiles} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <RotatingText />
                  </motion.div>
                </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="reorder-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            className="flex-1 flex flex-col items-center p-6 relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none"
            {...getRootProps({
              onClick: (e: React.MouseEvent) => e.stopPropagation()
            })}
          >
            <input {...getInputProps()} />
            
            <DragDropOverlay 
              isDragActive={isDragActive} 
              message="Drop new PDF to replace" 
              variant="indigo"
            />

            {/* Standardized Close/Reset Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="absolute top-8 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 shadow-md border border-slate-200 dark:border-charcoal-600 transition-all duration-200"
              title="Close and Reset"
            >
              <X size={20} />
            </motion.button>

            <div className="w-full max-w-5xl relative z-10 flex flex-col h-full">
              
              <div className="text-center mb-8">
                 <h3 className="text-lg font-bold text-charcoal-800 dark:text-white truncate">{file.name}</h3>
                 <div className="flex items-center justify-center gap-2 text-sm text-charcoal-500 dark:text-slate-400">
                    <Info size={14} />
                    <span>Drag pages to reorder</span>
                 </div>
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
                        <div className="w-full h-[50vh] flex flex-col items-center justify-center">
                           <Loader2 className="w-12 h-12 animate-spin text-brand-purple mb-4" />
                           {status && (
                             <div className="bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-lg">
                               <p className="text-sm font-bold text-charcoal-600 dark:text-slate-200 animate-pulse">
                                 {status} {progress > 0 && `(${Math.round(progress)}%)`}
                               </p>
                             </div>
                           )}
                        </div>
                      ) : (
                        <SplitPageGrid 
                           pages={pages} 
                           onTogglePage={handleTogglePage}
                           onSelectAll={handleSelectAll}
                           onDeselectAll={handleDeselectAll}
                           onInvertSelection={handleInvertSelection}
                           onRemovePage={handleRemovePage}
                           onRemoveSelected={handleRemoveSelected}
                           onReorder={handleReorderWithHistory}
                           useVisualIndexing={true} // IMPORTANT: Show 1,2,3 based on current grid
                        />
                      )}
                      
                      {pages.length > 0 && (
                        <>
                          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
                             <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                                
                                <div className="flex items-center gap-2 text-xs font-medium text-charcoal-400 dark:text-slate-500">
                                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                   Your pages never leave your device.
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                   <motion.button
                                      whileTap={buttonTap}
                                      onClick={popHistory}
                                      disabled={fullHistory.length === 0}
                                      className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 font-bold disabled:opacity-50 flex items-center gap-2"
                                   >
                                      <Undo2 size={18} />
                                      <span className="hidden sm:inline">Undo</span>
                                   </motion.button>

                                   <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={handleGenerate}
                                      disabled={isGenerating || pages.length === 0}
                                      className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
                                   >
                                      {isGenerating ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          <span className="text-xs">
                                            {status || 'Saving...'}{' '}
                                            {progress > 0 && progress < 100 && `(${progress}%)`}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <ArrowLeftRight size={18} />
                                          Apply Order & Download
                                        </>
                                      )}
                                   </motion.button>
                                </div>
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
                       <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8 text-center mb-6">
                          <div className="text-indigo-500 mb-4 flex justify-center"><CheckCircle size={64} /></div>
                          <h3 className="text-2xl font-bold text-charcoal-800 dark:text-white">Done!</h3>
                          <p className="text-charcoal-500 dark:text-slate-400 mt-2">
                             Your PDF has been reordered successfully.
                          </p>
                          <div className="mt-4 text-xs font-mono text-charcoal-400 dark:text-slate-500 bg-white dark:bg-charcoal-800 py-1 px-3 rounded-full inline-block border border-indigo-500/20">
                            {result.name}
                          </div>
                       </div>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.96 }}
                         onClick={downloadResult}
                         className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center justify-center gap-2 mb-4"
                       >
                          <Download size={20} /> Download PDF
                       </motion.button>

                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={reset}
                         className="w-full py-3 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                         >
                          <RefreshCcw size={14} /> Reorder another PDF
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