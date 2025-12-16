
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { ExtendedPdfPage, UploadedImage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { combinePdfPages } from '../services/pdfMerger';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { 
  GitMerge, Layers, Lock, Cpu, Settings, Download, RefreshCw, Loader2, 
  Plus, Maximize, Minimize, ZoomIn, ZoomOut, FilePlus, AlertTriangle, MousePointerClick, CheckSquare, XSquare
} from 'lucide-react';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmstripModal } from '../components/FilmstripModal';
import { EmptyState } from '../components/EmptyState';
import { IconBox } from '../components/IconBox';

// --- CONSTANTS ---
const LIMIT_SWEET_SPOT = 20;
const LIMIT_HARD_CAP = 100;

export const MergePdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- Data State ---
  // Stores all individual pages from all loaded files
  const [pages, setPages] = useState<ExtendedPdfPage[]>([]);
  // Stores the actual File objects, referenced by sourceFileId in pages
  const [sourceFiles, setSourceFiles] = useState<Map<string, File>>(new Map());
  
  // --- UI State ---
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false); // Mobile only
  const [hasCombined, setHasCombined] = useState(false);
  const [combinedBlobUrl, setCombinedBlobUrl] = useState<string | null>(null);

  // --- Processing State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // --- View State ---
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width' | 'actual'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
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

  // --- Handlers ---

  const handleAddFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setStatus('Analyzing files...');

    const newSourceFiles = new Map(sourceFiles);
    const newPages: ExtendedPdfPage[] = [];
    let totalPageCount = pages.length;

    try {
        for (const file of files) {
            // Check potential overflow before processing fully
            // We can't know exact page count without parsing, but we can stop if we hit hard limit during loop
            if (totalPageCount >= LIMIT_HARD_CAP) {
                addToast("Limit Reached", `Maximum ${LIMIT_HARD_CAP} pages allowed.`, "warning");
                break;
            }

            const fileId = nanoid();
            newSourceFiles.set(fileId, file);
            
            // Load pages
            const loadedPages = await loadPdfPages(file, undefined, undefined, { scale: 1.0 });
            
            // Check if adding these pages exceeds limit
            if (totalPageCount + loadedPages.length > LIMIT_HARD_CAP) {
                 addToast("Limit Exceeded", `Adding ${file.name} would exceed the ${LIMIT_HARD_CAP} page limit.`, "error");
                 continue; // Skip this file
            }

            // Map to ExtendedPdfPage
            const extendedPages = loadedPages.map(p => ({
                ...p,
                sourceFileId: fileId
            }));

            newPages.push(...extendedPages);
            totalPageCount += extendedPages.length;
        }

        if (newPages.length > 0) {
            setSourceFiles(newSourceFiles);
            setPages(prev => [...prev, ...newPages]);
            // Auto-select first new page if none selected
            if (!activePageId) setActivePageId(newPages[0].id);
            addToast("Success", `Added ${newPages.length} pages`, "success");
        }
    } catch (e) {
        console.error(e);
        addToast("Error", "Failed to load PDF pages", "error");
    } finally {
        setIsProcessing(false);
        setStatus('');
        setProgress(0);
    }
  }, [pages.length, sourceFiles, activePageId, addToast]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
      return;
    }
    handleAddFiles(acceptedFiles);
  }, [handleAddFiles, addToast]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing || isCombining
  });

  const handleCombine = async () => {
      if (pages.length === 0) return;
      
      setIsCombining(true);
      try {
          const blob = await combinePdfPages(pages, sourceFiles, setProgress, setStatus);
          const url = URL.createObjectURL(blob);
          setCombinedBlobUrl(url);
          setHasCombined(true);
          addToast("Success", "PDF Combined Successfully", "success");
      } catch (e) {
          console.error(e);
          addToast("Error", "Failed to combine PDF", "error");
      } finally {
          setIsCombining(false);
          setProgress(0);
          setStatus('');
      }
  };

  const handleDownload = () => {
      if (!combinedBlobUrl) return;
      const link = document.createElement('a');
      link.href = combinedBlobUrl;
      link.download = `combined_document_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleReset = () => {
      if (combinedBlobUrl) URL.revokeObjectURL(combinedBlobUrl);
      setHasCombined(false);
      setCombinedBlobUrl(null);
      // We keep the files loaded, just reset the "Combined" state
      addToast("Reset", "Ready to edit", "success");
  };
  
  const handleFullReset = () => {
      if (combinedBlobUrl) URL.revokeObjectURL(combinedBlobUrl);
      setPages([]);
      setSourceFiles(new Map());
      setHasCombined(false);
      setCombinedBlobUrl(null);
      setActivePageId(null);
  };

  // --- Map Pages to Filmstrip Format ---
  const filmstripImages: UploadedImage[] = useMemo(() => pages.map(p => ({
      id: p.id,
      file: sourceFiles.get(p.sourceFileId)!, // File reference (mocked for type)
      previewUrl: p.previewUrl,
      width: p.width || 0,
      height: p.height || 0,
      rotation: 0
  })), [pages, sourceFiles]);

  const activePage = pages.find(p => p.id === activePageId);
  const activeImageForPreview: UploadedImage | null = activePage ? {
      id: activePage.id,
      file: sourceFiles.get(activePage.sourceFileId)!,
      previewUrl: activePage.previewUrl,
      width: activePage.width || 0,
      height: activePage.height || 0,
      rotation: 0
  } : null;

  // --- Zoom Logic ---
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual' || !activePageId) return;
    const updateZoom = () => {
      if (!containerRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const padding = isMobile ? 32 : 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      
      if (activePage?.width && activePage.height) {
        if (fitMode === 'width') {
            setZoom(availW / activePage.width);
        } else {
            setZoom(Math.min(availW / activePage.width, availH / activePage.height));
        }
      }
    };
    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    updateZoom();
    return () => observer.disconnect();
  }, [fitMode, activePageId, isMobile, activePage]);

  // --- Handle Page Removal ---
  const handleRemovePage = (id: string) => {
      const newPages = pages.filter(p => p.id !== id);
      setPages(newPages);
      if (activePageId === id) {
          setActivePageId(newPages.length > 0 ? newPages[0].id : null);
      }
  };

  const handleReorder = (newImages: UploadedImage[]) => {
      // Map back from UploadedImage order to PdfPage order
      const newOrder = newImages.map(img => pages.find(p => p.id === img.id)!);
      setPages(newOrder);
  };

  if (pages.length === 0) {
    return (
      <ToolLandingLayout
        title="Combine PDF"
        description="Merge pages from multiple PDFs into a single document. Organize, reorder, and combine securely."
        icon={<GitMerge />}
        onDrop={(files, r) => onDrop(files, r)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={true}
        isProcessing={isProcessing}
        accentColor="text-purple-500"
        specs={[
          { label: "Limit", value: `${LIMIT_HARD_CAP} Pages`, icon: <Layers /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
          { label: "Mode", value: "Manual", icon: <Settings /> },
        ]}
        tip="Drag pages to reorder them. You can combine up to 100 pages in a single session."
      />
    );
  }
  
  // --- PREVIEW RENDER LOGIC ---
  const renderPreviewContent = () => {
      // 1. If Combined -> Show the Result
      if (hasCombined && combinedBlobUrl) {
          return (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <iframe 
                    src={`${combinedBlobUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full max-w-3xl shadow-2xl rounded-lg bg-white"
                    title="Combined PDF"
                  />
              </div>
          );
      }

      // 2. If > 100 Pages (Should be blocked by logic, but safe fallback)
      if (pages.length > LIMIT_HARD_CAP) {
          return (
              <div className="flex flex-col items-center justify-center text-charcoal-400 gap-4 p-8 text-center">
                  <AlertTriangle size={48} className="text-amber-500" />
                  <div>
                      <h3 className="text-lg font-bold text-charcoal-700 dark:text-white">Preview Disabled</h3>
                      <p className="text-sm">Document exceeds the {LIMIT_HARD_CAP} page limit for live preview.</p>
                  </div>
              </div>
          );
      }

      // 3. Degraded Mode (21-100 pages) OR Normal Mode
      // Using Preview component for single page view
      if (activeImageForPreview) {
          return (
             <Preview 
                image={activeImageForPreview}
                config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }}
                onReplace={()=>{}} 
                onDropRejected={()=>{}}
                scale={zoom}
                onAddFiles={(files) => handleAddFiles(files)} // Dragging onto preview adds files
             />
          );
      }

      return <EmptyState title="No Page Selected" description="Select a page from the filmstrip" onAction={()=>{}} actionLabel="" />;
  };

  // --- MOBILE LAYOUT ---
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden" {...getRootProps()}>
            <PageReadyTracker />
            <DragDropOverlay isDragActive={isDragActive} message="Add Pages" variant="purple" />
            <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf" onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))} />

            {/* Header */}
            <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    <IconBox icon={<GitMerge />} size="sm" toolAccentColor="#D71921" active />
                    <span className="font-mono font-bold text-sm text-charcoal-800 dark:text-white truncate">
                        {hasCombined ? 'Combined PDF' : `${pages.length} Pages`}
                    </span>
                </div>
                <motion.button whileTap={buttonTap} onClick={handleFullReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300">
                    <RefreshCw size={18} />
                </motion.button>
            </div>

            {/* Main Preview */}
            <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20" ref={containerRef}>
                {renderPreviewContent()}
            </div>

            {/* Bottom Bar */}
            <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
                {!hasCombined ? (
                    <>
                        <motion.button whileTap={buttonTap} onClick={() => setIsFilmstripOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs">
                            <Layers size={16} /> Pages ({pages.length})
                        </motion.button>
                        <motion.button 
                            whileTap={buttonTap} 
                            onClick={handleCombine} 
                            disabled={isCombining || pages.length > LIMIT_HARD_CAP}
                            className="flex items-center gap-2 px-5 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg disabled:opacity-50"
                        >
                            {isCombining ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
                            <span>Combine</span>
                        </motion.button>
                    </>
                ) : (
                    <>
                         <motion.button whileTap={buttonTap} onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs">
                            Edit
                        </motion.button>
                        <motion.button 
                            whileTap={buttonTap} 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-purple text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg"
                        >
                            <Download size={16} /> Download
                        </motion.button>
                    </>
                )}
            </div>
            
            <FilmstripModal isOpen={isFilmstripOpen} onClose={() => setIsFilmstripOpen(false)} title={`Pages (${pages.length})`}>
                 <div className="p-2 border-b border-slate-100 dark:border-charcoal-800">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-charcoal-600 rounded-xl text-charcoal-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-charcoal-800">
                        <Plus size={16} /> Add PDF
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 bg-slate-100 dark:bg-black/20 custom-scrollbar">
                    <Filmstrip 
                        images={filmstripImages} 
                        activeImageId={activePageId} 
                        onSelect={(id) => { setActivePageId(id); setIsFilmstripOpen(false); }}
                        onReorder={handleReorder}
                        onRemove={handleRemovePage}
                        onRotate={() => {}} // No rotation in merge tool spec
                        isMobile={true} direction="vertical" isReorderable={!hasCombined} showRemoveButton={!hasCombined} showRotateButton={false}
                    />
                 </div>
            </FilmstripModal>
        </div>
      );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Add Pages" variant="purple" />
      <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf" onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))} />

      {/* 1. LEFT PANE: Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
         <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
             <div className="flex items-center gap-2">
                 <Layers size={16} className="text-charcoal-400" />
                 <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
             </div>
         </div>
         
         <div className="p-3 border-b border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
             <motion.button
                whileTap={buttonTap}
                onClick={() => fileInputRef.current?.click()}
                disabled={hasCombined || pages.length >= LIMIT_HARD_CAP}
                className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-charcoal-600 text-charcoal-500 dark:text-charcoal-400 font-mono text-xs font-bold hover:border-brand-purple hover:text-brand-purple hover:bg-brand-purple/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <span className="flex items-center justify-center gap-2"><Plus size={14} /> ADD PDF</span>
             </motion.button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
             <Filmstrip 
                 images={filmstripImages}
                 activeImageId={activePageId}
                 onSelect={(id) => setActivePageId(id)}
                 onReorder={handleReorder}
                 onRemove={handleRemovePage}
                 onRotate={() => {}}
                 isMobile={false} direction="vertical" isReorderable={!hasCombined} showRemoveButton={!hasCombined} showRotateButton={false}
             />
         </div>
      </div>

      {/* 2. CENTER PANE: Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
         {/* Toolbar */}
         <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
             <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                 {hasCombined ? (
                     <span className="font-bold text-brand-purple">PREVIEW: COMBINED DOCUMENT</span>
                 ) : (
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-700 dark:text-charcoal-200">EDITING:</span>
                        <span>{activePage ? `Page ${pages.indexOf(activePage) + 1}` : 'None'}</span>
                     </div>
                 )}
             </div>

             <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button onClick={() => setFitMode(fitMode === 'fit' ? 'width' : 'fit')} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Toggle Fit">{fitMode === 'fit' ? <Maximize size={14} /> : <Minimize size={14} />}</button>
              </div>
         </div>

         {/* Canvas */}
         <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
             {renderPreviewContent()}
         </div>
      </div>

      {/* 3. RIGHT PANE: Inspector */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
         <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
             <Settings size={16} className="text-charcoal-400 mr-2" />
             <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Properties</span>
         </div>

         <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
             <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Total Pages</span>
                      <span className={`font-bold font-mono ${pages.length > LIMIT_SWEET_SPOT ? 'text-amber-500' : 'text-charcoal-900 dark:text-white'}`}>{pages.length} / {LIMIT_HARD_CAP}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Sources</span>
                      <span className="font-bold text-charcoal-900 dark:text-white font-mono">{sourceFiles.size} Files</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-full overflow-hidden mt-2">
                       <div className={`h-full ${pages.length > LIMIT_SWEET_SPOT ? 'bg-amber-500' : 'bg-brand-purple'}`} style={{ width: `${(pages.length / LIMIT_HARD_CAP) * 100}%` }} />
                  </div>
             </div>

             <div className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed font-medium">
                <p className="mb-2">Combine multiple PDF documents into a single file. Drag pages in the filmstrip to reorder them.</p>
                <p className="text-[10px] text-charcoal-400">Performance is optimized for documents up to {LIMIT_SWEET_SPOT} pages.</p>
             </div>
         </div>

         {/* Action Footer */}
         <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
             {!hasCombined ? (
                <motion.button 
                    onClick={handleCombine} 
                    disabled={isCombining || pages.length === 0 || pages.length > LIMIT_HARD_CAP} 
                    whileTap={buttonTap} 
                    className="
                        relative overflow-hidden w-full h-12
                        bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                        font-bold font-mono text-sm tracking-wider uppercase
                        rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200
                        transition-all disabled:opacity-50 disabled:shadow-none
                        flex items-center justify-center gap-2 group
                    "
                >
                    {isCombining && (
                        <motion.div 
                            className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" 
                            initial={{ width: '0%' }} 
                            animate={{ width: `${progress}%` }} 
                            transition={{ duration: 0.1, ease: "linear" }} 
                        />
                    )}
                    <div className="relative flex items-center justify-center gap-2 z-10">
                        {isCombining ? <Loader2 size={18} className="animate-spin" /> : <GitMerge size={18} />}
                        <span>{isCombining ? status || 'PROCESSING...' : 'COMBINE PDF'}</span>
                    </div>
                </motion.button>
             ) : (
                <motion.button 
                    onClick={handleDownload} 
                    whileTap={buttonTap} 
                    className="
                        w-full h-12
                        bg-brand-purple text-white
                        font-bold font-mono text-sm tracking-wider uppercase
                        rounded-xl shadow-lg shadow-brand-purple/20
                        flex items-center justify-center gap-2
                        hover:bg-brand-purpleDark transition-all
                    "
                >
                    <Download size={18} /> DOWNLOAD PDF
                </motion.button>
             )}
              
             <motion.button 
                whileTap={buttonTap} 
                onClick={handleReset} 
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
             >
                <RefreshCw size={12} /> {hasCombined ? 'Edit Order' : 'Reset All'}
             </motion.button>
         </div>
      </div>
    </div>
  );
};
