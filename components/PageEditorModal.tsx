
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PdfPage, Annotation } from '../types';
import { X, Type, Highlighter, Square, Save, CheckSquare, ChevronLeft, ChevronRight, Palette, Undo2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { buttonTap, modalContentVariants } from '../utils/animations';

interface PageEditorModalProps {
  isOpen: boolean;
  page: PdfPage | null;
  onClose: () => void;
  onSave: (updatedPage: PdfPage) => void;
  mode: 'annotate' | 'fill-sign';
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const PRESET_COLORS = [
  '#000000', '#52525B', '#A1A1AA', '#FFFFFF', '#EF4444', 
  '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#14B8A6',
];

const ColorPickerDropdown = ({ color, onChange, icon = true }: { color: string, onChange: (c: string) => void, icon?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const toggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 200;
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
        className="flex items-center gap-2 bg-white pl-2 pr-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        title="Change Color"
      >
        <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: color }} />
        {icon && <Palette size={14} className="text-zinc-500" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-[160] p-3 bg-white rounded-xl shadow-2xl border border-slate-200 grid grid-cols-4 gap-2 w-[180px]"
            >
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange(c); setIsOpen(false); }}
                  className="w-8 h-8 rounded-full border border-slate-200 relative flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
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
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'highlight' | 'rectangle' | 'checkbox' | 'signature'>('none');
  const [color, setColor] = useState('#000000');
  
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
    if (isOpen) {
        if (mode === 'fill-sign') setActiveTool('signature');
        else setActiveTool('none');
    }
  }, [page, isOpen, mode]);

  const handleUndo = () => setAnnotations(prev => prev.slice(0, -1));

  const getRelativeCoords = (e: React.PointerEvent | React.MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'none') return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    const drawTools = ['highlight', 'rectangle'];
    if (drawTools.includes(activeTool)) {
      e.preventDefault();
      const coords = getRelativeCoords(e);
      if (!coords) return;
      setIsDrawing(true);
      setDragStart(coords);
      setCurrentDragRect({ left: coords.x, top: coords.y, width: 0, height: 0 });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      const coords = getRelativeCoords(e);
      if (!coords) return;
      const id = nanoid();
      if (activeTool === 'text') {
        setAnnotations(prev => [...prev, { id, type: 'text', x: coords.x, y: coords.y, text: 'Type...', fontSize: 14, color }]);
      } else if (activeTool === 'checkbox') {
        setAnnotations(prev => [...prev, { id, type: 'checkbox', x: coords.x, y: coords.y, text: 'X', fontSize: 20, color }]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !dragStart) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;
    const left = Math.min(coords.x, dragStart.x);
    const top = Math.min(coords.y, dragStart.y);
    const width = Math.abs(coords.x - dragStart.x);
    const height = Math.abs(coords.y - dragStart.y);
    setCurrentDragRect({ left, top, width, height });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing || !dragStart || !currentDragRect) {
        setIsDrawing(false);
        return;
    }
    setIsDrawing(false);
    if (currentDragRect.width > 0.5 && currentDragRect.height > 0.5) {
        const id = nanoid();
        setAnnotations(prev => [...prev, {
            id, type: activeTool as any,
            x: currentDragRect.left, y: currentDragRect.top,
            width: currentDragRect.width, height: currentDragRect.height,
            color
        }]);
    }
    setDragStart(null);
    setCurrentDragRect(null);
  };

  const handleAnnotationChange = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (page) {
      onSave({ ...page, annotations });
      onClose();
    }
  };

  if (!page) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col bg-white pointer-events-auto overflow-hidden mt-8 md:mt-12 rounded-t-2xl md:rounded-t-none md:rounded-2xl md:m-8 md:shadow-2xl border border-slate-200">
            <div className="shrink-0 h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white z-10">
               <div className="flex items-center gap-4">
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
                  <h3 className="font-bold text-lg text-zinc-900">Page Editor</h3>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handleUndo} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Undo"><Undo2 size={20} /></button>
                  <motion.button whileTap={buttonTap} onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all">
                    <Save size={16} /> Save
                  </motion.button>
               </div>
            </div>

            <div className="shrink-0 p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTool('text')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeTool === 'text' ? 'bg-indigo-600 text-white' : 'hover:bg-white'}`}><Type size={16} /> Text</button>
                <button onClick={() => setActiveTool('highlight')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeTool === 'highlight' ? 'bg-indigo-600 text-white' : 'hover:bg-white'}`}><Highlighter size={16} /> Highlight</button>
                <button onClick={() => setActiveTool('rectangle')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeTool === 'rectangle' ? 'bg-indigo-600 text-white' : 'hover:bg-white'}`}><Square size={16} /> Rect</button>
                <div className="w-px h-6 bg-slate-300 mx-2" />
                <ColorPickerDropdown color={color} onChange={setColor} />
            </div>

            <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 relative flex items-center justify-center p-8 touch-none custom-scrollbar">
               <div className="relative shadow-2xl ring-1 ring-black/5 select-none" style={{ touchAction: 'none' }}>
                  <img ref={imageRef} src={page.previewUrl} alt="Editor" className="max-w-full max-h-[72vh] object-contain pointer-events-none" draggable={false} />
                  <div className="absolute inset-0 z-10" style={{ cursor: activeTool === 'none' ? 'default' : 'crosshair' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />

                  {annotations.map((ann) => (
                     <div key={ann.id} className="absolute z-20 group" style={{
                           left: `${ann.x}%`, top: `${ann.y}%`, width: ann.width ? `${ann.width}%` : 'auto', height: ann.height ? `${ann.height}%` : 'auto',
                           backgroundColor: ann.type === 'highlight' ? ann.color + '66' : 'transparent',
                           border: ann.type === 'rectangle' ? `2px solid ${ann.color}` : 'none', color: ann.color,
                        }}>
                        {ann.type === 'text' && <input value={ann.text} onChange={(e) => handleAnnotationChange(ann.id, { text: e.target.value })} className="bg-transparent border-none outline-none w-full h-full p-1 m-0 font-sans font-bold" style={{ color: ann.color, fontSize: `${ann.fontSize}px` }} onClick={(e) => e.stopPropagation()} />}
                        {ann.type === 'checkbox' && <CheckSquare size={ann.fontSize} />}
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveAnnotation(ann.id); }} className="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-30 scale-75 group-hover:scale-100"><X size={12} strokeWidth={3} /></button>
                     </div>
                  ))}

                  {isDrawing && currentDragRect && (
                     <div className="absolute z-30 border-2 border-white/50" style={{ left: `${currentDragRect.left}%`, top: `${currentDragRect.top}%`, width: `${currentDragRect.width}%`, height: `${currentDragRect.height}%`, backgroundColor: color, opacity: 0.5 }} />
                  )}
               </div>
            </div>

            <div className="shrink-0 h-14 bg-white border-t border-slate-100 flex items-center justify-between px-6">
               <button onClick={onPrev} disabled={!hasPrev} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 disabled:opacity-30 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft size={16} /> Prev</button>
               <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Page {page.pageIndex + 1}</span>
               <button onClick={onNext} disabled={!hasNext} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 disabled:opacity-30 hover:bg-slate-50 rounded-lg transition-colors">Next <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
