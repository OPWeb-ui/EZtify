
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToPptx, PptxConfig } from '../services/pdfToPptxConverter';
import { loadPdfPages } from '../services/pdfSplitter';
import { FileRejection } from 'react-dropzone';
import { 
  Presentation, CheckCircle, RefreshCw, Zap, Lock, Cpu, Settings, Loader2, 
  Download, X, Layers, Maximize, Minimize, ZoomIn, ZoomOut, CheckSquare, XSquare,
  LayoutTemplate, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { PdfPage, UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { FilmstripModal } from '../components/FilmstripModal';

export const PdfToPptxPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- State ---
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  
  // Processing State
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Configuration
  const [config, setConfig] = useState<PptxConfig>({
    layout: '16x9',
    backgroundColor: '#FFFFFF'
  });

  // UI State
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width' | 'actual'>('fit');
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false); // Mobile
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  // --- Handlers ---

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Parsing PDF...');
    
    try {
       // Load PDF pages for the UI filmstrip
       const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: 0.8 }); // Lower scale for UI speed
       
       if (loadedPages.length > 0) {
           setFile(f);
           setPages(loadedPages);
           setActivePageId(loadedPages[0].id);
           setSelectedPageIds(new Set(loadedPages.map(p => p.id))); // Select all by default
           addToast("Success", `${loadedPages.length} pages loaded`, "success");
       } else {
           addToast("Error", "PDF appears to be empty.", "error");
       }
    } catch (e) {
       console.error(e);
       addToast("Error", "Failed to process PDF.", "error");
    } finally {
       setIsProcessingFiles(false);
       setProgress(0);
       setStatus('');
    }
  }, [addToast]);

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setActivePageId(null);
    setSelectedPageIds(new Set());
    setProgress(0);
    setStatus('');
  };

  const handleExport = async () => {
      if (!file || pages.length === 0) return;
      
      const pagesToExport = pages.filter(p => selectedPageIds.has(p.id));
      if (pagesToExport.length === 0) {
          addToast("Warning", "No pages selected for export", "warning");
          return;
      }

      setIsGenerating(true);
      try {
          const indices = pagesToExport.map(p => p.pageIndex);
          const blob = await convertPdfToPptx(file, indices, config, setProgress, setStatus);
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.pptx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          addToast("Success", "Presentation created!", "success");
      } catch (e) {
          console.error(e);
          addToast("Error", "Export failed.", "error");
      } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
      }
  };

  // --- Logic ---
  
  const handlePageSelect = (id: string, event?: React.MouseEvent) => {
      setActivePageId(id);
      if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
          setSelectedPageIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
          });
      } else if (!selectedPageIds.has(id)) {
          // Standard behavior: click selects only this if simple click
          // But for "Review" mode, we usually just want to view.
          // Let's implement: Click = View. Checkbox/Shift = Select.
          // But to match other tools, single click sets active.
      }
  };

  const handleRemovePage = (id: string) => {
      setPages(prev => prev.filter(p => p.id !== id));
      setSelectedPageIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
      if (activePageId === id) {
          setActivePageId(null);
      }
  };

  const selectAll = () => setSelectedPageIds(new Set(pages.map(s => s.id)));
  const deselectAll = () => setSelectedPageIds(new Set());

  // Convert PdfPage to UploadedImage for Preview/Filmstrip components
  const activePage = pages.find(p => p.id === activePageId);
  const previewImage: UploadedImage | null = activePage ? {
      id: activePage.id,
      file: file!,
      previewUrl: activePage.previewUrl,
      width: activePage.width || 0,
      height: activePage.height || 0,
      rotation: 0
  } : null;

  const filmstripImages: UploadedImage[] = useMemo(() => pages.map(p => ({
      id: p.id,
      file: file!,
      previewUrl: p.previewUrl,
      width: p.width || 0,
      height: p.height || 0,
      rotation: 0
  })), [pages, file]);

  // --- Zoom Logic ---
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual' || !activePageId) return;
    const updateZoom = () => {
      if (!containerRef.current || !baseDimensionsRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const { width: baseW, height: baseH } = baseDimensionsRef.current;
      const padding = 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      if (fitMode === 'width') {
        setZoom(availW / baseW);
      } else {
        setZoom(Math.min(availW / baseW, availH / baseH));
      }
    };
    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    updateZoom();
    return () => observer.disconnect();
  }, [fitMode, activePageId]);


  if (!file) {
    return (
      <ToolLandingLayout
        title="PDF to PPTX"
        description="Convert PDF documents into editable PowerPoint slides. Select specific pages and customize layout."
        icon={<Presentation />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-orange-500"
        specs={[
          { label: "Output", value: "PPTX", icon: <Presentation /> },
          { label: "Engine", value: "PptxGenJS", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Control", value: "Page Select", icon: <Layers /> },
        ]}
        tip="Each PDF page is rendered as a high-quality image slide. Text is not editable, but layout is preserved perfectly."
      />
    );
  }

  // --- Render Mobile ---
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
            <PageReadyTracker />
            <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                        <Presentation size={18} />
                    </div>
                    <span className="font-mono font-bold text-sm text-charcoal-800 dark:text-white truncate">
                        {file.name}
                    </span>
                </div>
                <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"><RefreshCw size={18} /></motion.button>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20 flex items-center justify-center p-4">
                <Preview 
                    image={previewImage} 
                    config={{ pageSize: 'auto', orientation: 'landscape', fitMode: 'contain', margin: 0, quality: 1 }} 
                    onReplace={()=>{}} onDropRejected={()=>{}} scale={1} 
                />
            </div>

            <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
                <motion.button whileTap={buttonTap} onClick={() => setIsFilmstripOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs"><Layers size={16} /> Pages ({pages.length})</motion.button>
                <motion.button whileTap={buttonTap} onClick={handleExport} disabled={isGenerating || selectedPageIds.size === 0} className="flex items-center gap-2 px-6 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-brand-purple/20 disabled:opacity-50">{isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}<span>Save PPTX</span></motion.button>
            </div>

            <FilmstripModal isOpen={isFilmstripOpen} onClose={() => setIsFilmstripOpen(false)} title={`Pages (${pages.length})`}>
                <Filmstrip 
                    images={filmstripImages}
                    activeImageId={activePageId}
                    selectedImageIds={selectedPageIds}
                    onSelect={(id) => { handlePageSelect(id); setIsFilmstripOpen(false); }}
                    onReorder={()=>{}} onRemove={handleRemovePage} onRotate={()=>{}}
                    isMobile={true} direction="vertical" size="md" isReorderable={false} showRemoveButton={true} showRotateButton={false}
                />
            </FilmstripModal>
        </div>
      );
  }

  // --- Render Desktop ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden">
      <PageReadyTracker />
      
      {/* 1. Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <div className="flex items-center gap-2">
                  <Layers size={16} className="text-charcoal-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={selectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Select All"><CheckSquare size={14} /></button>
                 <button onClick={deselectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Deselect All"><XSquare size={14} /></button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={filmstripImages}
                  activeImageId={activePageId}
                  selectedImageIds={selectedPageIds}
                  onSelect={handlePageSelect}
                  onReorder={()=>{}} onRemove={handleRemovePage} onRotate={()=>{}}
                  isMobile={false} direction="vertical" size="md" isReorderable={false} showRemoveButton={true} showRotateButton={false}
              />
          </div>
          <div className="p-2 border-t border-slate-100 dark:border-charcoal-800 text-[10px] text-center font-mono text-charcoal-400 bg-white dark:bg-charcoal-900">
             {selectedPageIds.size} pages selected for export
          </div>
      </div>

      {/* 2. Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
          <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">{file.name}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button onClick={() => setFitMode(fitMode === 'fit' ? 'width' : 'fit')} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Toggle Fit">{fitMode === 'fit' ? <Maximize size={14} /> : <Minimize size={14} />}</button>
              </div>
          </div>
          <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              {previewImage ? (
                 <Preview 
                    image={previewImage}
                    config={{ pageSize: 'auto', orientation: 'landscape', fitMode: 'contain', margin: 0, quality: 1 }}
                    onReplace={()=>{}} onDropRejected={()=>{}} scale={zoom} baseDimensionsRef={baseDimensionsRef}
                 />
              ) : (
                 <div className="text-charcoal-400 font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-2">
                    <Presentation size={24} className="opacity-50" />
                    <span>No Page Selected</span>
                 </div>
              )}
          </div>
      </div>

      {/* 3. Settings */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Presentation Settings</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Slide Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      {['16x9', '16x10', '4x3', 'wide'].map((layout) => (
                          <button
                              key={layout}
                              onClick={() => setConfig({ ...config, layout: layout as any })}
                              className={`
                                  flex items-center justify-center py-2.5 rounded-lg border text-xs font-bold font-mono transition-all
                                  ${config.layout === layout 
                                      ? 'bg-brand-purple text-white border-brand-purple shadow-sm' 
                                      : 'bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
                              `}
                          >
                              {layout.toUpperCase()}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Slide Background
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-charcoal-800 p-2 rounded-xl border border-slate-200 dark:border-charcoal-700">
                      <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-charcoal-600" style={{ backgroundColor: config.backgroundColor }} />
                      <div className="flex-1 flex gap-1">
                          {['#FFFFFF', '#000000', '#F3F4F6'].map(color => (
                              <button 
                                key={color}
                                onClick={() => setConfig({...config, backgroundColor: color})}
                                className={`flex-1 h-8 rounded-lg border flex items-center justify-center hover:scale-105 transition-transform ${config.backgroundColor === color ? 'ring-2 ring-brand-purple border-transparent' : 'border-slate-200 dark:border-charcoal-600'}`}
                                style={{ backgroundColor: color }}
                                title={color}
                              >
                                {config.backgroundColor === color && <CheckSquare size={12} className={color === '#000000' ? 'text-white' : 'text-black'} />}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleExport} 
                  disabled={isGenerating || selectedPageIds.size === 0} 
                  whileTap={buttonTap} 
                  className="
                      relative overflow-hidden w-full h-12
                      bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                      font-bold font-mono text-xs tracking-wider uppercase
                      rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200
                      transition-all disabled:opacity-50 disabled:shadow-none
                      flex items-center justify-center gap-2 group
                  "
              >
                  {isGenerating && (
                      <motion.div 
                          className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" 
                          initial={{ width: '0%' }} 
                          animate={{ width: `${progress}%` }} 
                          transition={{ duration: 0.1, ease: "linear" }} 
                      />
                  )}
                  <div className="relative flex items-center justify-center gap-2 z-10">
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isGenerating ? status || 'GENERATING...' : 'EXPORT PPTX'}</span>
                  </div>
              </motion.button>
              
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={handleReset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset Project
              </motion.button>
          </div>
      </div>
    </div>
  );
};
