
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, PageNumberConfig, UploadedImage } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { Filmstrip } from '../components/Filmstrip';
import { FilmstripModal } from '../components/FilmstripModal';
import { 
  ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, 
  Type, Hash, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Settings, RefreshCw, Download, Loader2, Layers, ZoomIn, ZoomOut, Maximize, Minimize,
  MousePointer2, Move, ArrowRight, X, LayoutGrid, Check, CheckSquare, XSquare, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase, modalContentVariants } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileRejection } from 'react-dropzone';
import { Preview } from '../components/Preview';

const FONTS = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times Roman', value: 'Times-Roman' },
  { label: 'Courier', value: 'Courier' },
];

const PREVIEW_SCALE = 1.5; // Constant to match PDF thumbnail generation scale

export const AddPageNumbersPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- Data State ---
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());

  // --- Processing State ---
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // --- UI State ---
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mobile UI
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Config State ---
  const [config, setConfig] = useState<PageNumberConfig>({
    position: 'bottom',
    alignment: 'center',
    startFrom: 1,
    fontSize: 12,
    fontFamily: 'Helvetica',
    offsetX: 0,
    offsetY: 0
  });

  // --- Handlers ---

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Analyzing document...');
    
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: PREVIEW_SCALE });
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
        setActivePageId(loadedPages[0].id);
        setSelectedPageIds(new Set(loadedPages.map(p => p.id))); // Select all by default
        
        // Auto-open settings on mobile
        if (window.innerWidth < 768) {
            setIsSettingsOpen(true);
        }
      } else {
        addToast("Error", "Could not load pages.", "error");
      }
    } catch (e) {
      console.error(e);
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
    setActivePageId(null);
    setSelectedPageIds(new Set());
    setConfig({
        position: 'bottom',
        alignment: 'center',
        startFrom: 1,
        fontSize: 12,
        fontFamily: 'Helvetica',
        offsetX: 0,
        offsetY: 0
    });
    setZoom(1);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       // Filter pages if we wanted to support partial numbering, but usually page numbers apply to whole doc structure
       // For now, we apply to the whole doc structure as 'pages' represents the order.
       const blob = await savePdfWithModifications(file, pages, config, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `numbered_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "Numbers applied successfully!", "success");
    } catch (e) {
       console.error(e);
       addToast("Error", "Failed to save PDF.", "error");
    } finally {
       setIsGenerating(false);
       setProgress(0);
       setStatus('');
    }
  };

  // --- Zoom Logic ---
  const activePage = pages.find(p => p.id === activePageId);
  
  useEffect(() => {
    if (!containerRef.current || !activePage) return;
    const updateZoom = () => {
      const { width: contW, height: contH } = containerRef.current!.getBoundingClientRect();
      const padding = isMobile ? 32 : 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      
      if (fitMode === 'width') {
         setZoom(availW / (activePage.width || 600));
      } else {
         const scale = Math.min(availW / (activePage.width || 600), availH / (activePage.height || 800));
         setZoom(scale);
      }
    };
    
    // Initial calc
    updateZoom();
    
    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activePage, fitMode, isMobile]);

  // --- Preview Overlay Calculation ---
  // Calculates the CSS style for the page number preview to match PDF coordinates
  const getPreviewStyle = (): React.CSSProperties => {
      // PDF-Lib standard margin is 20 points.
      // 1. Calculate Scale Factor:
      //    The Thumbnail was generated at PREVIEW_SCALE (1.5x of PDF points).
      //    The Zoom applies to the Thumbnail pixels.
      //    So Total Scale relative to PDF Points = PREVIEW_SCALE * zoom.
      
      const renderScale = PREVIEW_SCALE * zoom;
      
      const styles: React.CSSProperties = {
          position: 'absolute',
          color: 'black', 
          fontFamily: config.fontFamily.split('-')[0],
          fontSize: `${config.fontSize * renderScale}px`, 
          lineHeight: 1,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 50,
          fontWeight: config.fontFamily.includes('Bold') ? 'bold' : 'normal',
          fontStyle: config.fontFamily.includes('Italic') || config.fontFamily.includes('Oblique') ? 'italic' : 'normal',
      };

      const marginPx = 20 * renderScale; 
      const xOffPx = config.offsetX * renderScale;
      // Positive Y offset in our config means "move away from edge" (inward).
      // Since 'top' and 'bottom' CSS properties measure distance FROM the edge,
      // adding the offset moves it further from the edge (inward).
      const yOffPx = config.offsetY * renderScale; 

      if (config.position === 'top') {
          styles.top = `${marginPx + yOffPx}px`; 
      } else {
          styles.bottom = `${marginPx + yOffPx}px`;
      }

      if (config.alignment === 'left') {
          styles.left = `${marginPx + xOffPx}px`;
          styles.textAlign = 'left';
      } else if (config.alignment === 'right') {
          styles.right = `${marginPx - xOffPx}px`; 
          styles.textAlign = 'right';
      } else {
          // Center
          styles.left = '50%';
          styles.transform = `translateX(calc(-50% + ${xOffPx}px))`;
          styles.textAlign = 'center';
      }

      return styles;
  };

  const activeIndex = pages.findIndex(p => p.id === activePageId);
  const previewNumber = config.startFrom + (activeIndex !== -1 ? activeIndex : 0);

  // --- Render Helpers ---
  const filmstripImages = useMemo(() => pages.map(p => ({
      id: p.id,
      file: file!,
      previewUrl: p.previewUrl,
      width: p.width || 0,
      height: p.height || 0,
      rotation: 0
  })), [pages, file]);

  const setPosition = (pos: 'top' | 'bottom', align: 'left' | 'center' | 'right') => {
      setConfig(prev => ({ ...prev, position: pos, alignment: align, offsetX: 0, offsetY: 0 }));
  };

  if (!file) {
    return (
      <ToolLandingLayout
        title="Add Page Numbers"
        description="Insert customizable page numbers into your PDF. Control position, font, and sequence."
        icon={<Hash />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-indigo-500"
        specs={[
          { label: "Position", value: "Grid / Custom", icon: <Move /> },
          { label: "Format", value: "Standard", icon: <Type /> },
          { label: "Privacy", value: "Client-Side", icon: <Settings /> },
          { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
        ]}
        tip="Use the arrow keys in the configuration panel for pixel-perfect positioning adjustments."
      />
    );
  }

  // --- SHARED CONFIG PANEL ---
  const ConfigPanel = () => (
      <div className="space-y-8">
          
          {/* Position Grid */}
          <div className="space-y-3">
              <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                  Placement
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-charcoal-800 p-2 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  {[
                      { p: 'top', a: 'left', icon: <AlignLeft size={14} className="rotate-180" /> },
                      { p: 'top', a: 'center', icon: <ArrowUp size={14} /> },
                      { p: 'top', a: 'right', icon: <AlignRight size={14} className="rotate-180" /> },
                      { p: 'bottom', a: 'left', icon: <AlignLeft size={14} /> },
                      { p: 'bottom', a: 'center', icon: <ArrowDown size={14} /> },
                      { p: 'bottom', a: 'right', icon: <AlignRight size={14} /> },
                  ].map((btn, idx) => {
                      const isActive = config.position === btn.p && config.alignment === btn.a;
                      return (
                          <button
                              key={idx}
                              onClick={() => setPosition(btn.p as any, btn.a as any)}
                              className={`
                                  h-10 rounded-lg flex items-center justify-center transition-all
                                  ${isActive 
                                      ? 'bg-brand-purple text-white shadow-md ring-2 ring-brand-purple/20' 
                                      : 'bg-white dark:bg-charcoal-700 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-600 border border-slate-200 dark:border-charcoal-600'}
                              `}
                          >
                              {btn.icon}
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Micro Positioning */}
          <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
                      Fine Tune Offset
                  </label>
                  <button 
                      onClick={() => setConfig(prev => ({ ...prev, offsetX: 0, offsetY: 0 }))}
                      className="text-[9px] font-bold text-brand-purple hover:underline cursor-pointer uppercase"
                  >
                      Reset
                  </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  {/* X Offset */}
                  <div className="bg-slate-50 dark:bg-charcoal-800 p-2 rounded-lg border border-slate-200 dark:border-charcoal-700 flex items-center gap-2">
                      <div className="w-6 flex justify-center text-charcoal-400 font-mono text-[10px] font-bold">X</div>
                      <input 
                          type="number" 
                          value={config.offsetX} 
                          onChange={(e) => setConfig({ ...config, offsetX: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent text-xs font-mono font-bold text-charcoal-800 dark:text-white outline-none text-right" 
                      />
                      <div className="flex flex-col gap-0.5">
                          <button onClick={() => setConfig(p => ({...p, offsetX: p.offsetX + 1}))} className="hover:text-brand-purple"><ChevronUp size={10} /></button>
                          <button onClick={() => setConfig(p => ({...p, offsetX: p.offsetX - 1}))} className="hover:text-brand-purple"><ChevronDown size={10} /></button>
                      </div>
                  </div>

                  {/* Y Offset */}
                  <div className="bg-slate-50 dark:bg-charcoal-800 p-2 rounded-lg border border-slate-200 dark:border-charcoal-700 flex items-center gap-2">
                      <div className="w-6 flex justify-center text-charcoal-400 font-mono text-[10px] font-bold">Y</div>
                      <input 
                          type="number" 
                          value={config.offsetY} 
                          onChange={(e) => setConfig({ ...config, offsetY: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent text-xs font-mono font-bold text-charcoal-800 dark:text-white outline-none text-right" 
                      />
                      <div className="flex flex-col gap-0.5">
                          <button onClick={() => setConfig(p => ({...p, offsetY: p.offsetY + 1}))} className="hover:text-brand-purple"><ChevronUp size={10} /></button>
                          <button onClick={() => setConfig(p => ({...p, offsetY: p.offsetY - 1}))} className="hover:text-brand-purple"><ChevronDown size={10} /></button>
                      </div>
                  </div>
              </div>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-charcoal-800" />

          {/* Appearance */}
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Typography
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg px-2 flex items-center">
                          <Type size={14} className="text-charcoal-400 mr-2" />
                          <select 
                              value={config.fontFamily} 
                              onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                              className="w-full bg-transparent text-xs font-bold text-charcoal-800 dark:text-white outline-none py-2 cursor-pointer"
                          >
                              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                      </div>
                      <div className="bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg px-2 flex items-center">
                          <span className="text-[10px] text-charcoal-400 mr-2 font-bold">PT</span>
                          <input 
                              type="number" 
                              min="6" max="72"
                              value={config.fontSize} 
                              onChange={(e) => setConfig({...config, fontSize: parseInt(e.target.value) || 12})}
                              className="w-full bg-transparent text-xs font-bold text-charcoal-800 dark:text-white outline-none py-2"
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Sequence
                  </label>
                  <div className="bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg px-3 py-2 flex items-center gap-3">
                      <Hash size={16} className="text-brand-purple" />
                      <div className="flex-1">
                          <span className="block text-[10px] text-charcoal-400 font-bold uppercase">Start At</span>
                      </div>
                      <input 
                          type="number" 
                          min="1"
                          value={config.startFrom} 
                          onChange={(e) => setConfig({...config, startFrom: parseInt(e.target.value) || 1})}
                          className="w-16 bg-slate-50 dark:bg-charcoal-900 rounded border border-slate-200 dark:border-charcoal-600 text-center text-sm font-bold text-charcoal-800 dark:text-white outline-none py-1 focus:border-brand-purple"
                      />
                  </div>
              </div>
          </div>
      </div>
  );

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden font-sans">
        <PageReadyTracker />
        
        {/* Header */}
        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Hash size={18} />
                </div>
                <span className="font-mono font-bold text-sm text-charcoal-800 dark:text-white truncate">
                    {file.name}
                </span>
            </div>
            <motion.button 
                whileTap={buttonTap} 
                onClick={handleReset} 
                className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
            >
                <RefreshCw size={18} />
            </motion.button>
        </div>

        {/* Preview Canvas */}
        <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-4 bg-slate-100 dark:bg-black/20">
            {activePage && activePage.width && activePage.height ? (
                <div 
                    className="relative bg-white shadow-xl ring-1 ring-black/5"
                    style={{ width: activePage.width * zoom, height: activePage.height * zoom }}
                >
                    <img 
                        src={activePage.previewUrl} 
                        alt="Page Preview" 
                        className="w-full h-full object-contain pointer-events-none" 
                        draggable={false} 
                    />
                    {/* Page Number Overlay */}
                    <div style={getPreviewStyle()}>
                        {previewNumber}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-charcoal-400 gap-2">
                    <Loader2 size={32} className="animate-spin opacity-50" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Loading Preview...</span>
                </div>
            )}
        </div>

        {/* Bottom Bar */}
        <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
            <motion.button
                whileTap={buttonTap}
                onClick={() => setIsFilmstripOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs"
            >
                <Layers size={16} /> Pages
            </motion.button>

            <div className="flex items-center gap-2">
                <motion.button
                    whileTap={buttonTap}
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300 transition-colors"
                >
                    <Settings size={18} />
                </motion.button>

                <motion.button
                    whileTap={buttonTap}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Save</span>
                </motion.button>
            </div>
        </div>

        {/* Modals */}
        <FilmstripModal isOpen={isFilmstripOpen} onClose={() => setIsFilmstripOpen(false)} title={`Pages (${pages.length})`}>
            <Filmstrip 
                images={filmstripImages} 
                activeImageId={activePageId} 
                onSelect={(id) => { setActivePageId(id); setIsFilmstripOpen(false); }}
                onReorder={()=>{}} onRemove={()=>{}} onRotate={()=>{}} isMobile={true} direction="vertical" 
            />
        </FilmstripModal>

        <AnimatePresence>
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm pointer-events-auto" />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full bg-white dark:bg-charcoal-900 rounded-t-2xl shadow-2xl pointer-events-auto pb-[env(safe-area-inset-bottom)] max-h-[70vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-charcoal-800 flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal-900 dark:text-white font-mono">Configuration</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-charcoal-800"><X size={18} className="text-charcoal-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <ConfigPanel />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden">
        <PageReadyTracker />
        
        {/* 1. LEFT PANE: Filmstrip */}
        <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-charcoal-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
                <Filmstrip 
                    images={filmstripImages}
                    activeImageId={activePageId}
                    onSelect={(id) => setActivePageId(id)}
                    onReorder={()=>{}} onRemove={()=>{}} onRotate={()=>{}}
                    isMobile={false} direction="vertical" size="md" isReorderable={false} showRemoveButton={false} showRotateButton={false}
                />
            </div>
        </div>

        {/* 2. CENTER PANE: Preview */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                    <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">{file.name}</span>
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
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                {activePage && activePage.width && activePage.height && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={techEase}
                        className="relative bg-white shadow-2xl ring-1 ring-black/5"
                        style={{ width: activePage.width * zoom, height: activePage.height * zoom }}
                    >
                        <img 
                            src={activePage.previewUrl} 
                            alt="Page" 
                            className="w-full h-full object-contain pointer-events-none select-none" 
                            draggable={false} 
                        />
                        {/* Desktop Page Number Overlay */}
                        <div style={getPreviewStyle()}>
                            {previewNumber}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* 3. RIGHT PANE: Configuration */}
        <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
                <Settings size={16} className="text-charcoal-400 mr-2" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Configuration</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <ConfigPanel />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
                <motion.button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
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
                        <span>{isGenerating ? status || 'APPLYING...' : 'APPLY NUMBERS'}</span>
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
