
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, Annotation, UploadedImage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { searchPdfText, SearchResult } from '../services/pdfTextSearch';
import { loadPdfJs } from '../services/pdfProvider';
import { PDFDocument } from 'pdf-lib';
import { Filmstrip } from '../components/Filmstrip';
import { FilmstripModal } from '../components/FilmstripModal';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeOff, Lock, Settings, Cpu, Layers, Download, Undo2, 
  ZoomIn, ZoomOut, Maximize, MousePointer2, RefreshCw, 
  Search, Eye, ShieldAlert, CheckSquare, Trash2, ShieldCheck, X, Loader2,
  Palette, FileText, ChevronUp, ChevronDown
} from 'lucide-react';
import { buttonTap, techEase, modalContentVariants } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileRejection } from 'react-dropzone';
import { Sidebar } from '../components/Sidebar';

// --- Constants ---
const DEFAULT_COLOR = '#000000';

export const RedactPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- Data State ---
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  
  // --- UI State ---
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width'>('fit');
  const [verificationMode, setVerificationMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- Mobile State ---
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // --- Redaction State ---
  const [redactionMode, setRedactionMode] = useState<'draw' | 'search'>('draw');
  const [redactColor, setRedactColor] = useState<'black' | 'white'>('black');
  const [showLabel, setShowLabel] = useState(false);
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Interaction State ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [currentDragRect, setCurrentDragRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);
  
  // --- Processing ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // --- Helpers ---
  const activePage = pages.find(p => p.id === activePageId) || null;
  const activeIndex = pages.findIndex(p => p.id === activePageId);

  // --- Handlers ---

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessing(true);
    setStatus('Loading PDF...');
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: 1.5 });
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
        setActivePageId(loadedPages[0].id);
        setSelectedPageIds(new Set([loadedPages[0].id]));
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setActivePageId(null);
    setSearchResults([]);
    setSearchQuery('');
    setVerificationMode(false);
  };

  // --- Zoom Logic ---
  useEffect(() => {
    if (!containerRef.current || !activePage) return;
    const updateZoom = () => {
      const { width: contW, height: contH } = containerRef.current!.getBoundingClientRect();
      // Adjust padding for mobile vs desktop
      const padding = isMobile ? 32 : 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);
      const scale = Math.min(availW / (activePage.width || 600), availH / (activePage.height || 800));
      setZoom(scale);
    };
    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    updateZoom();
    return () => observer.disconnect();
  }, [activePage, fitMode, isMobile]);

  // --- Drawing Logic ---
  const getRelativeCoords = (e: React.PointerEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (redactionMode !== 'draw') return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (!coords) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setDragStart(coords);
    setCurrentDragRect({ left: coords.x, top: coords.y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !dragStart) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (!coords) return;
    const left = Math.min(coords.x, dragStart.x);
    const top = Math.min(coords.y, dragStart.y);
    const width = Math.abs(coords.x - dragStart.x);
    const height = Math.abs(coords.y - dragStart.y);
    setCurrentDragRect({ left, top, width, height });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    (e.target as Element).releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    
    if (dragStart && currentDragRect && activePage && currentDragRect.width > 0.5 && currentDragRect.height > 0.5) {
        const newAnnotation: Annotation = {
            id: nanoid(),
            type: 'redact',
            x: currentDragRect.left,
            y: currentDragRect.top,
            width: currentDragRect.width,
            height: currentDragRect.height,
            color: redactColor === 'black' ? '#000000' : '#FFFFFF',
            text: showLabel ? 'REDACTED' : undefined
        };
        
        setPages(prev => prev.map(p => p.id === activePage.id ? { ...p, annotations: [...(p.annotations || []), newAnnotation] } : p));
    }
    setDragStart(null);
    setCurrentDragRect(null);
  };

  const removeAnnotation = (pageId: string, annotationId: string) => {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, annotations: (p.annotations || []).filter(a => a.id !== annotationId) } : p));
  };

  const undoLastRedaction = () => {
      if (!activePage?.annotations?.length) return;
      const lastId = activePage.annotations[activePage.annotations.length - 1].id;
      removeAnnotation(activePage.id, lastId);
  };

  // --- Pattern Search Logic ---
  const handleSearch = async () => {
      if (!file || !searchQuery) return;
      setIsSearching(true);
      try {
          const results = await searchPdfText(file, searchQuery, setProgress);
          setSearchResults(results);
          if (results.length === 0) addToast("No matches", "Try a different term.", "warning");
      } catch (e) {
          addToast("Error", "Search failed.", "error");
      } finally {
          setIsSearching(false);
          setProgress(0);
      }
  };

  const applySearchResult = (result: SearchResult) => {
      const targetPage = pages[result.pageIndex];
      if (!targetPage) return;
      
      const newAnnotation: Annotation = {
          id: nanoid(),
          type: 'redact',
          x: result.x,
          y: result.y,
          width: result.width,
          height: result.height,
          color: redactColor === 'black' ? '#000000' : '#FFFFFF',
          text: showLabel ? 'REDACTED' : undefined
      };

      setPages(prev => prev.map((p, idx) => idx === result.pageIndex ? { ...p, annotations: [...(p.annotations || []), newAnnotation] } : p));
      
      // Auto-jump to that page
      setActivePageId(targetPage.id);
  };

  // --- Secure Export Logic ---
  const handleExport = async () => {
      if (!file) return;
      setIsGenerating(true);
      setStatus('Initializing secure export...');
      setProgress(0);

      try {
          const newPdf = await PDFDocument.create();
          const originalBytes = await file.arrayBuffer();
          const srcPdf = await PDFDocument.load(originalBytes);
          
          const pdfjsLib = await loadPdfJs();
          const loadingTask = pdfjsLib.getDocument({ data: originalBytes.slice(0), cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/', cMapPacked: true });
          const pdfDoc = await loadingTask.promise;

          for (let i = 0; i < pages.length; i++) {
              const pageData = pages[i];
              const hasRedactions = pageData.annotations && pageData.annotations.length > 0;
              
              setStatus(`Processing page ${i + 1}/${pages.length}...`);
              setProgress(Math.round((i / pages.length) * 90));

              if (hasRedactions) {
                  const page = await pdfDoc.getPage(i + 1);
                  const viewport = page.getViewport({ scale: 2.0 }); 
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  if (!ctx) continue;
                  
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  
                  await page.render({ canvasContext: ctx, viewport }).promise;
                  
                  pageData.annotations?.forEach(ann => {
                      const x = (ann.x / 100) * canvas.width;
                      const y = (ann.y / 100) * canvas.height;
                      const w = (ann.width! / 100) * canvas.width;
                      const h = (ann.height! / 100) * canvas.height;
                      
                      ctx.fillStyle = ann.color || '#000000';
                      ctx.fillRect(x, y, w, h);
                      
                      if (ann.text) {
                          ctx.font = `bold ${h * 0.4}px monospace`;
                          ctx.fillStyle = ann.color === '#000000' ? '#FFFFFF' : '#000000';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(ann.text, x + w/2, y + h/2);
                      }
                  });
                  
                  const imgData = canvas.toDataURL('image/jpeg', 0.85);
                  const embeddedImage = await newPdf.embedJpg(imgData);
                  const newPage = newPdf.addPage([viewport.width / 2, viewport.height / 2]);
                  newPage.drawImage(embeddedImage, {
                      x: 0, y: 0, 
                      width: viewport.width / 2, 
                      height: viewport.height / 2
                  });

              } else {
                  const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
                  newPdf.addPage(copiedPage);
              }
              await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          setStatus('Saving...');
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `redacted_${file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          addToast("Success", "Secure PDF exported!", "success");

      } catch (e) {
          console.error(e);
          addToast("Error", "Export failed.", "error");
      } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
      }
  };

  if (!file) {
    return (
      <ToolLandingLayout
        title="Redact PDF"
        description="Permanently obscure sensitive information. Securely rasterizes redacted pages to prevent data recovery."
        icon={<EyeOff />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        isProcessing={isProcessing}
        accentColor="text-slate-600"
        specs={[
          { label: "Method", value: "Rasterization", icon: <ShieldCheck /> },
          { label: "Security", value: "Irreversible", icon: <Lock /> },
          { label: "Search", value: "Pattern Match", icon: <Search /> },
          { label: "Privacy", value: "Local Only", icon: <Cpu /> },
        ]}
        tip="Redacted pages are converted to images to ensure the text underneath is completely destroyed."
      />
    );
  }

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
        <PageReadyTracker />
        
        {/* Header */}
        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-slate-100 dark:bg-charcoal-800 rounded-lg text-charcoal-600 dark:text-slate-300 shrink-0">
                    <ShieldCheck size={18} />
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

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-4 bg-slate-100 dark:bg-black/20 custom-scrollbar">
            {activePage && activePage.width && activePage.height ? (
                <motion.div 
                    layoutId="canvas"
                    className="relative bg-white shadow-xl ring-1 ring-black/5"
                    style={{ width: activePage.width * zoom, height: activePage.height * zoom }}
                >
                    {/* Interactive Layer */}
                    <div 
                        className="absolute inset-0 z-10 touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                    
                    <img 
                        ref={imageRef}
                        src={activePage.previewUrl} 
                        className="w-full h-full object-contain pointer-events-none select-none" 
                        draggable={false} 
                        alt="Page"
                    />

                    {/* Drawing Preview */}
                    {isDrawing && currentDragRect && (
                        <div className="absolute z-20 border-2 border-brand-purple bg-brand-purple/20 pointer-events-none"
                             style={{ left: `${currentDragRect.left}%`, top: `${currentDragRect.top}%`, width: `${currentDragRect.width}%`, height: `${currentDragRect.height}%` }}
                        />
                    )}

                    {/* Annotations */}
                    <AnimatePresence>
                        {(activePage.annotations || []).map(ann => (
                            <motion.div
                                key={ann.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute z-20 pointer-events-none"
                                style={{
                                    left: `${ann.x}%`, top: `${ann.y}%`, width: `${ann.width}%`, height: `${ann.height}%`,
                                    backgroundColor: verificationMode ? (ann.color === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)') : ann.color,
                                    backdropFilter: verificationMode ? 'blur(4px)' : 'none',
                                    border: verificationMode ? `2px dashed ${ann.color === '#FFFFFF' ? 'black' : 'red'}` : 'none'
                                }}
                            >
                                {(ann.text && !verificationMode) && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span 
                                            className="text-[10px] font-bold font-mono tracking-widest opacity-50 select-none"
                                            style={{ color: ann.color === '#FFFFFF' ? 'black' : 'white' }}
                                        >
                                            {ann.text}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-charcoal-400 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                   <Loader2 size={24} className="animate-spin opacity-50" />
                   <span>Loading Page...</span>
                </div>
            )}
        </div>

        {/* Bottom Floating Bar */}
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
                    onClick={() => undoLastRedaction()}
                    disabled={!activePage?.annotations?.length}
                    className="p-2.5 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300 disabled:opacity-50"
                >
                    <Undo2 size={18} />
                </motion.button>

                <motion.button
                    whileTap={buttonTap}
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`p-2.5 rounded-xl transition-colors ${isToolsOpen ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300'}`}
                >
                    <Settings size={18} />
                </motion.button>

                <motion.button
                    whileTap={buttonTap}
                    onClick={handleExport}
                    disabled={isGenerating || pages.every(p => !p.annotations?.length)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Save</span>
                </motion.button>
            </div>
        </div>

        {/* Filmstrip Modal */}
        <FilmstripModal
            isOpen={isFilmstripOpen}
            onClose={() => setIsFilmstripOpen(false)}
            title={`Pages (${pages.length})`}
        >
            <Filmstrip 
                images={pages.map(p => ({
                    id: p.id, 
                    file: file!, 
                    previewUrl: p.previewUrl, 
                    width: 0, height: 0, rotation: 0
                }))}
                activeImageId={activePageId}
                onSelect={(id) => { setActivePageId(id); setIsFilmstripOpen(false); }}
                onReorder={()=>{}} onRemove={()=>{}} onRotate={()=>{}}
                isMobile={true} direction="vertical" size="md" isReorderable={false} showRemoveButton={false} showRotateButton={false}
            />
        </FilmstripModal>

        {/* Tools Bottom Sheet */}
        <AnimatePresence>
            {isToolsOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsToolsOpen(false)}
                        className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm pointer-events-auto"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full bg-white dark:bg-charcoal-900 rounded-t-2xl shadow-2xl pointer-events-auto overflow-hidden pb-[env(safe-area-inset-bottom)]"
                    >
                        <div className="px-6 py-2 flex justify-center">
                            <div className="w-12 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
                        </div>
                        
                        <div className="p-6 pt-2 space-y-6">
                            {/* Mode Toggle */}
                            <div className="flex bg-slate-100 dark:bg-charcoal-800 p-1 rounded-xl">
                                <button 
                                    onClick={() => setRedactionMode('draw')} 
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${redactionMode === 'draw' ? 'bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500'}`}
                                >
                                    <MousePointer2 size={14} /> Draw
                                </button>
                                <button 
                                    onClick={() => setRedactionMode('search')} 
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${redactionMode === 'search' ? 'bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500'}`}
                                >
                                    <Search size={14} /> Search
                                </button>
                            </div>

                            {redactionMode === 'draw' ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Color</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setRedactColor('black')} className={`w-8 h-8 rounded-full bg-black border-2 ${redactColor === 'black' ? 'border-brand-purple' : 'border-transparent'}`} />
                                            <button onClick={() => setRedactColor('white')} className={`w-8 h-8 rounded-full bg-white border-2 ${redactColor === 'white' ? 'border-brand-purple' : 'border-slate-200'}`} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Label</label>
                                        <button onClick={() => setShowLabel(!showLabel)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${showLabel ? 'bg-brand-purple text-white border-brand-purple' : 'bg-transparent border-slate-200 text-charcoal-600'}`}>
                                            {showLabel ? 'SHOWN' : 'HIDDEN'}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Verify</label>
                                        <button onClick={() => setVerificationMode(!verificationMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${verificationMode ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-transparent border-slate-200 text-charcoal-600'}`}>
                                            {verificationMode ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {verificationMode ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Find text..."
                                            className="w-full bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl px-4 py-3 pl-10 text-sm font-mono outline-none"
                                        />
                                        <Search size={16} className="absolute left-3.5 top-3.5 text-charcoal-400" />
                                    </div>
                                    <button 
                                        onClick={handleSearch}
                                        disabled={isSearching || !searchQuery}
                                        className="w-full py-3 bg-brand-purple text-white rounded-xl text-xs font-bold font-mono hover:bg-brand-purpleDark disabled:opacity-50"
                                    >
                                        {isSearching ? 'Searching...' : 'Find Matches'}
                                    </button>
                                    {searchResults.length > 0 && (
                                        <div className="max-h-32 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-100 dark:border-charcoal-700 p-2 space-y-1">
                                            {searchResults.map(r => (
                                                <button key={r.id} onClick={() => { applySearchResult(r); setIsToolsOpen(false); }} className="w-full text-left p-2 rounded-lg hover:bg-white dark:hover:bg-charcoal-700 text-xs font-mono truncate">
                                                    {r.text} <span className="opacity-50 ml-1">(Pg {r.pageIndex + 1})</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Desktop 3-Panel Layout ---
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
                    images={pages.map(p => ({
                        id: p.id, 
                        file: file, 
                        previewUrl: p.previewUrl, 
                        width: 0, height: 0, rotation: 0
                    }))}
                    activeImageId={activePageId}
                    onSelect={(id) => setActivePageId(id)}
                    onReorder={()=>{}} onRemove={()=>{}} onRotate={()=>{}}
                    isMobile={false} direction="vertical" size="md" isReorderable={false} showRemoveButton={false} showRotateButton={false}
                />
            </div>
        </div>

        {/* 2. CENTER PANE: Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                    <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">{file.name}</span>
                    {activePage && <span className="opacity-50">Page {activeIndex + 1}</span>}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                    <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                    <button onClick={() => setFitMode(fitMode === 'fit' ? 'width' : 'fit')} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Toggle Fit"><Maximize size={14} /></button>
                </div>
            </div>

            {/* Main Stage */}
            <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                {activePage && activePage.width && activePage.height && (
                    <motion.div 
                        layoutId="canvas"
                        className="relative bg-white shadow-2xl ring-1 ring-black/5"
                        style={{ width: activePage.width * zoom, height: activePage.height * zoom }}
                    >
                        {/* Interactive Layer */}
                        <div 
                            className="absolute inset-0 z-10 touch-none"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            style={{ cursor: redactionMode === 'draw' ? 'crosshair' : 'default' }}
                        />
                        
                        <img 
                            ref={imageRef}
                            src={activePage.previewUrl} 
                            className="w-full h-full object-contain pointer-events-none select-none" 
                            draggable={false} 
                            alt="Page"
                        />

                        {/* Drawing Preview */}
                        {isDrawing && currentDragRect && (
                            <div className="absolute z-20 border-2 border-brand-purple bg-brand-purple/20 pointer-events-none"
                                 style={{ left: `${currentDragRect.left}%`, top: `${currentDragRect.top}%`, width: `${currentDragRect.width}%`, height: `${currentDragRect.height}%` }}
                            />
                        )}

                        {/* Annotations */}
                        <AnimatePresence>
                            {(activePage.annotations || []).map(ann => (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute z-20 group"
                                    style={{
                                        left: `${ann.x}%`, top: `${ann.y}%`, width: `${ann.width}%`, height: `${ann.height}%`,
                                        backgroundColor: verificationMode ? (ann.color === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)') : ann.color,
                                        backdropFilter: verificationMode ? 'blur(4px)' : 'none',
                                        border: verificationMode ? `2px dashed ${ann.color === '#FFFFFF' ? 'black' : 'red'}` : 'none'
                                    }}
                                >
                                    {(ann.text && !verificationMode) && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span 
                                                className="text-xs font-bold font-mono tracking-widest opacity-50 select-none"
                                                style={{ color: ann.color === '#FFFFFF' ? 'black' : 'white', fontSize: `${zoom * 12}px` }}
                                            >
                                                {ann.text}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Remove Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeAnnotation(activePage.id, ann.id); }}
                                        className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm z-30 pointer-events-auto"
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>

        {/* 3. RIGHT PANE: Controls */}
        <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Control Tabs */}
            <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-4 shrink-0 bg-slate-50 dark:bg-charcoal-850/50 gap-2">
                <button 
                    onClick={() => setRedactionMode('draw')}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-colors ${redactionMode === 'draw' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm ring-1 ring-black/5' : 'text-charcoal-500 hover:bg-white/50'}`}
                >
                    <MousePointer2 size={14} /> Draw
                </button>
                <button 
                    onClick={() => setRedactionMode('search')}
                    className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-colors ${redactionMode === 'search' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm ring-1 ring-black/5' : 'text-charcoal-500 hover:bg-white/50'}`}
                >
                    <Search size={14} /> Search
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {redactionMode === 'draw' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">Appearance</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setRedactColor('black')}
                                    className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${redactColor === 'black' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-200 dark:border-charcoal-700 hover:border-slate-300'}`}
                                >
                                    <div className="w-6 h-6 bg-black rounded-full shadow-sm" />
                                    <span className="text-[10px] font-mono font-bold text-charcoal-700 dark:text-charcoal-300">Black</span>
                                </button>
                                <button 
                                    onClick={() => setRedactColor('white')}
                                    className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${redactColor === 'white' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-200 dark:border-charcoal-700 hover:border-slate-300'}`}
                                >
                                    <div className="w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm" />
                                    <span className="text-[10px] font-mono font-bold text-charcoal-700 dark:text-charcoal-300">White</span>
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setShowLabel(!showLabel)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${showLabel ? 'bg-brand-purple/5 border-brand-purple text-brand-purple' : 'bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300'}`}
                            >
                                <span className="text-xs font-bold font-mono">Show "REDACTED" Label</span>
                                {showLabel ? <CheckSquare size={16} /> : <div className="w-4 h-4 rounded border border-current opacity-50" />}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">Page History</label>
                            {activePage?.annotations && activePage.annotations.length > 0 ? (
                                <div className="space-y-2">
                                    {activePage.annotations.map((ann, idx) => (
                                        <div key={ann.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-charcoal-800 rounded-lg border border-slate-200 dark:border-charcoal-700 text-xs font-mono group">
                                            <span className="text-charcoal-600 dark:text-charcoal-300">Item #{idx + 1}</span>
                                            <button onClick={() => removeAnnotation(activePage.id, ann.id)} className="text-charcoal-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 border border-dashed border-slate-200 dark:border-charcoal-700 rounded-xl text-xs text-charcoal-400 font-mono">
                                    No redactions on this page
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {redactionMode === 'search' && (
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="relative">
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Enter text pattern..."
                                className="w-full bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl px-4 py-3 pl-10 text-sm font-mono focus:ring-2 focus:ring-brand-purple/50 outline-none"
                            />
                            <Search size={16} className="absolute left-3.5 top-3.5 text-charcoal-400" />
                        </div>
                        <button 
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery}
                            className="w-full py-2 bg-brand-purple text-white rounded-lg text-xs font-bold font-mono hover:bg-brand-purpleDark disabled:opacity-50 transition-colors"
                        >
                            {isSearching ? 'Searching...' : 'Find Matches'}
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0 border-t border-slate-100 dark:border-charcoal-800 pt-4">
                            {searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <button 
                                        key={result.id}
                                        onClick={() => applySearchResult(result)}
                                        className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:border-brand-purple bg-white dark:bg-charcoal-800 transition-all group"
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Page {result.pageIndex + 1}</span>
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-green-500">APPLY</span>
                                        </div>
                                        <p className="text-xs text-charcoal-600 dark:text-charcoal-300 font-mono truncate">"{result.text}"</p>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center text-xs text-charcoal-400 mt-8 font-mono">
                                    No matches found.
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
                <button 
                    onClick={() => setVerificationMode(!verificationMode)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold font-mono border transition-all ${verificationMode ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-charcoal-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    {verificationMode ? <Eye size={14} /> : <EyeOff size={14} />} 
                    {verificationMode ? 'Exit Verification' : 'Verify Redactions'}
                </button>

                <motion.button 
                    onClick={handleExport} 
                    disabled={isGenerating || pages.every(p => !p.annotations?.length)} 
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
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        <span>{isGenerating ? status || 'SECURING...' : 'SECURE EXPORT'}</span>
                    </div>
                </motion.button>
                
                {pages.some(p => p.annotations?.length) && (
                    <p className="text-[9px] text-center text-rose-500 font-mono font-bold uppercase tracking-wider animate-pulse">
                        Irreversible Operation
                    </p>
                )}
            </div>
        </div>
    </div>
  );
};
