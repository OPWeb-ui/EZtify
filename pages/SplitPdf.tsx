
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { GitFork, Layers, Lock, Cpu, Settings, CheckSquare, XSquare, Download, Loader2, RefreshCw, FilePlus, MousePointerClick } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { EmptyState } from '../components/EmptyState';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

export const SplitPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];

    setIsProcessingFiles(true);
    setStatus('Loading PDF pages...');
    
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      
      const elapsed = Date.now() - Date.now(); // Dummy for now, can be improved
      
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
      } else {
        addToast("Error", "Could not load pages.", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to parse PDF.", "error");
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

  const handleTogglePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleSelectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const handleDeselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));
  const handleInvertSelection = () => setPages(prev => prev.map(p => ({ ...p, selected: !p.selected })));

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setProgress(0);
    setStatus('');
  };

  const handleSplit = async () => {
    const selectedPages = pages.filter(p => p.selected);
    if (!file || selectedPages.length === 0) {
      addToast("Warning", "Select at least one page.", "warning");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await savePdfWithModifications(file, selectedPages, undefined, setProgress, setStatus);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `split_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDF split successfully!", "success");
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to split PDF.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  if (!file) {
    return (
      <ToolLandingLayout
          title="Split PDF"
          description="Extract specific pages or split your document into multiple independent PDF files."
          icon={<GitFork />}
          onDrop={(files) => onDrop(files, [])}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-purple-500"
          specs={[
            { label: "Mode", value: "Extraction", icon: <Layers /> },
            { label: "Preview", value: "Thumbnails", icon: <Settings /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
          ]}
          tip="Select the pages you want to keep. All other pages will be removed from the new file."
      />
    );
  }

  const selectedCount = pages.filter(p => p.selected).length;

  // Mobile Layout handled separately if needed, but for now enforcing desktop structure update
  if (isMobile) {
      // Keep mobile simple - Vertical Stack
      return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-charcoal-900 relative" {...getRootProps()}>
            <PageReadyTracker />
            <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
            <div className="shrink-0 h-14 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between px-4 bg-white dark:bg-charcoal-900">
                <div className="flex items-center gap-2">
                    <IconBox icon={<GitFork />} size="sm" toolAccentColor="#D71921" active />
                    <span className="font-bold text-sm text-charcoal-900 dark:text-white">Split PDF</span>
                </div>
                <button onClick={handleReset} className="p-2"><RefreshCw size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><SplitPageGrid pages={pages} onTogglePage={handleTogglePage} onReorder={()=>{}} isReorderDisabled={true} isMobile={true} /></div>
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900">
                <button onClick={handleSplit} disabled={isGenerating || selectedCount === 0} className="w-full h-12 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Download />} Save
                </button>
            </div>
        </div>
      );
  }

  // DESKTOP: 2-Pane (Workspace + Sidebar)
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" />
      <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} />
      
      {/* 1. Workspace (Left/Center) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
          <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center gap-3">
                <IconBox icon={<GitFork />} size="sm" toolAccentColor="#D71921" active />
                <div>
                   <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Split Document</h3>
                   <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono flex items-center gap-2">
                      <span className="font-bold">{file.name}</span>
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                <motion.button whileTap={buttonTap} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent">
                   <FilePlus size={14} /> Replace
                </motion.button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {pages.length === 0 ? (
                <EmptyState 
                    title="No Pages" 
                    description="This document has no pages left to display." 
                    actionLabel="Open New PDF" 
                    onAction={() => fileInputRef.current?.click()} 
                    icon={<FilePlus size={40} />}
                />
            ) : (
                <div className="max-w-6xl mx-auto">
                  <SplitPageGrid 
                    pages={pages}
                    onTogglePage={handleTogglePage}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onInvertSelection={handleInvertSelection}
                    onReorder={() => {}}
                    isReorderDisabled={true}
                    useVisualIndexing
                  />
                </div>
            )}
          </div>
      </div>

      {/* 2. Sidebar (Right) */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                  <MousePointerClick size={14} /> Selection
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-charcoal-400">Total Pages</span>
                      <span className="text-xs font-mono font-bold text-charcoal-900 dark:text-white">{pages.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-charcoal-400">Selected</span>
                      <span className="text-xs font-mono font-bold text-purple-600">{selectedCount}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full mt-3 overflow-hidden">
                      <motion.div 
                          className="h-full bg-purple-600" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(selectedCount / pages.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                      />
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Quick Actions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleSelectAll} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-xs font-bold transition-colors">
                          <CheckSquare size={14} /> All
                      </button>
                      <button onClick={handleDeselectAll} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-xs font-bold transition-colors">
                          <XSquare size={14} /> None
                      </button>
                  </div>
              </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button
                  onClick={handleSplit}
                  disabled={isGenerating || selectedCount === 0}
                  whileTap={buttonTap}
                  className="
                      w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                      rounded-xl font-bold font-mono text-xs uppercase tracking-wide
                      shadow-lg hover:shadow-xl hover:bg-purple-600 dark:hover:bg-slate-200 transition-all 
                      disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group relative overflow-hidden
                  "
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
                      <span>{isGenerating ? (status || 'PROCESSING...') : 'EXTRACT PAGES'}</span>
                  </div>
              </motion.button>
              
              <motion.button whileTap={buttonTap} onClick={handleReset} className="w-full py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors flex items-center justify-center gap-2">
                  <RefreshCw size={12} /> Start Over
              </motion.button>
          </div>
      </div>
    </div>
  );
};
