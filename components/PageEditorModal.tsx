
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PdfPage, Annotation } from '../types';
import { X, Type, Highlighter, Square, Eraser, Check, PenTool, Image as ImageIcon, Save, CheckSquare, ChevronLeft, ChevronRight, Palette, Undo2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { buttonTap, modalContentVariants } from '../utils/animations';

interface PageEditorModalProps {
  isOpen: boolean;
  page: PdfPage | null;
  onClose: () => void;
  onSave: (updatedPage: PdfPage) => void;
  mode: 'annotate' | 'fill-sign' | 'redact';
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#52525B', // Zinc 600
  '#A1A1AA', // Zinc 400
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F97316', // Orange
  '#FACC15', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

// Custom Color Picker Component
const ColorPickerDropdown = ({ color, onChange, icon = true }: { color: string, onChange: (c: string) => void, icon?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const toggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 200; // Approx width of dropdown
      // Ensure it doesn't go off screen
      const left = Math.min(rect.left, window.innerWidth - width - 10);
      const top = rect.bottom + 8;
      
      setCoords({ top, left: Math.max(10, left) });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <motion.button 
        ref={buttonRef}
        whileTap={buttonTap}
        onClick={toggle}
        className="flex items-center gap-2 bg-white dark:bg-charcoal-700 pl-2 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-charcoal-600 hover:bg-slate-50 dark:hover:bg-charcoal-600 transition-colors"
        title="Change Color"
      >
        <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-charcoal-500 shadow-sm" style={{ backgroundColor: color }} />
        {icon && <Palette size={14} className="text-charcoal-500 dark:text-slate-400" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible backdrop to close on click outside */}
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-[160] p-3 bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl border border-slate-200 dark:border-charcoal-700 grid grid-cols-4 gap-2 w-[180px]"
            >
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange(c); setIsOpen(false); }}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-charcoal-600 relative flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <div className={`w-2 h-2 rounded-full ${['#FFFFFF', '#FACC15', '#A1A1AA', '#14B8A6'].includes(c) ? 'bg-black' : 'bg-white'}`} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const PageEditorModal: React.FC<PageEditorModalProps> = ({ 
  isOpen, 
  page, 
  onClose, 
  onSave, 
  mode,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'highlight' | 'rectangle' | 'redact' | 'checkbox' | 'signature'>('none');
  const [color, setColor] = useState('#000000');
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [currentDragRect, setCurrentDragRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (page) {
      setAnnotations(page.annotations || []);
    } else {
      setAnnotations([]);
    }
    // Default to 'redact' tool if in redact mode
    if (mode === 'redact') {
        setActiveTool('redact');
    } else {
        setActiveTool('none');
    }
  }, [page, isOpen, mode]);

  // Undo keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, annotations]);

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  // --- Drawing Logic ---

  const getRelativeCoords = (e: React.PointerEvent | React.MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    
    // Use clientX/Y from the event
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Calculate percentage relative to image dimensions
    // Clamp values to ensure we stay within the image bounds visually
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'none') return;
    
    // Tools that support drawing
    const drawTools = ['redact', 'highlight', 'rectangle'];
    
    if (drawTools.includes(activeTool)) {
      e.preventDefault(); // Prevent scrolling on touch
      const coords = getRelativeCoords(e);
      if (!coords) return;

      setIsDrawing(true);
      setDragStart(coords);
      setCurrentDragRect({ left: coords.x, top: coords.y, width: 0, height: 0 });
    } else {
      // Click-to-place tools (Text, Checkbox)
      const coords = getRelativeCoords(e);
      if (!coords) return;
      handlePlaceTool(coords.x, coords.y);
    }
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
    if (!isDrawing || !dragStart || !currentDragRect) return;
    
    setIsDrawing(false);
    
    // If the drag was very small (a click), create a default size box
    const isClick = currentDragRect.width < 1 || currentDragRect.height < 1;
    
    const id = nanoid();
    let newAnnotation: Annotation;

    if (isClick) {
       // Default size for click
       const defaultW = activeTool === 'highlight' ? 20 : 15;
       const defaultH = activeTool === 'highlight' ? 5 : 10;
       // Center on click
       const x = Math.max(0, Math.min(100 - defaultW, dragStart.x - (defaultW/2)));
       const y = Math.max(0, Math.min(100 - defaultH, dragStart.y - (defaultH/2)));
       
       newAnnotation = {
         id, type: activeTool as any, x, y, width: defaultW, height: defaultH, color
       };
    } else {
       // Use drawn dimensions
       newAnnotation = {
         id, 
         type: activeTool as any, 
         x: currentDragRect.left, 
         y: currentDragRect.top, 
         width: currentDragRect.width, 
         height: currentDragRect.height, 
         color
       };
    }

    setAnnotations(prev => [...prev, newAnnotation]);
    setDragStart(null);
    setCurrentDragRect(null);
  };

  // Handler for non-drawing tools (Text, Checkbox, etc)
  const handlePlaceTool = (x: number, y: number) => {
    const id = nanoid();
    if (activeTool === 'text') {
      const text = prompt("Enter text:", "");
      if (text) {
        setAnnotations(prev => [...prev, {
          id, type: 'text', x, y, text, color, fontSize: 16
        }]);
      }
    } else if (activeTool === 'checkbox') {
      setAnnotations(prev => [...prev, {
        id, type: 'checkbox', x, y, text: 'X', color, fontSize: 20
      }]);
    }
    
    if (mode !== 'redact') {
       setActiveTool('none');
    }
  };

  const handleSave = () => {
    if (page) {
      onSave({ ...page, annotations });
    }
    onClose();
  };

  const saveCurrentState = () => {
    if (page) {
      onSave({ ...page, annotations });
    }
  };

  const handlePrevClick = () => {
    saveCurrentState();
    onPrev?.();
  };

  const handleNextClick = () => {
    saveCurrentState();
    onNext?.();
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setAnnotations(prev => [...prev, {
          id: nanoid(), type: 'signature', x: 40, y: 40, width: 20, height: 10, imageData: result
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && page && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-charcoal-900/90 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div 
            variants={modalContentVariants}
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-charcoal-900 rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-charcoal-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-heading font-bold text-lg text-charcoal-800 dark:text-white hidden sm:block">
                    {mode === 'annotate' ? 'Annotate' : mode === 'redact' ? 'Redact' : 'Fill'} 
                    <span className="text-brand-purple ml-2">#{page.pageIndex + 1}</span>
                </h3>
                
                {/* Navigation Controls */}
                <div className="flex items-center bg-slate-100 dark:bg-charcoal-800 rounded-lg p-1">
                    <motion.button 
                      whileTap={buttonTap}
                      onClick={handlePrevClick} 
                      disabled={!hasPrev}
                      className="p-1.5 rounded-md hover:bg-white dark:hover:bg-charcoal-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft size={18} />
                    </motion.button>
                    <span className="px-3 text-xs font-bold font-mono text-charcoal-600 dark:text-slate-400 select-none">
                      {page.pageIndex + 1}
                    </span>
                    <motion.button 
                      whileTap={buttonTap}
                      onClick={handleNextClick} 
                      disabled={!hasNext}
                      className="p-1.5 rounded-md hover:bg-white dark:hover:bg-charcoal-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight size={18} />
                    </motion.button>
                </div>

                {/* Undo Button in Header */}
                <motion.button 
                    whileTap={buttonTap}
                    onClick={handleUndo}
                    disabled={annotations.length === 0}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={20} />
                </motion.button>
              </div>

              <div className="flex gap-2">
                <motion.button whileTap={buttonTap} onClick={onClose} className="px-3 py-2 text-sm font-bold text-charcoal-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-charcoal-800 rounded-xl transition-colors">Close</motion.button>
                <motion.button whileTap={buttonTap} onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-brand-purple text-white rounded-xl hover:bg-brand-purpleDark shadow-lg shadow-brand-purple/20 flex items-center gap-2 transition-all">
                  <Save size={16} /> <span className="hidden sm:inline">Save & Close</span><span className="sm:hidden">Save</span>
                </motion.button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center gap-3 overflow-x-auto shrink-0 custom-scrollbar relative z-30">
              {mode === 'annotate' && (
                <>
                  <ToolButton icon={<Type size={18} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                  <ToolButton icon={<Highlighter size={18} />} label="Highlight" active={activeTool === 'highlight'} onClick={() => setActiveTool('highlight')} />
                  <ToolButton icon={<Square size={18} />} label="Box" active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} />
                  <ToolButton icon={<Eraser size={18} />} label="Redact" active={activeTool === 'redact'} onClick={() => setActiveTool('redact')} />
                </>
              )}
              
              {mode === 'fill-sign' && (
                <>
                  <ToolButton icon={<Type size={18} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                  <ToolButton icon={<CheckSquare size={18} />} label="Check/X" active={activeTool === 'checkbox'} onClick={() => setActiveTool('checkbox')} />
                  <div className="relative">
                    <input type="file" accept="image/*" className="hidden" id="sig-upload" onChange={handleSignatureUpload} />
                    <label htmlFor="sig-upload" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-charcoal-600 text-sm font-bold text-charcoal-700 dark:text-slate-200 shadow-sm transition-colors whitespace-nowrap">
                      <PenTool size={16} /> Signature
                    </label>
                  </div>
                </>
              )}

              {mode === 'redact' && (
                <>
                  <div className="flex bg-slate-200 dark:bg-charcoal-700 p-1 rounded-xl">
                      <motion.button 
                        whileTap={buttonTap}
                        onClick={() => setColor('#000000')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${color === '#000000' ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal-800 dark:text-slate-400'}`}
                      >
                        <div className="w-3 h-3 bg-black border border-slate-300 rounded-full"></div> Blackout
                      </motion.button>
                      <motion.button 
                        whileTap={buttonTap}
                        onClick={() => setColor('#FFFFFF')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${color === '#FFFFFF' ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm' : 'text-charcoal-500 hover:text-charcoal-800 dark:text-slate-400'}`}
                      >
                        <div className="w-3 h-3 bg-white border border-slate-300 rounded-full"></div> Whiteout
                      </motion.button>
                  </div>
                  <div className="w-px h-6 bg-slate-200 dark:bg-charcoal-700 mx-1" />
                  {/* Custom Color Picker for Redaction */}
                  <ColorPickerDropdown color={color} onChange={setColor} />
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-charcoal-700 mx-1" />
                  {/* Undo in Toolbar for Mobile convenience */}
                  <motion.button 
                      whileTap={buttonTap}
                      onClick={handleUndo}
                      disabled={annotations.length === 0}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 border border-slate-200 dark:border-charcoal-600 hover:bg-slate-50 dark:hover:bg-charcoal-600 text-sm font-bold shadow-sm disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-charcoal-700 transition-colors"
                  >
                      <Undo2 size={16} /> Undo
                  </motion.button>
                </>
              )}
              
              {mode !== 'redact' && <div className="w-px h-6 bg-slate-300 dark:bg-charcoal-600 mx-1" />}
              
              {mode !== 'redact' && (
                <div className="flex items-center gap-2 bg-white dark:bg-charcoal-700 pl-2 pr-1 py-1 rounded-xl border border-slate-200 dark:border-charcoal-600">
                    <span className="text-[10px] font-bold uppercase text-charcoal-400 tracking-wider">Color</span>
                    <ColorPickerDropdown color={color} onChange={setColor} icon={false} />
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-black/20 p-4 sm:p-8 flex items-center justify-center relative touch-none select-none" ref={containerRef}>
              <div 
                className="relative shadow-2xl transition-transform duration-200" 
                style={{ width: 'fit-content' }}
              >
                  <img 
                    ref={imageRef}
                    src={page.previewUrl} 
                    alt="Page" 
                    className="max-w-full max-h-[70vh] object-contain select-none pointer-events-auto"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ 
                      cursor: activeTool !== 'none' ? 'crosshair' : 'default',
                      transform: `rotate(${page.rotation || 0}deg)`,
                      touchAction: 'none' // Prevent scrolling while drawing
                    }}
                  />
                  
                  {/* Drawn Rectangle Preview */}
                  {isDrawing && currentDragRect && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute border-2 border-brand-purple bg-brand-purple/20 pointer-events-none z-50"
                      style={{
                        left: `${currentDragRect.left}%`,
                        top: `${currentDragRect.top}%`,
                        width: `${currentDragRect.width}%`,
                        height: `${currentDragRect.height}%`,
                      }}
                    />
                  )}
                  
                  {/* Overlay Annotations */}
                  <AnimatePresence>
                  {annotations.map((ann) => (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute group"
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        width: ann.width ? `${ann.width}%` : 'auto',
                        height: ann.height ? `${ann.height}%` : 'auto',
                        color: ann.color,
                        fontSize: ann.fontSize ? `${ann.fontSize * 1.5}px` : undefined, // Scale for view
                        border: ann.type === 'rectangle' ? `3px solid ${ann.color}` : 'none',
                        backgroundColor: ann.type === 'highlight' ? ann.color + '66' : ann.type === 'redact' ? ann.color : 'transparent',
                        // Only apply translate transform if NOT a drawn rectangle/redact/highlight which use specific coordinates
                        transform: (ann.type === 'redact' || ann.type === 'highlight' || ann.type === 'rectangle') ? 'none' : 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      {ann.text}
                      {ann.imageData && <img src={ann.imageData} alt="sig" className="w-full h-full object-contain" />}
                      
                      {/* Delete Button */}
                      <motion.button 
                        onClick={(e) => { e.preventDefault(); removeAnnotation(ann.id); }}
                        onPointerDown={(e) => e.stopPropagation()} // Prevent triggering new draw
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center bg-rose-500 text-white rounded-full pointer-events-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-sm z-50"
                        title="Remove"
                      >
                        <X size={12} strokeWidth={3} />
                      </motion.button>
                    </motion.div>
                  ))}
                  </AnimatePresence>
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="px-4 py-2 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-700 text-xs font-medium text-charcoal-500 dark:text-slate-400 flex justify-between shrink-0">
              <span>{isDrawing ? "Drawing..." : "Click or drag on the page to place selected tool."}</span>
              <span>{annotations.length} items added</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={buttonTap}
    whileHover={{ scale: 1.02 }}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm border
      ${active 
        ? 'bg-brand-purple text-white border-brand-purple' 
        : 'bg-white dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-600 hover:bg-slate-50 dark:hover:bg-charcoal-600'
      }
    `}
  >
    {icon} {label}
  </motion.button>
);
