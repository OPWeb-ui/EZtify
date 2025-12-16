
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { savePdfWithEditorChanges } from '../services/pdfEditor';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { RotateCw, Lock, Cpu, Zap, RefreshCcw, RefreshCw, Loader2, Download, FilePlus, ChevronUp, ChevronDown } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

export const RotatePdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Mobile UI
  const [isMobileInspectorOpen, setMobileInspectorOpen] = useState(false);

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

  const handleRotate = (id: string) => {
    setPages(prev => prev.map(p => {
       if (p.id === id) {
          const current = p.rotation || 0;
          return { ...p, rotation: (current + 90) % 360 };
       }
       return p;
    }));
  };

  const rotateAll = (dir: 'left' | 'right') => {
      const delta = dir === 'left' ? -90 : 90;
      setPages(prev => prev.map(p => {
          const current = p.rotation || 0;
          return { ...p, rotation: (current + delta + 360) % 360 };
      }));
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
       link.download = `rotated_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF rotated!", "success");
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
          title="Rotate PDF"
          description="Fix the orientation of pages in your PDF document. Rotate individual pages or the entire file."
          icon={<RotateCw />}
          onDrop={(files, rejections) => onDrop(files, rejections)}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-purple-500"
          specs={[
            { label: "Interaction", value: "Click/Tap", icon: <RefreshCcw /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            { label: "Mode", value: "Rotation", icon: <Zap /> },
          ]}
          tip="Click on any page to rotate it 90 degrees clockwise."
      />
    );
  }

  // --- Mobile Layout ---
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-900 relative" {...getRootProps()}>
            <PageReadyTracker />
            
            {/* Header */}
            <div className="shrink-0 h-14 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between bg-white dark:bg-charcoal-900 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                   <IconBox icon={<RotateCw />} size="sm" toolAccentColor="#D71921" active />
                   <span className="font-bold text-sm text-charcoal-900 dark:text-white">Rotate</span>
                </div>
                <button onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600"><RefreshCw size={18} /></button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <SplitPageGrid pages={pages} onTogglePage={handleRotate} onReorder={()=>{}} isReorderDisabled={true} useVisualIndexing isMobile={true} />
            </div>

            {/* Floating Inspector */}
            <motion.div 
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl flex flex-col overflow-hidden"
              initial={false}
              animate={{ height: isMobileInspectorOpen ? 'auto' : '80px' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
               {/* Handle */}
               <div className="flex items-center justify-between px-6 h-20 shrink-0 relative" onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}>
                  <div className="flex flex-col justify-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500">Pages</span>
                     <span className="text-sm font-bold text-charcoal-900 dark:text-white font-mono">{pages.length} Loaded</span>
                  </div>

                  <div className="absolute left-1/2 top-3 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
                  
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                     <button 
                        onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)} 
                        className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300"
                     >
                        {isMobileInspectorOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                     </button>
                     <motion.button
                        whileTap={buttonTap}
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="h-12 px-6 bg-brand-purple text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        <span>Save</span>
                     </motion.button>
                  </div>
               </div>

               {/* Expanded Content */}
               <div className="bg-slate-50 dark:bg-charcoal-850 border-t border-slate-100 dark:border-charcoal-800 p-6">
                  <div className="space-y-4">
                      <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
                          Quick Actions
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => rotateAll('left')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm text-charcoal-600 dark:text-slate-300">
                              <RefreshCcw size={20} />
                              <span className="text-xs font-bold">Left 90°</span>
                          </button>
                          <button onClick={() => rotateAll('right')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm text-charcoal-600 dark:text-slate-300">
                              <RotateCw size={20} />
                              <span className="text-xs font-bold">Right 90°</span>
                          </button>
                      </div>
                  </div>
               </div>
            </motion.div>
        </div>
      );
  }

  // DESKTOP: 2-Pane
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="purple" />
      
      {/* 1. Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
         <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center gap-3">
                <IconBox icon={<RotateCw />} size="sm" toolAccentColor="#D71921" active />
                <div>
                   <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Rotate Pages</h3>
                   <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">Click thumbnails to rotate</p>
                </div>
             </div>
             <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 transition-colors" title="Reset"><RefreshCw size={18} /></motion.button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
             <div className="max-w-6xl mx-auto">
                <SplitPageGrid 
                   pages={pages}
                   onTogglePage={handleRotate} 
                   onReorder={() => {}}
                   isReorderDisabled={true}
                   useVisualIndexing
                />
             </div>
         </div>
      </div>

      {/* 2. Sidebar */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                  <RefreshCcw size={14} /> Tools
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Quick Rotate
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => rotateAll('left')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 transition-colors group">
                          <RefreshCcw size={20} className="text-charcoal-500 group-hover:text-purple-600" />
                          <span className="text-xs font-bold">Left 90°</span>
                      </button>
                      <button onClick={() => rotateAll('right')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 transition-colors group">
                          <RotateCw size={20} className="text-charcoal-500 group-hover:text-purple-600" />
                          <span className="text-xs font-bold">Right 90°</span>
                      </button>
                  </div>
              </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  whileTap={buttonTap}
                  className="w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold font-mono text-xs uppercase tracking-wide shadow-lg hover:shadow-xl hover:bg-purple-600 dark:hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isGenerating ? (status || 'PROCESSING...') : 'SAVE ROTATION'}</span>
              </motion.button>
          </div>
      </div>
    </div>
  );
};
