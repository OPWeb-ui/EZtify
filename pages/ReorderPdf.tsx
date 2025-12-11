
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
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  
  // Re-implementing history with full objects for robust undo/redo including deletion
  const [fullHistory, setFullHistory] = useState<PdfPage[][]>([]);
  
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
        setFullHistory([]); // Reset history
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
          const fileName = `${safeName}_reordered_EZtify.pdf`;

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
            className="flex-1 flex flex-col items-center relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none"
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

            <AnimatePresence mode="wait">
              {!result ? (
                 <motion.div 
                   key="grid-view"
                   className="w-full flex-1 flex flex-col"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                 >
                    {/* --- UNIFIED TOP TOOLBAR --- */}
                    <div className="w-full bg-white dark:bg-charcoal-800 border-b border-slate-200 dark:border-charcoal-700 sticky top-0 z-40 p-2 animate-in slide-in-from-top-2">
                      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                        {/* LEFT */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                           <h3 className="text-sm font-bold text-charcoal-800 dark:text-white truncate">{file.name}</h3>
                        </div>
                        {/* CENTER */}
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-charcoal-400 dark:text-slate-500">
                           <Info size={14} />
                           <span>{pages.length} Pages • Drag to reorder</span>
                        </div>
                        {/* RIGHT */}
                        <div className="flex items-center gap-2">
                           <div className="hidden md:flex items-center gap-2">
                              <motion.button whileTap={buttonTap} onClick={popHistory} disabled={fullHistory.length === 0 || isGenerating} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-200 font-bold disabled:opacity-50 flex items-center gap-2 text-xs">
                                 <Undo2 size={16} /> Undo
                              </motion.button>
                              <motion.button onClick={handleGenerate} disabled={isGenerating || pages.length === 0} className="px-4 py-2.5 rounded-lg bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                                 {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Download size={16} />}
                                 {isGenerating ? 'Saving...' : 'Download'}
                              </motion.button>
                           </div>
                           <button onClick={reset} className="p-2.5 rounded-lg text-charcoal-400 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                              <X size={20} />
                           </button>
                        </div>
                      </div>
                    </div>
                   
                    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 flex-1 pb-32">
                      <SplitPageGrid 
                         pages={pages} 
                         onTogglePage={handleTogglePage}
                         onSelectAll={handleSelectAll}
                         onDeselectAll={handleDeselectAll}
                         onInvertSelection={handleInvertSelection}
                         onRemovePage={handleRemovePage}
                         onRemoveSelected={handleRemoveSelected}
                         onReorder={handleReorderWithHistory}
                         useVisualIndexing={true}
                      />
                    </div>
                    
                    {/* -- MOBILE BOTTOM BAR -- */}
                    {isMobile && pages.length > 0 && (
                      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 z-50">
                        <div className="flex gap-3 w-full">
                           <motion.button whileTap={buttonTap} onClick={popHistory} disabled={fullHistory.length === 0 || isGenerating} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                              <Undo2 size={18} />
                           </motion.button>
                           <motion.button onClick={handleGenerate} disabled={isGenerating || pages.length === 0} className="flex-1 px-4 py-3 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                              {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                              {isGenerating ? 'Saving...' : 'Download'}
                           </motion.button>
                        </div>
                      </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
