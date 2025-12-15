
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { loadPdfPages } from '../services/pdfSplitter';
import { convertPdfVisual, VisualFilterMode } from '../services/pdfGrayscale';
import { PdfFile, PdfPage, UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { nanoid } from 'nanoid';
import { 
  Download, RefreshCw, Palette, Lock, Zap, FileText, 
  X, Moon, Sun, Monitor, Layers, Loader2, ChevronLeft, ChevronRight, 
  LayoutGrid, Check, Settings, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileRejection } from 'react-dropzone';
import { FilmstripModal } from '../components/FilmstripModal';

export const GrayscalePdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // State
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const [visualMode, setVisualMode] = useState<VisualFilterMode>('grayscale');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Desktop Zoom State
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'actual'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false);

  // Load PDF
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    
    const f = acceptedFiles[0];
    setIsProcessingFiles(true);
    setStatus('Loading visuals...');
    
    try {
      // Use higher scale for good visual preview
      const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: 1.5 });
      if (loadedPages.length > 0) {
        setFile({ id: nanoid(), file: f });
        setPages(loadedPages);
        setActivePageId(loadedPages[0].id);
        setFitMode('fit'); // Reset to fit on new file
      } else {
        addToast("Error", "PDF seems empty or corrupted.", "error");
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const activePage = pages.find(p => p.id === activePageId) || null;

  // Zoom Calculation Effect (Desktop Only)
  useEffect(() => {
    if (isMobile || !containerRef.current || !activePage || fitMode === 'actual') return;

    const updateZoom = () => {
      if (!containerRef.current || !activePage?.width || !activePage?.height) return;
      
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      // Match padding from Images -> PDF 3-panel layout (p-8 = 32px each side = 64px total)
      const padding = 64; 
      
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      
      // Calculate fit scale
      const scale = Math.min(availW / activePage.width, availH / activePage.height);
      
      // Set zoom (guard against zero/infinity)
      setZoom(Number.isFinite(scale) && scale > 0 ? scale : 1);
    };

    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    // Initial call
    updateZoom();

    return () => observer.disconnect();
  }, [activePage, fitMode, isMobile]);

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const result = await convertPdfVisual(file, visualMode, setProgress, setStatus);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDF Processed!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error", "Conversion failed.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setActivePageId(null);
    setVisualMode('grayscale'); // Default
    setProgress(0);
    setStatus('');
    setZoom(1);
    setFitMode('fit');
  };

  // Navigation Helpers
  const activeIndex = pages.findIndex(p => p.id === activePageId);
  
  const goNext = () => {
    if (activeIndex < pages.length - 1) setActivePageId(pages[activeIndex + 1].id);
  };
  
  const goPrev = () => {
    if (activeIndex > 0) setActivePageId(pages[activeIndex - 1].id);
  };

  // Keyboard Nav
  useEffect(() => {
    if (!file) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [file, activeIndex]);

  // Visual Style Calculation (CSS Filter for Preview)
  const getFilterStyle = () => {
    switch (visualMode) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'night': return 'invert(100%) hue-rotate(180deg)'; // Smart-ish invert
      default: return 'none';
    }
  };

  const filmstripImages: UploadedImage[] = useMemo(() => {
    if (!file) return [];
    return pages.map(p => ({
        id: p.id,
        file: file.file,
        previewUrl: p.previewUrl,
        width: 0, 
        height: 0, 
        rotation: 0
    }));
  }, [pages, file]);

  if (!file) {
    return (
      <ToolLandingLayout
        title="Visual PDF"
        description="Transform PDF visuals with professional filters. Convert to Grayscale, Sepia, or Night Mode instantly."
        icon={<Palette />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-indigo-500"
        specs={[
          { label: "Modes", value: "Gray/Sepia/Night", icon: <Monitor /> },
          { label: "Privacy", value: "Client-Side", icon: <Lock /> },
          { label: "Preview", value: "Real-time", icon: <Layers /> },
          { label: "Speed", value: "Fast", icon: <Zap /> },
        ]}
        tip="Use Night Mode to invert document colors for easier reading in low light."
      />
    );
  }

  // --- MOBILE LAYOUT (UNCHANGED) ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900 overflow-hidden font-sans">
        <PageReadyTracker />
        
        {/* Header */}
        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-30">
           <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md text-indigo-600 dark:text-indigo-400">
                 <Palette size={18} />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-charcoal-900 dark:text-white font-mono tracking-tight">{file.file.name}</span>
                 <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">{pages.length} Pages • {(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
           </div>
           <motion.button 
              whileTap={buttonTap} 
              onClick={handleReset} 
              className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors"
           >
              <X size={18} />
           </motion.button>
        </div>

        {/* Main Stage */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-slate-100/50 dark:bg-black/20">
           <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
           />

           <div className="relative w-full h-full p-4 flex items-center justify-center">
              {activePage ? (
                 <motion.div 
                    layoutId={`page-${activePage.id}`}
                    className="relative shadow-2xl ring-1 ring-black/5 max-w-full max-h-full transition-transform duration-300 ease-out"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                 >
                    <motion.img 
                       src={activePage.previewUrl} 
                       alt="Preview" 
                       className="max-w-full max-h-[calc(100vh-12rem)] object-contain bg-white"
                       style={{ 
                          filter: getFilterStyle(),
                          transition: 'filter 0.3s ease-in-out'
                       }}
                       draggable={false}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-white text-[10px] font-mono font-bold tracking-widest pointer-events-none">
                       {activeIndex + 1} / {pages.length}
                    </div>
                 </motion.div>
              ) : (
                 <Loader2 className="w-8 h-8 animate-spin text-charcoal-300" />
              )}
           </div>
        </div>

        {/* Control Deck */}
        <div className="shrink-0 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 z-40 pb-[env(safe-area-inset-bottom)]">
           <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col items-center gap-4">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-charcoal-800 rounded-xl w-full">
                 {[
                    { id: 'original', label: 'Original', icon: <FileText size={14} /> },
                    { id: 'grayscale', label: 'Grayscale', icon: <Monitor size={14} /> },
                    { id: 'sepia', label: 'Sepia', icon: <Sun size={14} /> },
                    { id: 'night', label: 'Night', icon: <Moon size={14} /> }
                 ].map((mode) => (
                    <button
                       key={mode.id}
                       onClick={() => setVisualMode(mode.id as VisualFilterMode)}
                       className={`
                          flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all
                          ${visualMode === mode.id 
                             ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm' 
                             : 'text-charcoal-500 dark:text-slate-400 hover:text-charcoal-800 dark:hover:text-slate-200'}
                       `}
                    >
                       {mode.icon}
                       <span className="hidden xs:inline">{mode.label}</span>
                    </button>
                 ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                 <motion.button
                    whileTap={buttonTap}
                    onClick={() => setIsFilmstripOpen(true)}
                    className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700 border border-slate-200 dark:border-charcoal-700 transition-colors"
                    title="View Pages"
                 >
                    <LayoutGrid size={18} />
                 </motion.button>

                 <motion.button
                    whileTap={buttonTap}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="
                       flex-1 flex items-center justify-center gap-2 
                       px-6 py-3 bg-brand-purple hover:bg-brand-purpleDark 
                       text-white font-bold font-mono text-xs uppercase tracking-widest 
                       rounded-xl shadow-lg shadow-brand-purple/20 
                       transition-all disabled:opacity-70 disabled:cursor-not-allowed
                    "
                 >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>{isGenerating ? 'Processing...' : 'Export PDF'}</span>
                 </motion.button>
              </div>
           </div>
        </div>

        <FilmstripModal
           isOpen={isFilmstripOpen}
           onClose={() => setIsFilmstripOpen(false)}
           title={`Pages (${pages.length})`}
        >
           <div className="p-4 bg-slate-50 dark:bg-black/20 min-h-full">
              <Filmstrip 
                 images={filmstripImages}
                 activeImageId={activePageId}
                 onSelect={(id) => { setActivePageId(id); setIsFilmstripOpen(false); }}
                 onReorder={() => {}} onRemove={() => {}} onRotate={() => {}} 
                 isMobile={true} direction="vertical" size="md" isReorderable={false} showRemoveButton={false} showRotateButton={false} 
              />
           </div>
        </FilmstripModal>
      </div>
    );
  }

  // --- DESKTOP LAYOUT (3-PANEL) ---
  const visualModes: { id: VisualFilterMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'original', label: 'Original', icon: <FileText size={18} />, desc: 'No changes applied.' },
    { id: 'grayscale', label: 'Grayscale', icon: <Monitor size={18} />, desc: 'Classic black & white.' },
    { id: 'sepia', label: 'Sepia', icon: <Sun size={18} />, desc: 'Warm, antique aesthetic.' },
    { id: 'night', label: 'Night Mode', icon: <Moon size={18} />, desc: 'Inverted colors for dark reading.' },
  ];

  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden">
      <PageReadyTracker />
      
      {/* 1. LEFT PANE: Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <Layers size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={filmstripImages}
                  activeImageId={activePageId}
                  onSelect={(id) => setActivePageId(id)}
                  onReorder={() => {}} onRemove={() => {}} onRotate={() => {}}
                  isMobile={false}
                  direction="vertical"
                  size="md"
                  isReorderable={false}
                  showRemoveButton={false}
                  showRotateButton={false}
              />
          </div>
      </div>

      {/* 2. CENTER PANE: Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
          {/* Toolbar */}
          <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">{file.file.name}</span>
                  <div className="w-px h-3 bg-slate-300 dark:bg-charcoal-700" />
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-charcoal-700 dark:text-charcoal-200">MODE:</span>
                     <span className="uppercase">{visualMode}</span>
                  </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button 
                    onClick={() => { setFitMode('actual'); setZoom(z => Math.max(0.1, z - 0.1)); }} 
                    className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={() => { setFitMode('actual'); setZoom(z => Math.min(3, z + 0.1)); }} 
                    className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button 
                    onClick={() => setFitMode('fit')} 
                    className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" 
                    title="Fit to Viewport"
                  >
                    <Maximize size={14} />
                  </button>
              </div>
          </div>

          {/* Canvas Area */}
          <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                   style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />
              
              {activePage ? (
                 <motion.div
                    layoutId={`preview-${activePage.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={techEase}
                    className="relative shadow-2xl ring-1 ring-black/5"
                    style={{ width: (activePage.width || 600) * zoom, height: (activePage.height || 800) * zoom }}
                 >
                    <img 
                       src={activePage.previewUrl} 
                       alt="Active Page" 
                       className="w-full h-full object-contain bg-white"
                       style={{ 
                          filter: getFilterStyle(),
                          transition: 'filter 0.3s ease-in-out'
                       }}
                       draggable={false}
                    />
                 </motion.div>
              ) : (
                 <Loader2 className="w-8 h-8 animate-spin text-charcoal-300" />
              )}
          </div>
      </div>

      {/* 3. RIGHT PANE: Settings */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Visual Settings</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="space-y-3">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                      Filter Mode
                  </label>
                  <div className="space-y-2">
                      {visualModes.map((mode) => (
                          <button
                              key={mode.id}
                              onClick={() => setVisualMode(mode.id)}
                              className={`
                                  w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all group
                                  ${visualMode === mode.id 
                                      ? 'bg-brand-purple/5 border-brand-purple ring-1 ring-brand-purple/20' 
                                      : 'bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/50'}
                              `}
                          >
                              <div className={`shrink-0 p-2 rounded-lg transition-colors ${visualMode === mode.id ? 'bg-brand-purple text-white' : 'bg-slate-100 dark:bg-charcoal-700 text-charcoal-500 dark:text-slate-400 group-hover:text-brand-purple'}`}>
                                  {mode.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                      <span className={`text-xs font-bold font-mono ${visualMode === mode.id ? 'text-brand-purple' : 'text-charcoal-700 dark:text-slate-200'}`}>
                                          {mode.label}
                                      </span>
                                      {visualMode === mode.id && <Check size={14} className="text-brand-purple" />}
                                  </div>
                                  <p className="text-[10px] text-charcoal-500 dark:text-slate-400 mt-0.5 leading-tight">
                                      {mode.desc}
                                  </p>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          {/* Action Footer */}
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
                      <span>{isGenerating ? status || 'PROCESSING...' : 'EXPORT PDF'}</span>
                  </div>
              </motion.button>
              
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={handleReset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset All
              </motion.button>
          </div>
      </div>
    </div>
  );
};
