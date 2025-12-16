
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { FileMinus, Lock, Cpu, MousePointerClick, Zap, Trash2, CheckSquare, XSquare, RefreshCw, Loader2, Download, FilePlus } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileRejection, useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { EmptyState } from '../components/EmptyState';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

export const DeletePdfPagesPage: React.FC = () => {
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

  const handleTogglePage = (id: string) => setPages(prev => prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p)));
  const handleSelectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const handleDeselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));
  const handleRemoveSelected = () => {
      const newPages = pages.filter(p => !p.selected);
      setPages(newPages);
  };
  const handleRemovePage = (id: string) => setPages(prev => prev.filter(p => p.id !== id));

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
       const blob = await savePdfWithModifications(file, pages, undefined, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `modified_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "Pages deleted!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
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
          title="Delete Pages"
          description="Remove unwanted pages from your PDF file. Selectively delete pages via a visual grid."
          icon={<FileMinus />}
          onDrop={(files, rejections) => onDrop(files, rejections)}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-rose-500"
          specs={[
            { label: "Selection", value: "Click to Delete", icon: <MousePointerClick /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            { label: "Speed", value: "Instant", icon: <Zap /> },
          ]}
          tip="Click the trash icon on any page to remove it from the document."
      />
    );
  }

  const selectedCount = pages.filter(p => p.selected).length;

  // MOBILE: Vertical stack
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900" {...getRootProps()}>
            <PageReadyTracker />
            <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between bg-white dark:bg-charcoal-900">
                <div className="flex items-center gap-2">
                    <IconBox icon={<FileMinus />} size="sm" toolAccentColor="#D71921" active />
                    <span className="font-bold text-charcoal-900 dark:text-white">Delete Pages</span>
                </div>
                <button onClick={handleReset}><RefreshCw size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <SplitPageGrid 
                   pages={pages}
                   onTogglePage={handleTogglePage} 
                   onRemovePage={handleRemovePage}
                   onReorder={()=>{}} isReorderDisabled={true} 
                   useVisualIndexing
                />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 space-y-3">
                {selectedCount > 0 && <button onClick={handleRemoveSelected} className="w-full h-10 bg-rose-100 text-rose-700 rounded-lg font-bold text-xs">Delete Selected ({selectedCount})</button>}
                <button onClick={handleGenerate} disabled={isGenerating || pages.length === 0} className="w-full h-12 bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Download />} Save
                </button>
            </div>
        </div>
      );
  }

  // DESKTOP: 2-Pane
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="red" />
      <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} />
      
      {/* 1. Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
         <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center gap-3">
                <IconBox icon={<FileMinus />} size="sm" toolAccentColor="#D71921" active />
                <div>
                   <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Delete Pages</h3>
                   <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">Select pages to remove</p>
                </div>
             </div>
             <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 transition-colors" title="Reset"><RefreshCw size={18} /></motion.button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {pages.length === 0 ? (
                <EmptyState 
                    title="All Pages Removed" 
                    description="No pages left in the document. Open a new file to continue." 
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
                       onInvertSelection={() => {}}
                       onRemovePage={handleRemovePage}
                       onRemoveSelected={handleRemoveSelected}
                       onReorder={() => {}}
                       isReorderDisabled={true}
                       useVisualIndexing
                    />
                </div>
            )}
         </div>
      </div>

      {/* 2. Sidebar */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                  <Trash2 size={14} /> Actions
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-charcoal-400">Selected</span>
                      <span className="text-xs font-mono font-bold text-rose-500">{selectedCount}</span>
                  </div>
              </div>

              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Quick Select
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleSelectAll} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-xs font-bold transition-colors"><CheckSquare size={14} /> All</button>
                      <button onClick={handleDeselectAll} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-xs font-bold transition-colors"><XSquare size={14} /> None</button>
                  </div>
              </div>

              <div className="pt-2">
                  <button 
                      onClick={handleRemoveSelected} 
                      disabled={selectedCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50"
                  >
                      <Trash2 size={14} /> DELETE SELECTED
                  </button>
              </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating || pages.length === 0}
                  whileTap={buttonTap}
                  className="
                      w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                      rounded-xl font-bold font-mono text-xs uppercase tracking-wide
                      shadow-lg hover:shadow-xl hover:bg-rose-600 dark:hover:bg-slate-200 transition-all 
                      disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2
                  "
              >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isGenerating ? (status || 'PROCESSING...') : 'SAVE PDF'}</span>
              </motion.button>
          </div>
      </div>
    </div>
  );
};
