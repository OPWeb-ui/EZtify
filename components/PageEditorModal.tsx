
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PdfPage, Annotation } from '../types';
import { X, Type, Highlighter, Square, Eraser, Check, PenTool, Image as ImageIcon, Save, CheckSquare } from 'lucide-react';
import { nanoid } from 'nanoid';
import { buttonTap, modalVariants } from '../utils/animations';

interface PageEditorModalProps {
  isOpen: boolean;
  page: PdfPage | null;
  onClose: () => void;
  onSave: (updatedPage: PdfPage) => void;
  mode: 'annotate' | 'fill-sign';
}

export const PageEditorModal: React.FC<PageEditorModalProps> = ({ isOpen, page, onClose, onSave, mode }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'highlight' | 'rectangle' | 'redact' | 'checkbox' | 'signature'>('none');
  const [color, setColor] = useState('#000000');
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (page) {
      setAnnotations(page.annotations || []);
    } else {
      setAnnotations([]);
    }
    setActiveTool('none');
  }, [page, isOpen]);

  if (!isOpen || !page) return null;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === 'none') return;
    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate click relative to image
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Ensure click is inside image
    if (rawX < 0 || rawY < 0 || rawX > rect.width || rawY > rect.height) return;

    // Convert to percentage
    const x = (rawX / rect.width) * 100;
    const y = (rawY / rect.height) * 100;

    const id = nanoid();

    if (activeTool === 'text') {
      const text = prompt("Enter text:", "");
      if (text) {
        setAnnotations(prev => [...prev, {
          id, type: 'text', x, y, text, color, fontSize: 16
        }]);
      }
    } else if (activeTool === 'highlight') {
      // Default highlight box size (e.g. 20% width, 5% height)
      setAnnotations(prev => [...prev, {
        id, type: 'highlight', x: x - 10, y: y - 2.5, width: 20, height: 5, color: '#FACC15'
      }]);
    } else if (activeTool === 'rectangle') {
      setAnnotations(prev => [...prev, {
        id, type: 'rectangle', x: x - 10, y: y - 10, width: 20, height: 20, color
      }]);
    } else if (activeTool === 'redact') {
      setAnnotations(prev => [...prev, {
        id, type: 'redact', x: x - 10, y: y - 5, width: 20, height: 10, color: '#000000'
      }]);
    } else if (activeTool === 'checkbox') {
      setAnnotations(prev => [...prev, {
        id, type: 'checkbox', x, y, text: 'X', color, fontSize: 20
      }]);
    }
    
    setActiveTool('none');
  };

  const handleSave = () => {
    onSave({ ...page, annotations });
    onClose();
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  // Simple signature upload handler
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-900/80 backdrop-blur-sm p-4">
      <motion.div 
        variants={modalVariants}
        initial="hidden" 
        animate="visible" 
        exit="exit"
        className="w-full max-w-4xl h-[90vh] bg-white dark:bg-charcoal-900 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 z-10">
          <h3 className="font-heading font-bold text-lg text-charcoal-800 dark:text-white">
            {mode === 'annotate' ? 'Annotate Page' : 'Fill & Sign'} <span className="text-brand-purple">#{page.pageIndex + 1}</span>
          </h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-charcoal-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-charcoal-800 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-brand-purple text-white rounded-lg hover:bg-brand-purpleDark flex items-center gap-2">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-charcoal-800 border-b border-slate-200 dark:border-charcoal-700 flex items-center gap-4 overflow-x-auto">
          {mode === 'annotate' ? (
            <>
              <ToolButton icon={<Type size={18} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
              <ToolButton icon={<Highlighter size={18} />} label="Highlight" active={activeTool === 'highlight'} onClick={() => setActiveTool('highlight')} />
              <ToolButton icon={<Square size={18} />} label="Box" active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} />
              <ToolButton icon={<Eraser size={18} />} label="Redact" active={activeTool === 'redact'} onClick={() => setActiveTool('redact')} />
            </>
          ) : (
            <>
              <ToolButton icon={<Type size={18} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
              <ToolButton icon={<CheckSquare size={18} />} label="Check/X" active={activeTool === 'checkbox'} onClick={() => setActiveTool('checkbox')} />
              <div className="relative">
                <input type="file" accept="image/*" className="hidden" id="sig-upload" onChange={handleSignatureUpload} />
                <label htmlFor="sig-upload" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-charcoal-600 text-sm font-medium text-charcoal-700 dark:text-slate-200">
                  <PenTool size={18} /> Signature
                </label>
              </div>
            </>
          )}
          
          <div className="w-px h-6 bg-slate-300 dark:bg-charcoal-600 mx-2" />
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold uppercase text-charcoal-400">Color</span>
             <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-black/20 p-8 flex items-center justify-center relative" ref={containerRef}>
           <div className="relative shadow-2xl" style={{ width: 'fit-content' }}>
              <img 
                ref={imageRef}
                src={page.previewUrl} 
                alt="Page" 
                className="max-w-full max-h-[70vh] object-contain select-none"
                onClick={handleCanvasClick}
                style={{ 
                  cursor: activeTool !== 'none' ? 'crosshair' : 'default',
                  transform: `rotate(${page.rotation || 0}deg)` 
                }}
              />
              
              {/* Overlay Annotations */}
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="absolute group"
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    width: ann.width ? `${ann.width}%` : 'auto',
                    height: ann.height ? `${ann.height}%` : 'auto',
                    color: ann.color,
                    fontSize: ann.fontSize ? `${ann.fontSize * 1.5}px` : undefined, // Scale for view
                    border: ann.type === 'rectangle' ? `3px solid ${ann.color}` : 'none',
                    backgroundColor: ann.type === 'highlight' ? ann.color + '66' : ann.type === 'redact' ? '#000000' : 'transparent',
                    transform: 'translate(-0%, -50%)', // Rough center align for clicks
                    pointerEvents: 'none' // For now, no drag/resize
                  }}
                >
                  {ann.text}
                  {ann.imageData && <img src={ann.imageData} alt="sig" className="w-full h-full object-contain" />}
                  
                  {/* Delete Button (visible on hover via pointer events trick if we enable them) */}
                  <button 
                    onClick={() => removeAnnotation(ann.id)}
                    className="absolute -top-4 -right-4 bg-rose-500 text-white rounded-full p-1 pointer-events-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
           </div>
        </div>
        
        {/* Status Bar */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-charcoal-800 border-t border-slate-200 dark:border-charcoal-700 text-xs text-charcoal-500 dark:text-slate-400 flex justify-between">
           <span>Click on the page to place selected tool.</span>
           <span>{annotations.length} items added</span>
        </div>
      </motion.div>
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
      ${active 
        ? 'bg-brand-purple text-white shadow-md' 
        : 'bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-slate-300 border border-slate-200 dark:border-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-600'
      }
    `}
  >
    {icon} {label}
  </button>
);
