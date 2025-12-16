
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { savePdfWithEditorChanges } from '../services/pdfEditor';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { PageEditorModal } from '../components/PageEditorModal';
import { FileRejection, useDropzone } from 'react-dropzone';
import { EyeOff, Lock, Cpu, Settings, Zap, Download, RefreshCw, Loader2, FilePlus, PenTool } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { EmptyState } from '../components/EmptyState';
import { IconBox } from '../components/IconBox';

export const RedactPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MOBILE HINT ---
  useEffect(() => {
    if (isMobile && pages.length > 0) {
      const hasSeenHint = localStorage.getItem('eztify-desktop-hint-toast');
      if (!hasSeenHint) {
        const timer = setTimeout(() => {
          addToast("Desktop Optimized", "For complex workflows, desktop offers more control.", "info");
          localStorage.setItem('eztify-desktop-hint-toast', 'true');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMobile, pages.length, addToast]);

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

  const handleOpenEditor = (id: string) => {
    setActivePageId(id);
    setIsEditorOpen(true);
  };

  const handlePageUpdate = (updatedPage: PdfPage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
  };

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
       const blob = await savePdfWithEditorChanges(file, pages, undefined, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `redacted_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF redacted!", "success");
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
          title="Redact PDF"
          description="Securely hide sensitive information. Permanently remove text and images from your PDF."
          icon={<EyeOff />}
          onDrop={(files, rejections) => onDrop(files, rejections)}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-slate-600"
          specs={[
            { label: "Method", value: "Blackout", icon: <Settings /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            { label: "Speed", value: "Fast", icon: <Zap /> },
          ]}
          tip="Click on any page to open the editor and draw redaction boxes."
      />
    );
  }

  const activePage = pages.find(p => p.id === activePageId) || null;
  const activeIndex = pages.findIndex(p => p.id === activePageId);

  // Mobile: Simple stack
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900" {...getRootProps()}>
            <PageReadyTracker />
            <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between bg-white dark:bg-charcoal-900">
                <div className="flex items-center gap-2">
                    <IconBox icon={<EyeOff />} size="sm" toolAccentColor="#737373" active />
                    <span className="font-bold text-charcoal-900 dark:text-white">Redact PDF</span>
                </div>
                <button onClick={handleReset}><RefreshCw size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <SplitPageGrid pages={pages} onTogglePage={handleOpenEditor} onReorder={()=>{}} isReorderDisabled={true} useVisualIndexing />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900">
                <button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 bg-charcoal-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Download />} Save Redactions
                </button>
            </div>
            <PageEditorModal 
                isOpen={isEditorOpen} page={activePage} onClose={() => setIsEditorOpen(false)} onSave={handlePageUpdate} mode="redact"
                hasPrev={activeIndex > 0} hasNext={activeIndex < pages.length - 1} onPrev={() => setActivePageId(pages[activeIndex - 1].id)} onNext={() => setActivePageId(pages[activeIndex + 1].id)}
            />
        </div>
      );
  }

  // DESKTOP: 2-Pane
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="slate" />
      <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} />
      
      {/* 1. Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
         <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center gap-3">
                <IconBox icon={<EyeOff />} size="sm" toolAccentColor="#737373" active />
                <div>
                   <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Redaction Tool</h3>
                   <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">
                      Select pages to redact
                   </p>
                </div>
             </div>
             <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 transition-colors" title="Reset"><RefreshCw size={18} /></motion.button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {pages.length === 0 ? (
                <EmptyState 
                    title="No Pages" 
                    description="This document appears empty." 
                    actionLabel="Open New PDF" 
                    onAction={() => fileInputRef.current?.click()} 
                    icon={<FilePlus size={40} />}
                />
            ) : (
                <div className="max-w-6xl mx-auto">
                   <SplitPageGrid 
                      pages={pages}
                      onTogglePage={handleOpenEditor}
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
                  <PenTool size={14} /> Editor
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-charcoal-400">Total Pages</span>
                      <span className="text-xs font-mono font-bold text-charcoal-900 dark:text-white">{pages.length}</span>
                  </div>
              </div>
              <div className="text-xs text-charcoal-500 leading-relaxed bg-slate-50 dark:bg-charcoal-800 p-3 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  Click any page thumbnail to open the redaction editor. Draw boxes to permanently cover sensitive text or images.
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
                      shadow-lg hover:shadow-xl hover:bg-slate-700 dark:hover:bg-slate-200 transition-all 
                      disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2
                  "
              >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isGenerating ? (status || 'PROCESSING...') : 'SAVE PDF'}</span>
              </motion.button>
          </div>
      </div>

      {/* Editor Modal */}
      <PageEditorModal 
        isOpen={isEditorOpen}
        page={activePage}
        onClose={() => setIsEditorOpen(false)}
        onSave={handlePageUpdate}
        mode="redact"
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < pages.length - 1}
        onPrev={() => setActivePageId(pages[activeIndex - 1].id)}
        onNext={() => setActivePageId(pages[activeIndex + 1].id)}
      />
    </div>
  );
};
