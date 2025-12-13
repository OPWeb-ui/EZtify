
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, Annotation, UploadedImage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { savePdfWithEditorChanges } from '../services/pdfEditor';
import { Filmstrip } from '../components/Filmstrip';
import { FileRejection, useDropzone } from 'react-dropzone';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Undo2, Download, RefreshCw, ZoomIn, ZoomOut, Loader2, FileText, Palette, MousePointer2, LayoutGrid, EyeOff, Lock, Settings, Cpu, Type, CheckSquare, Minus, Plus, Square, PanelBottom } from 'lucide-react';
import { buttonTap, techEase } from '../utils/animations';
import { FilmstripModal } from '../components/FilmstripModal';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'
];

const ColorPickerDropdown = ({ color, onChange }: { color: string, onChange: (c: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <motion.button 
        whileTap={buttonTap}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 dark:bg-charcoal-800 p-2 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors"
        title="Change Color"
      >
        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-charcoal-500 shadow-sm" style={{ backgroundColor: color }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-full left-0 z-[160] mt-2 p-2 bg-white dark:bg-charcoal-900 rounded-xl shadow-xl border border-slate-200 dark:border-charcoal-700 grid grid-cols-4 gap-2 w-[140px]"
            >
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange(c); setIsOpen(false); }}
                  className="w-6 h-6 rounded-full border border-slate-200 dark:border-charcoal-700 relative flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <div className={`w-2 h-2 rounded-full ${['#FFFFFF', '#FACC15'].includes(c) ? 'bg-black' : 'bg-white'}`} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RedactPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  // Tools state
  const [activeTool, setActiveTool] = useState<'redact' | 'text' | 'checkbox'>('redact');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(14);
  const [zoom, setZoom] = useState(1);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [isFilmstripModalOpen, setIsFilmstripModalOpen] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [currentDragRect, setCurrentDragRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const activePage = pages.find(p => p.id === activePageId) || null;

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ w: width, h: height });
    });
    observer.observe(canvasContainerRef.current);
    return () => observer.disconnect();
  }, [file]); 

  const calculateBaseScale = () => {
    if (!activePage?.width || !activePage?.height || containerSize.w === 0 || containerSize.h === 0) return 1;
    const padding = 32; 
    const availableW = Math.max(0, containerSize.w - padding);
    const availableH = Math.max(0, containerSize.h - padding);
    const scaleX = availableW / activePage.width;
    const scaleY = availableH / activePage.height;
    return Math.min(scaleX, scaleY);
  };

  const baseScale = calculateBaseScale();
  const renderScale = baseScale * zoom;

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setIsProcessingFiles(true);
    setStatus('Loading pages...');
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus, { scale: 1.5 });
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
        setActivePageId(loadedPages[0].id);
        setZoom(1);
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const updatePageAnnotations = (pageId: string, newAnnotations: Annotation[]) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, annotations: newAnnotations } : p));
  };
  
  const handleUndo = () => {
    if (!activePage) return;
    updatePageAnnotations(activePage.id, (activePage.annotations || []).slice(0, -1));
  };

  const getRelativeCoords = (e: React.PointerEvent | React.MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'redact') {
      e.preventDefault(); 
      const coords = getRelativeCoords(e);
      if (!coords) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      setIsDrawing(true);
      setDragStart(coords);
      setCurrentDragRect({ left: coords.x, top: coords.y, width: 0, height: 0 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !dragStart || activeTool !== 'redact') return;
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
    // Only capture click for non-drawing tools, or end drawing
    
    if (activeTool === 'redact') {
        if (!isDrawing) return;
        (e.target as Element).releasePointerCapture(e.pointerId);
        setIsDrawing(false);
        if (dragStart && currentDragRect && activePage) {
            if (currentDragRect.width > 0.5 && currentDragRect.height > 0.5) {
               const newAnnotation: Annotation = {
                 id: nanoid(), type: 'redact', x: currentDragRect.left, y: currentDragRect.top, 
                 width: currentDragRect.width, height: currentDragRect.height, color
               };
               updatePageAnnotations(activePage.id, [...(activePage.annotations || []), newAnnotation]);
            }
        }
        setDragStart(null);
        setCurrentDragRect(null);
    } else if (activePage) {
        // Click to place Text or Checkbox
        const coords = getRelativeCoords(e);
        if (!coords) return;

        if (activeTool === 'text') {
            const text = prompt("Enter annotation text:", "");
            if (text) {
                const newAnnotation: Annotation = {
                    id: nanoid(), type: 'text',
                    x: coords.x, y: coords.y,
                    text, fontSize, color
                };
                updatePageAnnotations(activePage.id, [...(activePage.annotations || []), newAnnotation]);
            }
        } else if (activeTool === 'checkbox') {
            const newAnnotation: Annotation = {
                id: nanoid(), type: 'checkbox',
                x: coords.x, y: coords.y,
                text: 'X', fontSize: fontSize + 4, color
            };
            updatePageAnnotations(activePage.id, [...(activePage.annotations || []), newAnnotation]);
        }
    }
  };
  
  const removeAnnotation = (id: string) => {
    if (!activePage) return;
    updatePageAnnotations(activePage.id, (activePage.annotations || []).filter(a => a.id !== id));
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       const blob = await savePdfWithEditorChanges(file, pages, undefined, setProgress, setStatus);
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `edited_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF processed!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
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
    setZoom(1);
    setActiveTool('redact');
  };

  const handleSelectFromModal = (id: string) => {
    setActivePageId(id);
    setIsFilmstripModalOpen(false);
  };

  const filmstripImages: UploadedImage[] = pages.map(p => ({
    id: p.id,
    file: file!,
    previewUrl: p.previewUrl,
    width: p.width || 0, height: p.height || 0,
    rotation: p.rotation || 0
  }));

  const ToolButton = ({ tool, icon, label }: { tool: 'redact' | 'text' | 'checkbox', icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border
        ${activeTool === tool
          ? 'bg-brand-purple text-white border-brand-purple shadow-md' 
          : 'bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-600 hover:bg-slate-50 dark:hover:bg-charcoal-600'
        }
      `}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full pt-16 bg-slate-100 dark:bg-charcoal-900 overflow-hidden">
      <PageReadyTracker />
      
      {!file ? (
        <ToolLandingLayout
            title="Redact PDF"
            description="Permanently hide sensitive information or add annotations like text and checkboxes."
            icon={<EyeOff />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-slate-600"
            specs={[
              { label: "Tools", value: "Redact/Text", icon: <MousePointer2 /> },
              { label: "Color", value: "Custom", icon: <Palette /> },
              { label: "Privacy", value: "Client-Side", icon: <Lock /> },
              { label: "Export", value: "Flattened", icon: <Settings /> },
            ]}
            tip="Redaction blocks are permanent. Text annotations are added as flattened vector graphics."
        />
      ) : (
        <>
          {/* ZONE 1: Tech Toolbar */}
          <div className="h-16 shrink-0 bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between px-4 z-30 shadow-sm relative overflow-x-auto no-scrollbar gap-4">
             <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-500 transition-colors" title="Close File">
                   <X size={20} />
                </motion.button>
                <div className="h-6 w-px bg-slate-200 dark:bg-charcoal-700 hidden sm:block" />
                
                {/* Tool Selector */}
                <div className="flex gap-2">
                   <ToolButton tool="redact" icon={<Square size={14} />} label="Redact" />
                   <ToolButton tool="text" icon={<Type size={14} />} label="Text" />
                   <ToolButton tool="checkbox" icon={<CheckSquare size={14} />} label="Check" />
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-charcoal-700" />
                
                {/* Contextual Controls */}
                <div className="flex items-center gap-2">
                    <ColorPickerDropdown color={color} onChange={setColor} />
                    
                    {(activeTool === 'text' || activeTool === 'checkbox') && (
                        <div className="flex items-center bg-slate-100 dark:bg-charcoal-800 rounded-lg p-0.5 border border-slate-200 dark:border-charcoal-700">
                            <button onClick={() => setFontSize(s => Math.max(8, s - 2))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 transition-colors"><Minus size={12} /></button>
                            <span className="w-8 text-center text-[10px] font-mono font-bold text-charcoal-600 dark:text-slate-300">{fontSize}</span>
                            <button onClick={() => setFontSize(s => Math.min(72, s + 2))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 transition-colors"><Plus size={12} /></button>
                        </div>
                    )}
                </div>
             </div>

             <div className="flex items-center gap-2 shrink-0">
                <motion.button 
                  whileTap={buttonTap} 
                  onClick={handleUndo} 
                  disabled={(activePage?.annotations?.length || 0) === 0}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-500 disabled:opacity-30 transition-colors"
                  title="Undo"
                >
                   <Undo2 size={18} />
                </motion.button>
                
                {/* Zoom Controls */}
                <div className="hidden md:flex items-center bg-slate-100 dark:bg-charcoal-800 rounded-lg p-0.5 border border-slate-200 dark:border-charcoal-700">
                   <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                   <span className="w-12 text-center text-xs font-mono font-bold text-charcoal-600 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                </div>
             </div>
          </div>

          {/* ZONE 2: Main PDF Preview Area */}
          <div ref={canvasContainerRef} className="flex-1 min-h-0 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] grid place-items-center relative">
             {/* Tech Grid Overlay */}
             <div className="absolute inset-0 pointer-events-none border-t border-slate-200/50 dark:border-charcoal-700/50" />

             {activePage && activePage.width && activePage.height && (
                <motion.div 
                   className="relative bg-white shadow-xl ring-1 ring-slate-200 dark:ring-charcoal-700 transition-transform duration-100 ease-linear"
                   style={{ 
                      width: activePage.width * renderScale, 
                      height: activePage.height * renderScale,
                      cursor: activeTool === 'redact' ? 'crosshair' : 'text'
                   }}
                >
                   <div 
                      className="absolute inset-0 z-10 touch-none"
                      onPointerDown={handlePointerDown} 
                      onPointerMove={handlePointerMove} 
                      onPointerUp={handlePointerUp} 
                      onPointerLeave={handlePointerUp}
                      style={{ touchAction: 'none' }}
                   />
                   
                   <img 
                      ref={imageRef}
                      src={activePage.previewUrl} 
                      alt={`Page ${activePage.pageIndex + 1}`} 
                      className="w-full h-full object-contain select-none pointer-events-none" 
                      draggable={false} 
                   />

                   {/* Drawing Preview */}
                   {isDrawing && currentDragRect && (
                     <div className="absolute border-2 z-20 pointer-events-none" 
                          style={{ 
                            left: `${currentDragRect.left}%`, 
                            top: `${currentDragRect.top}%`, 
                            width: `${currentDragRect.width}%`, 
                            height: `${currentDragRect.height}%`,
                            borderColor: color,
                            backgroundColor: color + '40' 
                          }} 
                     />
                   )}

                   {/* Annotations */}
                   <AnimatePresence>
                     {(activePage.annotations || []).map((ann) => (
                       <motion.div 
                          key={ann.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          className="absolute group z-20" 
                          style={{ 
                              left: `${ann.x}%`, 
                              top: `${ann.y}%`, 
                              width: ann.type === 'redact' ? `${ann.width}%` : 'auto', 
                              height: ann.type === 'redact' ? `${ann.height}%` : 'auto', 
                              backgroundColor: ann.type === 'redact' ? ann.color : 'transparent',
                              color: ann.color,
                              fontSize: ann.fontSize ? `${ann.fontSize * renderScale}px` : undefined, // Scale font visual
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                              // Text & Checkbox are point-based, not rect-based
                              transform: ann.type === 'redact' ? 'none' : 'translate(0, -50%)', 
                              fontFamily: 'Helvetica, Arial, sans-serif',
                              lineHeight: 1
                          }}
                       >
                         {ann.type === 'redact' && (
                             <div className="w-full h-full ring-1 ring-black/5" />
                         )}
                         {ann.type === 'text' && (
                             <span className="font-bold drop-shadow-sm px-1 bg-white/50">{ann.text}</span>
                         )}
                         {ann.type === 'checkbox' && (
                             <span className="font-bold drop-shadow-sm">{ann.text}</span>
                         )}

                         <button 
                            onClick={() => removeAnnotation(ann.id)} 
                            className="absolute -top-3 -right-3 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm z-30 pointer-events-auto"
                         >
                            <X size={10} strokeWidth={3} />
                         </button>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </motion.div>
             )}
          </div>

          {/* ZONE 3: Filmstrip */}
          {!isMobile && (
            <div className="shrink-0 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-t border-slate-200 dark:border-charcoal-800 z-20 relative shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
               <AnimatePresence>
                  {showFilmstrip && (
                     <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: 140 }} 
                        exit={{ height: 0 }} 
                        transition={{ duration: 0.4, ease: techEase }}
                        className="overflow-hidden"
                     >
                        <Filmstrip
                           images={filmstripImages}
                           activeImageId={activePageId}
                           onSelect={setActivePageId}
                           onReorder={() => {}}
                           onRemove={() => {}}
                           onRotate={() => {}}
                           isMobile={false}
                           direction="horizontal"
                           showRemoveButton={false}
                           showRotateButton={false}
                           isReorderable={false}
                           className="h-full"
                        />
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          )}

          {/* ZONE 4: Bottom Action Bar */}
          <div className="shrink-0 h-16 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 px-6 flex items-center justify-between z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] gap-4">
             {isMobile ? (
               <motion.button 
                 whileTap={buttonTap}
                 onClick={() => setIsFilmstripModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors"
               >
                 <LayoutGrid size={18} />
                 <span>Pages ({pages.length})</span>
               </motion.button>
             ) : (
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={() => setShowFilmstrip(!showFilmstrip)}
                        whileTap={buttonTap}
                        className={`
                            p-2 rounded-lg border transition-all flex items-center gap-2
                            ${showFilmstrip 
                                ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' 
                                : 'bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-charcoal-700'
                            }
                        `}
                        title={showFilmstrip ? "Hide Filmstrip" : "Show Filmstrip"}
                    >
                        <PanelBottom size={16} />
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wide">{showFilmstrip ? 'Hide_Grid' : 'Show_Grid'}</span>
                    </motion.button>

                    <div className="text-xs font-mono font-bold text-charcoal-500 dark:text-slate-400 border-l border-slate-200 dark:border-charcoal-700 pl-4 h-8 flex items-center">
                        PAGE_COUNT: {pages.length} // SIZE: {(file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                </div>
             )}
             
             <motion.button 
                whileTap={buttonTap} 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="flex-1 md:flex-none relative overflow-hidden px-6 py-2.5 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-brand-purple dark:hover:bg-slate-200"
             >
                {isGenerating && (
                   <motion.div 
                      className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                   />
                )}
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span className="relative z-10">{isGenerating ? 'PROCESSING...' : 'DOWNLOAD_PDF'}</span>
             </motion.button>
          </div>
          
          {/* Mobile Filmstrip Modal */}
          {isMobile && (
            <FilmstripModal
                isOpen={isFilmstripModalOpen}
                onClose={() => setIsFilmstripModalOpen(false)}
                title={`${pages.length} Pages`}
            >
                <Filmstrip 
                    images={filmstripImages}
                    activeImageId={activePageId}
                    onSelect={handleSelectFromModal}
                    onReorder={() => {}}
                    onRemove={() => {}}
                    onRotate={() => {}}
                    isMobile={true}
                    direction="vertical"
                    showRemoveButton={false}
                    showRotateButton={false}
                    isReorderable={false}
                    className="h-full"
                />
            </FilmstripModal>
          )}
        </>
      )}
    </div>
  );
};
