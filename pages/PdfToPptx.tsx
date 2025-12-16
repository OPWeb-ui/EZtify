
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToPptx, PptxConfig } from '../services/pdfToPptxConverter';
import { loadPdfPages } from '../services/pdfSplitter';
import { FileRejection, useDropzone } from 'react-dropzone';
import { 
  Presentation, RefreshCw, Lock, Cpu, Settings, Loader2, 
  Download, Layers, ZoomIn, ZoomOut, Maximize, CheckSquare, XSquare,
  LayoutGrid, Palette, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { FilmstripModal } from '../components/FilmstripModal';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const PdfToPptxPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- State ---
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<UploadedImage[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [selectedSlideIds, setSelectedSlideIds] = useState<Set<string>>(new Set());
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Configuration - Default to 'auto' for smart detection
  const [config, setConfig] = useState<PptxConfig>({
    layout: 'auto',
    backgroundColor: '#FFFFFF'
  });

  // UI State
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width' | 'actual'>('fit');
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false); 
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
       const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: 0.8 });
       
       if (loadedPages.length > 0) {
           setFile(f);
           const extractedSlides: UploadedImage[] = loadedPages.map(p => ({
               id: p.id,
               file: f,
               previewUrl: p.previewUrl,
               width: p.width || 1920,
               height: p.height || 1080,
               rotation: 0
           }));
           setSlides(extractedSlides);
           setActiveSlideId(extractedSlides[0].id);
           setSelectedSlideIds(new Set(extractedSlides.map(p => p.id))); 
           addToast("Success", "Loaded PDF slides.", "success");
       } else {
           addToast("Error", "PDF appears to be empty.", "error");
       }
    } catch (e) {
       console.error(e);
       addToast("Error", "Failed to process PDF.", "error");
    } finally {
       setIsProcessing(false);
       setProgress(0);
       setStatus('');
    }
  }, [addToast]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing || isGenerating
  });

  const handleReset = () => {
    setFile(null);
    setSlides([]);
    setActiveSlideId(null);
    setSelectedSlideIds(new Set());
    setProgress(0);
    setStatus('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  const handleExport = async () => {
      if (!file || slides.length === 0) return;
      
      const pagesToExport = slides.filter(p => selectedSlideIds.has(p.id));
      if (pagesToExport.length === 0) {
          addToast("Warning", "No pages selected for export", "warning");
          return;
      }

      setIsGenerating(true);
      try {
          // Find original indices
          const indices = slides.reduce((acc, slide, idx) => {
              if (selectedSlideIds.has(slide.id)) acc.push(idx);
              return acc;
          }, [] as number[]);

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
      setActiveSlideId(id);
      if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
          setSelectedSlideIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
          });
      } else if (!selectedSlideIds.has(id)) {
          setSelectedSlideIds(new Set([id]));
      }
  };

  const selectAll = () => setSelectedSlideIds(new Set(slides.map(s => s.id)));
  const deselectAll = () => setSelectedSlideIds(new Set());

  const handleRemovePage = (id: string) => {
    setSlides(prev => {
        const next = prev.filter(s => s.id !== id);
        if (activeSlideId === id) {
            setActiveSlideId(next.length > 0 ? next[0].id : null);
        }
        return next;
    });
    setSelectedSlideIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const activeSlide = slides.find(p => p.id === activeSlideId);
  const previewImage: UploadedImage | null = activeSlide || null;

  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual' || !activeSlideId) return;
    const updateZoom = () => {
      if (!containerRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const padding = 64; 
      // Approximate base width for zoom logic
      const baseW = 1000; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      if (fitMode === 'width') {
        setZoom(availW / baseW);
      } else {
        setZoom(Math.min(availW / baseW, availH / 750));
      }
    };
    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    updateZoom();
    return () => observer.disconnect();
  }, [fitMode, activeSlideId]);

  const ConfigPanel = () => (
    <div className="space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 flex items-start gap-3">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Smart Layout</h4>
                <p className="text-[10px] text-blue-600/80 dark:text-blue-300/80 leading-relaxed">
                    Slide dimensions will automatically match the PDF page size to prevent whitespace.
                </p>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                Background Fill
            </label>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-charcoal-800 p-2 rounded-xl border border-slate-200 dark:border-charcoal-700">
                <Palette size={16} className="text-charcoal-400 ml-1" />
                <input 
                    type="color" 
                    value={config.backgroundColor}
                    onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-xs font-mono text-charcoal-600 dark:text-slate-300 flex-1 text-center">
                    {config.backgroundColor}
                </span>
            </div>
        </div>
    </div>
  );

  if (!file) {
    return (
      <ToolLandingLayout
        title="PDF to PPTX"
        description="Convert PDF documents into editable PowerPoint slides. Automatic slide sizing preserves layout."
        icon={<Presentation />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessing}
        accentColor="text-orange-500"
        specs={[
          { label: "Output", value: "PPTX", icon: <Presentation /> },
          { label: "Engine", value: "PptxGenJS", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Layout", value: "Auto-Fit", icon: <Layers /> },
        ]}
        tip="Each PDF page becomes a high-quality slide. Layouts are automatically matched to the source document."
      />
    );
  }

  // --- Render Mobile ---
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden relative" {...getRootProps()}>
            <PageReadyTracker />
            <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="pptOrange" />
            <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} />
            
            <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                        <Presentation size={18} />
                    </div>
                    <span className="font-mono font-bold text-sm text-charcoal-800 dark:text-white truncate">
                        {file.name}
                    </span>
                </div>
                <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors">
                    <RefreshCw size={18} />
                </motion.button>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20 flex items-center justify-center p-4">
                <Preview 
                    image={previewImage} 
                    config={{ pageSize: 'auto', orientation: 'landscape', fitMode: 'contain', margin: 0, quality: 1 }} 
                    onReplace={()=>{}} onDropRejected={()=>{}} scale={1} 
                />
            </div>

            <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
                <motion.button whileTap={buttonTap} onClick={() => setIsFilmstripOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs">
                    <Layers size={16} /> Slides ({slides.length})
                </motion.button>

                <motion.button whileTap={buttonTap} onClick={handleExport} disabled={isGenerating || selectedSlideIds.size === 0} className="flex items-center gap-2 px-6 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-brand-purple/20 disabled:opacity-50">
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Save PPTX</span>
                </motion.button>
            </div>

            <FilmstripModal isOpen={isFilmstripOpen} onClose={() => setIsFilmstripOpen(false)} title={`Slides (${slides.length})`}>
                <div className="p-4">
                    <Filmstrip 
                        images={slides}
                        activeImageId={activeSlideId}
                        selectedImageIds={selectedSlideIds}
                        onSelect={(id) => { handlePageSelect(id); setIsFilmstripOpen(false); }}
                        onReorder={()=>{}} onRemove={handleRemovePage} onRotate={()=>{}}
                        isMobile={true} direction="vertical" isReorderable={false} showRemoveButton={true} showRotateButton={false}
                    />
                </div>
            </FilmstripModal>
        </div>
      );
  }

  // --- Render Desktop ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="pptOrange" />
      <input 
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
      />
      
      {/* 1. LEFT PANE: Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <div className="flex items-center gap-2">
                  <Layers size={16} className="text-charcoal-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({slides.length})</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={selectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Select All"><CheckSquare size={14} /></button>
                 <button onClick={deselectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Deselect All"><XSquare size={14} /></button>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={slides}
                  activeImageId={activeSlideId}
                  selectedImageIds={selectedSlideIds}
                  onSelect={handlePageSelect}
                  onReorder={()=>{}} onRemove={handleRemovePage} onRotate={()=>{}}
                  isMobile={false} direction="vertical" isReorderable={false} showRemoveButton={true} showRotateButton={false}
              />
          </div>
          <div className="p-2 border-t border-slate-100 dark:border-charcoal-800 text-[10px] text-center font-mono text-charcoal-400 bg-white dark:bg-charcoal-900">
             {selectedSlideIds.size} pages selected for export
          </div>
      </div>

      {/* 2. CENTER PANE: Preview */}
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
                  <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Reset Zoom"><Maximize size={14} /></button>
              </div>
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              
              {activeSlide ? (
                 <Preview 
                    image={previewImage}
                    config={{ pageSize: 'auto', orientation: 'landscape', fitMode: 'contain', margin: 0, quality: 1 }} 
                    onReplace={()=>{}} 
                    onDropRejected={()=>{}}
                    scale={zoom}
                    baseDimensionsRef={baseDimensionsRef}
                 />
              ) : (
                 <div className="text-charcoal-400 font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-2">
                    <Presentation size={24} className="opacity-50" />
                    <span>No Slide Selected</span>
                 </div>
              )}
          </div>
      </div>

      {/* 3. RIGHT PANE: Configuration */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Export Settings</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <ConfigPanel />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleExport} 
                  disabled={isGenerating || selectedSlideIds.size === 0} 
                  whileTap={buttonTap} 
                  className="
                      relative overflow-hidden w-full h-12
                      bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                      font-bold font-mono text-xs uppercase tracking-wide
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
                      <span>{isGenerating ? status || 'EXPORTING...' : 'EXPORT PPTX'}</span>
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
