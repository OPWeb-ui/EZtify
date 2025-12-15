
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { reorderPdf } from '../services/pdfReorder';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { ListOrdered, Lock, Cpu, Zap, Move, RefreshCw, Loader2, Download } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';

export const ReorderPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Loading pages...');
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setProgress(0);
    setStatus('');
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       const indices = pages.map(p => p.pageIndex);
       const blob = await reorderPdf(file, indices, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `reordered_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF reordered!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
    } finally {
       setIsGenerating(false);
       setProgress(0);
       setStatus('');
    }
  };

  if (!file) {
    return (
      <ToolLandingLayout
          title="Reorder PDF"
          description="Drag and drop to rearrange pages in your PDF document."
          icon={<ListOrdered />}
          onDrop={(files, rejections) => onDrop(files, rejections)}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-indigo-500"
          specs={[
            { label: "Interaction", value: "Drag & Drop", icon: <Move /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            { label: "Speed", value: "Fast", icon: <Zap /> },
          ]}
          tip="Simply drag the thumbnails to change their sequence. You can also delete pages."
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {/* 1. Header */}
      <div className="shrink-0 h-16 bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 px-4 md:px-6 flex items-center justify-between z-20 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
               <ListOrdered size={20} />
            </div>
            <div>
               <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Reorder Pages</h3>
               <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">
                  Drag thumbnails to rearrange
               </p>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors" title="Reset">
               <RefreshCw size={18} />
            </motion.button>
         </div>
      </div>

      {/* 2. Workspace */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-100 dark:bg-black/20">
         <div className="max-w-6xl mx-auto">
            <SplitPageGrid 
               pages={pages}
               onTogglePage={() => {}} // No selection needed
               onReorder={setPages}
               isReorderDisabled={false}
               useVisualIndexing
               // No delete/rotate/select actions
            />
         </div>
      </div>

      {/* 3. Command Bar */}
      <div className="shrink-0 h-20 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 px-6 flex items-center justify-between z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="hidden sm:flex flex-col">
             <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest">Document</span>
             <span className="text-xs font-mono font-bold text-charcoal-800 dark:text-white">
                {pages.length} Pages
             </span>
          </div>

          <motion.button
              onClick={handleGenerate}
              disabled={isGenerating}
              whileTap={buttonTap}
              className="flex-1 sm:flex-none sm:min-w-[200px] relative overflow-hidden h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-mono font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all hover:bg-brand-purple dark:hover:bg-slate-200"
          >
              {isGenerating && (
                  <motion.div 
                      className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                  />
              )}
              <div className="relative flex items-center justify-center gap-2 z-10">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>
                      {isGenerating ? (status || 'PROCESSING...') : 'SAVE ORDER'}
                  </span>
              </div>
          </motion.button>
      </div>
    </div>
  );
};
