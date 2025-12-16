
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { reorderPdf } from '../services/pdfReorder';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { ListOrdered, Lock, Cpu, Zap, Move, RefreshCw, Loader2, Download, FilePlus, MousePointer2 } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

export const ReorderPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
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

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessingFiles || isGenerating
  });

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

  // Mobile Layout
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900" {...getRootProps()}>
            <PageReadyTracker />
            <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between bg-white dark:bg-charcoal-900">
                <div className="flex items-center gap-2">
                    <IconBox icon={<ListOrdered />} size="sm" toolAccentColor="#D71921" active />
                    <span className="font-bold text-charcoal-900 dark:text-white">Reorder</span>
                </div>
                <button onClick={handleReset}><RefreshCw size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <SplitPageGrid pages={pages} onTogglePage={()=>{}} onReorder={setPages} isReorderDisabled={false} useVisualIndexing />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
                <button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Download />} Save
                </button>
            </div>
        </div>
      );
  }

  // DESKTOP: Standard 2-Pane
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="indigo" />
      
      {/* 1. Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
         <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center gap-3">
                <IconBox icon={<ListOrdered />} size="sm" toolAccentColor="#D71921" active />
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

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
             <div className="max-w-6xl mx-auto">
                <SplitPageGrid 
                   pages={pages}
                   onTogglePage={() => {}} 
                   onReorder={setPages}
                   isReorderDisabled={false}
                   useVisualIndexing
                />
             </div>
         </div>
      </div>

      {/* 2. Sidebar */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                  <Move size={14} /> Structure
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-charcoal-400">Total Pages</span>
                      <span className="text-xs font-mono font-bold text-charcoal-900 dark:text-white">{pages.length}</span>
                  </div>
              </div>
              <div className="text-xs text-charcoal-500 leading-relaxed bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                  <span className="font-bold text-indigo-600 block mb-1">Tip:</span>
                  Drag any page to a new position. Changes are applied when you save.
              </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  whileTap={buttonTap}
                  className="
                      w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                      rounded-xl font-bold font-mono text-xs uppercase tracking-wide
                      shadow-lg hover:shadow-xl hover:bg-indigo-600 dark:hover:bg-slate-200 transition-all 
                      disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2
                  "
              >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isGenerating ? (status || 'PROCESSING...') : 'SAVE ORDER'}</span>
              </motion.button>
          </div>
      </div>
    </div>
  );
};
