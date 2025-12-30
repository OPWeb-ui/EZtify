
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { WorkspacePage, WorkspaceNumberingConfig, ColorMode, CropData, WatermarkConfig, WatermarkPosition } from '../types';
import { loadPdfPages, renderSinglePage } from '../services/pdfSplitter';
import { generateWorkspacePdf, generateSplitPdfZip, clearPdfCache } from '../services/pdfMultiToolProcessor';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  Layers, Undo2, Redo, RefreshCw, 
  RotateCcw, RotateCw, Copy, Trash2, 
  Plus, FilePlus, X, CheckCircle2,
  Maximize2, ZoomIn, ZoomOut, Download, List, LayoutGrid,
  FileText, Check, Loader2, CheckSquare, Hash, Sliders, Settings,
  Minus, RotateCcw as ResetIcon, Palette, Droplets, AlertCircle, Crop, MoreHorizontal, Stamp, Image as ImageIcon, Type,
  PanelRightOpen, PanelRightClose
} from 'lucide-react';
import {
  DndContext, DragEndEvent, useSensor, useSensors, KeyboardSensor,
  DragOverlay, defaultDropAnimationSideEffects, closestCenter,
  TouchSensor, MouseSensor, DragStartEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  rectSortingStrategy, 
  verticalListSortingStrategy,
  useSortable, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';
import { EZButton } from '../components/EZButton';
import { EZSlider } from '../components/EZSlider';
import { EZSegmentedControl } from '../components/EZSegmentedControl';
import { CropOverlay } from '../components/CropOverlay';

const WORKSPACE_CARD_LAYOUT_ID = "pdf-workspace-card-surface";

interface HistoryState {
  pages: WorkspacePage[];
  selection: Set<string>;
  numbering: WorkspaceNumberingConfig;
}

const DEFAULT_NUMBERING: WorkspaceNumberingConfig = {
  enabled: false,
  hPos: 50,
  vPos: 95,
  startFrom: 1,
  fontSize: 12,
  applyTo: 'all'
};

const COLOR_MODES_REQUESTED: { id: ColorMode; label: string }[] = [
  { id: 'original', label: 'Normal' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'invert', label: 'Invert Colors' },
  { id: 'bw', label: 'High Contrast' },
  { id: 'sepia', label: 'Sepia' },
];

const DEFAULT_WATERMARK: WatermarkConfig = {
    type: 'text',
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.5,
    rotation: 45,
    scale: 1,
    position: 'center',
    color: '#FF0000'
};

const getFilterStyle = (mode?: ColorMode) => {
    switch (mode) {
        case 'grayscale': return 'grayscale(100%)';
        case 'bw': return 'grayscale(100%) contrast(1000%)';
        case 'invert': return 'invert(100%)';
        case 'sepia': return 'sepia(100%)';
        case 'contrast': return 'contrast(150%) brightness(110%)';
        case 'eco': return 'grayscale(100%) brightness(120%) contrast(110%)';
        case 'warm': return 'sepia(35%) brightness(105%)';
        case 'cool': return 'hue-rotate(180deg) saturate(70%) brightness(105%)';
        default: return 'none';
    }
};

const ProcessingOverlay = ({ progress }: { progress: number }) => (
  <motion.div
    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
    transition={{ duration: 0.3 }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAF9F6]/80"
  >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl p-10 flex flex-col items-center border border-stone-200"
      >
        <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 p-5 rounded-3xl bg-accent-lime text-[#111111] shadow-sm border-2 border-[#111111]"
        >
            <Layers size={40} strokeWidth={2} />
        </motion.div>
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Processing</h2>
        <p className="text-sm text-stone-500 font-medium mb-8 font-mono max-w-[200px] truncate text-center">Analysing structure...</p>
        <div className="w-56 bg-stone-100 rounded-full h-3 overflow-hidden mb-3 border border-stone-200">
            <motion.div className="h-full bg-[#111111] rounded-full" initial={{ width: '0%' }} animate={{ width: `${Math.max(5, progress)}%` }} transition={{ duration: 0.3, ease: "circOut" }} />
        </div>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest tabular-nums">{Math.round(progress)}%</span>
      </motion.div>
  </motion.div>
);

const UnifiedUploadCard: React.FC<{ onUpload: () => void; isProcessing: boolean; progress: number; status: string; isMobile: boolean; }> = ({ onUpload, isProcessing, progress, status, isMobile }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <motion.div
        layoutId={WORKSPACE_CARD_LAYOUT_ID}
        className={`relative flex flex-col items-center justify-center w-80 h-80 rounded-[3rem] border-2 transition-all duration-500 overflow-hidden bg-white ${isProcessing ? 'border-accent-lime shadow-xl shadow-lime-100' : 'border-dashed border-stone-200 shadow-sm hover:border-stone-400 hover:shadow-lg cursor-pointer group'}`}
        onClick={!isProcessing ? onUpload : undefined}
      >
         <motion.div className="absolute inset-0 bg-gradient-to-br from-stone-50/50 via-white to-white z-0" initial={{ opacity: 0 }} animate={{ opacity: isProcessing ? 1 : 0 }} transition={{ duration: 0.5 }} />
         <AnimatePresence mode="wait">
            {isProcessing ? (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="relative z-10 flex flex-col items-center w-full px-6 text-center" >
                    <div className="mb-6 w-20 h-24 bg-[#FDFCF8] rounded-xl border-2 border-[#111111] rotate-3 flex flex-col p-2 gap-2 shadow-sm">
                       <div className="w-1/2 h-1.5 bg-stone-200 rounded-full" />
                       <div className="w-full h-1.5 bg-stone-100 rounded-full" />
                       <div className="mt-auto w-full bg-accent-lime h-1.5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-[#111111]" initial={{ width: '0%' }} animate={{ width: `${Math.max(5, progress)}%` }} />
                       </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Processing</h2>
                    <p className="text-sm text-stone-500 font-medium mb-6 font-mono max-w-[90%] truncate">{status || 'Parsing...'}</p>
                </motion.div>
            ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="flex flex-col items-center z-10" >
                     {isMobile && (
                        <div className="mb-6 opacity-30">
                           <span className="text-[10px] font-black text-[#111111] uppercase tracking-[0.25em]">PDF Workspace</span>
                        </div>
                     )}
                     <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-stone-300" />
                         <Plus size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111] group-hover:text-stone-600 transition-colors">Add PDF</span>
                     <span className="text-sm font-medium text-stone-400 mt-2">{isMobile ? 'Tap to upload' : 'Drag & drop or click'}</span>
                </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    </div>
  );
};

const UnifiedAction = React.forwardRef<HTMLButtonElement, any>(({ icon, label, isActive, className, variant = 'default', ...props }, ref) => {
    const baseStyles = "h-10 px-3 rounded-2xl flex items-center gap-2 transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#111111] font-bold text-sm justify-center whitespace-nowrap shrink-0";
    const variants: any = {
      default: isActive ? "bg-[#111111] text-white shadow-md transform scale-[1.02]" : "text-stone-500 hover:bg-stone-100 hover:text-[#111111] active:scale-95 disabled:opacity-30 disabled:pointer-events-none",
      danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-30",
      primary: "bg-accent-lime text-[#111111] hover:bg-[#111111] hover:text-white shadow-lg shadow-stone-200 border border-[#111111] active:scale-95 disabled:opacity-50 disabled:shadow-none transition-colors"
    };
    return (
      <motion.button ref={ref} whileTap={!props.disabled ? { scale: 0.96 } : undefined} className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props} >
        {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
        {label && <span className="hidden xl:inline tracking-tight">{label}</span>}
      </motion.button>
    );
});
UnifiedAction.displayName = "UnifiedAction";

// Reusable Watermark Component
const WatermarkLayer = ({ config, zoom = 1 }: { config: WatermarkConfig, zoom?: number }) => {
    if (!config) return null;

    if (config.position === 'tiled') {
        return (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 opacity-50 pointer-events-none z-20">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center" style={{ opacity: config.opacity }}>
                        <div style={{ transform: `rotate(${config.rotation}deg) scale(${config.scale * zoom * 0.7})`, color: config.color, fontSize: '36px', fontWeight: 'bold' }}>
                            {config.type === 'text' ? config.text : <img src={config.image} className="max-w-[150px] max-h-[150px]" />}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const posStyle: React.CSSProperties = {
        position: 'absolute',
        left: config.position.includes('left') ? '20%' : config.position.includes('right') ? '80%' : '50%',
        top: config.position.includes('top') ? '20%' : config.position.includes('bottom') ? '80%' : '50%',
        transform: `translate(-50%, -50%) rotate(${config.rotation}deg) scale(${config.scale * zoom})`,
        opacity: config.opacity,
        whiteSpace: 'nowrap',
        zIndex: 20,
        pointerEvents: 'none'
    };

    return (
        <div style={posStyle}>
            {config.type === 'text' ? (
                <span style={{ color: config.color, fontSize: '48px', fontWeight: 'bold', fontFamily: 'Helvetica' }}>
                    {config.text}
                </span>
            ) : (
                <img src={config.image} className="max-w-[300px]" alt="wm" />
            )}
        </div>
    );
};

const PageCard = ({ page, index, isSelected, isActive, isOverlay, isDragging, onSelect, onEnlarge, isMobile, isLoadingEnlarge, numbering, compact }: any) => {
  const [visualRotation, setVisualRotation] = useState(page.rotation);
  const prevRotationProp = useRef(page.rotation);

  useEffect(() => {
    let diff = page.rotation - prevRotationProp.current;
    if (diff === -270) diff = 90;
    if (diff === 270) diff = -90;
    if (diff !== 0) {
        setVisualRotation(prev => prev + diff);
        prevRotationProp.current = page.rotation;
    }
  }, [page.rotation]);

  const isSideways = page.rotation === 90 || page.rotation === 270;
  const displayWidth = isSideways ? page.height : page.width;
  const displayHeight = isSideways ? page.width : page.height;
  const showActiveBorder = isSelected || isActive;

  const showNumberPreview = numbering?.enabled && (numbering.applyTo === 'all' || (numbering.applyTo === 'selected' && isSelected));

  // Determine Crop Style via Scaling
  // Calculate container aspect ratio based on crop
  const crop = page.crop || { x: 0, y: 0, width: 100, height: 100 };
  const cropW = displayWidth * (crop.width / 100);
  const cropH = displayHeight * (crop.height / 100);
  const aspectRatio = cropW / cropH;

  const imgStyle: React.CSSProperties = {
      width: `${100 * (100 / crop.width)}%`,
      height: `${100 * (100 / crop.height)}%`,
      transform: `translate(${-crop.x}%, ${-crop.y}%)`,
      transformOrigin: 'top left',
      maxWidth: 'none',
      filter: getFilterStyle(page.colorMode)
  };

  const wmStyle = (() => {
      const wm = page.watermark;
      if (!wm) return null;
      const style: React.CSSProperties = {
          position: 'absolute', opacity: wm.opacity, transform: `translate(-50%, -50%) rotate(${wm.rotation}deg) scale(${wm.scale})`, zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap'
      };
      if (wm.position === 'tiled') return { ...style, left: '50%', top: '50%' };
      switch (wm.position) {
          case 'top-left': style.left = '20%'; style.top = '20%'; break;
          case 'top-right': style.left = '80%'; style.top = '20%'; break;
          case 'bottom-left': style.left = '20%'; style.top = '80%'; break;
          case 'bottom-right': style.left = '80%'; style.top = '80%'; break;
          case 'center': default: style.left = '50%'; style.top = '50%'; break;
      }
      return style;
  })();

  const paddingClass = compact ? 'p-1.5' : 'p-4';
  const radiusClass = compact ? 'rounded-xl' : 'rounded-2xl';
  const checkSize = compact ? 'w-5 h-5' : 'w-7 h-7';
  const checkIconSize = compact ? 12 : 14;
  const checkPos = compact ? 'top-1.5 left-1.5' : 'top-3 left-3';

  return (
    <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ 
            opacity: isDragging ? 0.6 : 1, 
            scale: isDragging ? 1.02 : 1, 
            borderColor: showActiveBorder ? '#111111' : 'transparent', 
            ringWidth: showActiveBorder ? 2 : 0, 
            ringColor: '#111111', 
            boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.1)' : showActiveBorder ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.03)' 
        }} 
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: "easeOut" } }} 
        whileHover={!isDragging && !isOverlay ? { scale: 1.02 } : {}} 
        whileTap={!isDragging && !isOverlay ? { scale: 0.98 } : {}} 
        transition={{ type: 'spring', stiffness: 400, damping: 25 }} 
        className={`relative overflow-hidden group select-none bg-white border border-stone-200 ${isOverlay ? 'shadow-2xl z-50 cursor-grabbing bg-white ring-2 ring-[#111111]' : 'cursor-pointer'} w-full ${radiusClass}`} 
        style={{ aspectRatio }} 
        onClick={(e) => { e.stopPropagation(); onSelect?.(page.id, e.shiftKey || e.metaKey || e.ctrlKey); }} 
    >
      {isLoadingEnlarge && <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[4px] flex items-center justify-center animate-in fade-in duration-300"><Loader2 className="w-8 h-8 text-[#111111] animate-spin" /></div>}
      
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect?.(page.id, true); }} 
        className={`absolute ${checkPos} z-20 ${checkSize} rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected ? 'bg-[#111111] text-white shadow-md scale-100 opacity-100' : 'bg-white/90 backdrop-blur-sm border border-stone-200 text-transparent opacity-0 group-hover:opacity-100 hover:border-[#111111] scale-90 hover:scale-100'} ${isMobile && !isSelected ? 'opacity-100 bg-white/80 border-stone-200 text-stone-300' : ''}`}
      >
        <Check size={checkIconSize} strokeWidth={4} />
      </button>
      
      {page.watermark && wmStyle && (
          page.watermark.position === 'tiled' ? (
             <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 pointer-events-none z-20 opacity-50">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center" style={{ opacity: page.watermark.opacity }}>
                        <div style={{ transform: `rotate(${page.watermark.rotation}deg) scale(${page.watermark.scale * 0.7})`, color: page.watermark.color, fontSize: '10px', fontWeight: 'bold' }}>
                            {page.watermark.type === 'text' ? page.watermark.text : <img src={page.watermark.image} className="max-w-[40px] max-h-[40px]" />}
                        </div>
                    </div>
                ))}
             </div>
          ) : (
             <div style={wmStyle}>
                {page.watermark.type === 'text' ? <span style={{ color: page.watermark.color, fontSize: '14px', fontWeight: 'bold', fontFamily: 'Helvetica' }}>{page.watermark.text}</span> : <img src={page.watermark.image} className="max-w-[100px]" alt="wm" />}
             </div>
          )
      )}

      {showNumberPreview && (
          <motion.div 
              layout
              className={`absolute z-30 pointer-events-none text-stone-900 font-bold flex items-center justify-center bg-white/95 backdrop-blur-md rounded-md shadow-sm border border-stone-200 origin-center transition-all duration-300`} 
              style={{ 
                left: `${5 + (numbering.hPos * 0.9)}%`, 
                top: `${5 + (numbering.vPos * 0.9)}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${numbering.fontSize * (compact ? 0.4 : 0.75)}px`,
                minWidth: compact ? '16px' : '20px',
                height: compact ? '16px' : '20px',
                padding: compact ? '0' : '0 4px'
              }}
          >
              {numbering.startFrom + index}
          </motion.div>
      )}

      {isMobile && !isDragging && !isLoadingEnlarge && (
        <button onClick={(e) => { e.stopPropagation(); onEnlarge?.(page.id); }} className="absolute bottom-3 left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-md border border-stone-100 text-stone-500 transition-all duration-200 active:scale-95 opacity-100 scale-100">
          <Maximize2 size={18} />
        </button>
      )}
      <div className={`w-full h-full ${paddingClass} flex items-center justify-center relative overflow-hidden bg-stone-50/50`}>
         {page.type === 'blank' ? <div className="w-full h-full border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 gap-3"><Plus size={32} className="opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest">Blank Page</span></div> : 
         <div className="w-full h-full flex items-center justify-center relative shadow-sm bg-white overflow-hidden">
            <motion.img 
                src={page.previewUrl} 
                initial={false} 
                animate={{ rotate: visualRotation }} 
                transition={{ type: 'spring', stiffness: 250, damping: 25 }} 
                style={imgStyle} 
                draggable={false} 
            />
         </div>}
      </div>
    </motion.div>
  );
};

const SortablePage: React.FC<any> = ({ page, index, isSelected, isActive, onSelect, onEnlarge, isMobile, isLoadingEnlarge, numbering, compact, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none touch-manipulation relative"><PageCard page={page} index={index} isDragging={isDragging} isSelected={isSelected} isActive={isActive} onSelect={onSelect} isMobile={isMobile} isLoadingEnlarge={isLoadingEnlarge} onEnlarge={onEnlarge} numbering={numbering} compact={compact} {...props} /></div>;
};

// ... (Keep NumberingOptions, ColorModeOptions, WatermarkPanel components unchanged) ...
const NumberingOptions = ({ config, onChange, isMobile }: { config: WorkspaceNumberingConfig, onChange: (c: Partial<WorkspaceNumberingConfig>) => void, isMobile?: boolean }) => {
  const FineControl = ({ label, value, onUpdate }: { label: string, value: number, onUpdate: (v: number) => void }) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-1 bg-stone-50 rounded-md p-0.5 border border-stone-200/60">
                <button onClick={() => onUpdate(Math.max(0, value - 1))} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-[#111111] hover:bg-white rounded transition-all active:scale-90"><Minus size={10}/></button>
                <span className="text-[9px] font-mono font-bold text-[#111111] min-w-[20px] text-center">{value}%</span>
                <button onClick={() => onUpdate(Math.min(100, value + 1))} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-[#111111] hover:bg-white rounded transition-all active:scale-90"><Plus size={10}/></button>
            </div>
        </div>
        <EZSlider value={value} min={0} max={100} onChange={onUpdate} className="!mb-0 !h-2" />
    </div>
  );

  return (
    <div className={`flex flex-col gap-2 ${isMobile ? 'p-0' : ''}`} style={{ '--ez-accent': '#111111' } as React.CSSProperties}>
        <div className="flex items-center justify-between p-2 bg-stone-50/50 border border-stone-200 rounded-lg">
            <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Enable</span>
            <button 
                onClick={() => onChange({ enabled: !config.enabled })} 
                className={`relative w-7 h-4 rounded-full transition-colors duration-300 focus:outline-none ${config.enabled ? 'bg-[#111111]' : 'bg-stone-200'}`}
            >
                <motion.div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" initial={false} animate={{ x: config.enabled ? 12 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </button>
        </div>
        <div className={`space-y-3 ${!config.enabled ? 'opacity-30 pointer-events-none' : ''} transition-opacity duration-200`}>
            <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pos</span>
                  <button onClick={() => onChange({ hPos: DEFAULT_NUMBERING.hPos, vPos: DEFAULT_NUMBERING.vPos })} className="text-[9px] font-bold text-stone-400 hover:text-[#111111] uppercase tracking-wider transition-colors flex items-center gap-1">
                    <ResetIcon size={8} />
                  </button>
                </div>
                <FineControl label="X" value={config.hPos} onUpdate={(v) => onChange({ hPos: v })} />
                <FineControl label="Y" value={config.vPos} onUpdate={(v) => onChange({ vPos: v })} />
            </div>
            <div className="h-px bg-stone-100 w-full" />
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Start</label>
                    <div className="relative">
                        <input type="number" value={config.startFrom} onChange={(e) => onChange({ startFrom: parseInt(e.target.value) || 1 })} className="w-full h-7 px-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-mono font-bold text-[#111111] focus:ring-1 focus:ring-black/10 outline-none text-center" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Target</label>
                    <div className="flex bg-stone-50 p-0.5 rounded-lg h-7 border border-stone-200">
                        <button onClick={() => onChange({ applyTo: 'all' })} className={`flex-1 rounded-md text-[9px] font-bold transition-all uppercase tracking-wide ${config.applyTo === 'all' ? 'bg-white text-[#111111] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>All</button>
                        <button onClick={() => onChange({ applyTo: 'selected' })} className={`flex-1 rounded-md text-[9px] font-bold transition-all uppercase tracking-wide ${config.applyTo === 'selected' ? 'bg-white text-[#111111] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Sel</button>
                    </div>
                </div>
            </div>
            <div>
                <EZSlider label="Size" value={config.fontSize} min={8} max={72} suffix="pt" onChange={(v) => onChange({ fontSize: v })} className="!h-2" />
            </div>
        </div>
    </div>
  );
};

const ColorModeOptions = ({ currentMode, scope, onModeChange, onScopeChange, showWarning }: { currentMode?: ColorMode; scope: 'current' | 'all'; onModeChange: (m: ColorMode) => void; onScopeChange: (s: 'current' | 'all') => void; showWarning: boolean }) => {
  return (
    <div className="space-y-3">
      <div className="h-5 relative">
        <AnimatePresence initial={false}>
          {showWarning && (
              <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="absolute inset-0 bg-rose-50 text-rose-600 text-[9px] font-bold px-2 rounded-lg border border-rose-100 flex items-center justify-center gap-1.5 overflow-hidden">
                  <AlertCircle size={10} className="shrink-0" />
                  <span>Select a page</span>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
      <EZSegmentedControl label="Target" value={scope} options={[{ value: 'current', label: 'Current' }, { value: 'all', label: 'All' }]} onChange={onScopeChange} />
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-stone-300 uppercase tracking-widest block px-0.5">Filters</label>
        <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {COLOR_MODES_REQUESTED.map((mode) => (
            <button key={mode.id} onClick={() => onModeChange(mode.id)} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border group ${currentMode === mode.id ? 'bg-[#111111] border-[#111111] text-white shadow-md' : 'bg-white border-stone-100 text-stone-500 hover:border-stone-200 hover:text-stone-900'}`} >
               <span className="uppercase tracking-wide">{mode.label}</span>
               {currentMode === mode.id && <motion.div layoutId="check" className="text-accent-lime"><CheckCircle2 size={12} strokeWidth={3} /></motion.div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const WatermarkPanel = ({ config, onChange, scope, onScopeChange, showWarning }: { config: WatermarkConfig, onChange: (c: Partial<WatermarkConfig>) => void, scope: 'current' | 'all', onScopeChange: (s: 'current' | 'all') => void, showWarning: boolean }) => {
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) onChange({ image: evt.target.result as string });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <EZSegmentedControl label="Apply To" value={scope} options={[{ value: 'current', label: 'Current' }, { value: 'all', label: 'All' }]} onChange={onScopeChange} />
                <EZSegmentedControl label="Type" value={config.type} options={[{ value: 'text', label: 'Text' }, { value: 'image', label: 'Image' }]} onChange={(v) => onChange({ type: v })} />
            </div>
            
            <div className="h-0 relative -mt-3">
                <AnimatePresence initial={false}>
                    {showWarning && (
                        <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="absolute top-1 left-0 right-0 z-10 bg-rose-50 text-rose-600 text-[9px] font-bold px-2 py-1 rounded-md border border-rose-100 flex items-center justify-center gap-1.5 shadow-sm">
                            <AlertCircle size={10} className="shrink-0" />
                            <span>Select a page first</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {config.type === 'text' ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={config.text || ''} 
                            onChange={(e) => onChange({ text: e.target.value })} 
                            className="flex-1 h-9 px-3 text-xs font-bold border border-stone-200 rounded-lg outline-none focus:border-[#111111] focus:ring-1 focus:ring-stone-100" 
                            placeholder="CONFIDENTIAL" 
                        />
                        <div className="relative w-9 h-9 shrink-0">
                            <input 
                                type="color" 
                                value={config.color} 
                                onChange={(e) => onChange({ color: e.target.value })} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className="w-full h-full rounded-lg border border-stone-200 shadow-sm flex items-center justify-center" style={{ backgroundColor: config.color }}>
                            </div>
                        </div>
                    </div>
                    <EZSlider label="Font Size" value={config.scale * 48} min={12} max={120} onChange={(v) => onChange({ scale: v / 48 })} suffix="pt" className="!h-2" />
                </div>
            ) : (
                <div className="flex gap-3">
                    <label className="w-20 h-20 shrink-0 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors bg-stone-50 overflow-hidden relative group">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {config.image ? (
                            <img src={config.image} className="w-full h-full object-contain p-1" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-stone-400">
                                <Plus size={16} />
                                <span className="text-[8px] font-bold uppercase">Upload</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </label>
                    <div className="flex-1 pt-1">
                        <EZSlider label="Scale" value={config.scale} min={0.1} max={2} step={0.1} onChange={(v) => onChange({ scale: v })} className="!h-2" />
                    </div>
                </div>
            )}

            <div className="h-px bg-stone-100 w-full" />

            <div className="grid grid-cols-2 gap-4">
                <EZSlider label="Opacity" value={config.opacity} min={0} max={1} step={0.1} onChange={(v) => onChange({ opacity: v })} className="!h-2" />
                <EZSlider label="Rotation" value={config.rotation} min={0} max={360} step={15} onChange={(v) => onChange({ rotation: v })} suffix="°" className="!h-2" />
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block pl-0.5">Position</label>
                <div className="grid grid-cols-3 gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'tiled'].map(pos => (
                        <button 
                            key={pos} 
                            onClick={() => onChange({ position: pos as WatermarkPosition })}
                            className={`h-7 rounded-lg text-[9px] font-bold uppercase transition-all ${config.position === pos ? 'bg-white text-[#111111] shadow-sm ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'}`}
                        >
                            {pos.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const PdfWorkspacePage: React.FC = () => {
  const { addToast, isMobile, registerUrl } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [sourceFiles, setSourceFiles] = useState<Map<string, File>>(new Map());
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [numbering, setNumbering] = useState<WorkspaceNumberingConfig>(DEFAULT_NUMBERING);
  const [enlargedPageId, setEnlargedPageId] = useState<string | null>(null);
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);
  const [loadingEnlargeId, setLoadingEnlargeId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [highResPreview, setHighResPreview] = useState<{ id: string, url: string, scale: number } | null>(null);
  const [thumbnailView, setThumbnailView] = useState<'list' | 'grid'>('list');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressState, setProgressState] = useState({ progress: 0, status: '' });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const [activeToolPanel, setActiveToolPanel] = useState<'numbering' | 'filters' | 'watermark' | 'export' | null>(isMobile ? null : 'export'); 
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [colorScope, setColorScope] = useState<'current' | 'all'>('current');
  const [watermarkScope, setWatermarkScope] = useState<'current' | 'all'>('current');
  const [currentWatermark, setCurrentWatermark] = useState<WatermarkConfig>(DEFAULT_WATERMARK);
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleZoom = useCallback((delta: number) => {
      setZoom(prev => Math.min(3, Math.max(0.2, prev + delta)));
      setShowZoomIndicator(true);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => setShowZoomIndicator(false), 1500);
  }, []);

  useEffect(() => {
    return () => {
        pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        if (highResPreview?.url) URL.revokeObjectURL(highResPreview.url);
        clearPdfCache();
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMobile && activeToolPanel === 'export') {
      setActiveToolPanel(null);
    }
  }, [isMobile, activeToolPanel]);

  // Ensure crop mode is disabled when selection is > 1
  useEffect(() => {
      if (selection.size > 1 && isCropMode) setIsCropMode(false);
  }, [selection.size, isCropMode]);

  const pushHistory = useCallback((newPages: WorkspacePage[], newSelection: Set<string>, newNumbering?: WorkspaceNumberingConfig) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ pages: newPages, selection: newSelection, numbering: newNumbering || numbering });
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
    setPages(newPages);
    setSelection(newSelection);
    if (newNumbering) setNumbering(newNumbering);
  }, [historyIndex, numbering]);

  const initHistory = (initialPages: WorkspacePage[]) => {
    setHistory([{ pages: initialPages, selection: new Set(), numbering: DEFAULT_NUMBERING }]);
    setHistoryIndex(0);
    setPages(initialPages);
    setSelection(new Set());
    setNumbering(DEFAULT_NUMBERING);
  };

  const undo = () => { if (historyIndex > 0) { const h = history[historyIndex - 1]; setPages(h.pages); setSelection(h.selection); setNumbering(h.numbering); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { const h = history[historyIndex + 1]; setPages(h.pages); setSelection(h.selection); setNumbering(h.numbering); setHistoryIndex(historyIndex + 1); } };

  const handleUpload = useCallback(async (files: File[], shouldReplace = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    let currentSourceFiles = sourceFiles, currentPages = pages;
    if (shouldReplace) { currentSourceFiles = new Map(); currentPages = []; setPages([]); setSelection(new Set()); setSourceFiles(new Map()); setHistory([]); setHistoryIndex(-1); clearPdfCache(); setHighResPreview(null); }
    const newSourceFiles = new Map(currentSourceFiles), newPagesToAdd: WorkspacePage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i], fileId = nanoid();
      newSourceFiles.set(fileId, file);
      try {
        const loaded = await loadPdfPages(file, (p) => setProcessingProgress((i * (100/files.length)) + (p * (1/files.length))));
        loaded.forEach(p => { registerUrl(p.previewUrl); newPagesToAdd.push({ id: nanoid(), sourceFileId: fileId, sourcePageIndex: p.pageIndex, previewUrl: p.previewUrl, rotation: 0, type: 'original', width: p.width || 595, height: p.height || 842, selected: false }); });
      } catch (e) { addToast("Error", `Failed to load ${file.name}`, "error"); }
    }
    setProcessingProgress(100); setSourceFiles(newSourceFiles);
    const finalPages = [...currentPages, ...newPagesToAdd];
    if (currentPages.length === 0) initHistory(finalPages); else pushHistory(finalPages, selection);
    setIsProcessing(false); setProcessingProgress(0); addToast("Success", `Added ${files.length} documents`, "success");
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [sourceFiles, pages, selection, isProcessing, pushHistory, addToast, registerUrl]);

  const onDrop = (acceptedFiles: File[]) => acceptedFiles.length > 0 && handleUpload(acceptedFiles);
  const { getRootProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, noClick: true, noKeyboard: true, disabled: isProcessing });

  const handleSelect = (id: string, multi: boolean) => {
    if (isCropMode) { 
        setPreviewPageId(id);
        return;
    }
    setPreviewPageId(id);
    if (isMobile && !multi) setSelection(new Set());
    else setSelection(prev => { const next = new Set(multi ? prev : []); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleSelectAll = () => pages.length > 0 && pushHistory(pages, selection.size === pages.length ? new Set() : new Set(pages.map(p => p.id)));
  
  useEffect(() => {
    if (previewPageId || selection.size > 0) {
      setShowSelectionWarning(false);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    }
  }, [previewPageId, selection.size]);

  const handleRotate = (dir: 'left' | 'right', id?: string) => {
    const angle = dir === 'left' ? -90 : 90;
    let t = new Set<string>(); if (id) t.add(id); else if (selection.size > 0) t = selection; else if (previewPageId) t.add(previewPageId);
    if (t.size === 0) return;
    pushHistory(pages.map(p => t.has(p.id) ? { ...p, rotation: (p.rotation + angle + 360) % 360 as any } : p), selection);
  };

  const handleDelete = (id?: string) => {
    let t = new Set<string>(); if (id) t.add(id); else if (selection.size > 0) t = selection; else if (previewPageId) t.add(previewPageId);
    if (t.size === 0) return;
    const newPages = pages.filter(p => !t.has(p.id));
    pushHistory(newPages, new Set());
    if (previewPageId && t.has(previewPageId)) setPreviewPageId(null);
  };

  const handleDuplicate = () => {
    let t = new Set<string>(); if (selection.size > 0) t = selection; else if (previewPageId) t.add(previewPageId);
    if (t.size === 0) return;
    const newPages: WorkspacePage[] = [];
    pages.forEach(p => { newPages.push(p); if (t.has(p.id)) newPages.push({ ...p, id: nanoid() }); });
    pushHistory(newPages, selection);
  };

  const handleApplyColorMode = (mode: ColorMode) => {
    const t = new Set<string>();
    if (colorScope === 'all') pages.forEach(p => t.add(p.id));
    else { if (previewPageId) t.add(previewPageId); else if (selection.size > 0) selection.forEach(id => t.add(id)); }
    if (t.size === 0) { if (colorScope === 'current') { if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current); setShowSelectionWarning(true); warningTimeoutRef.current = setTimeout(() => setShowSelectionWarning(false), 2000); } return; }
    pushHistory(pages.map(p => t.has(p.id) ? { ...p, colorMode: mode } : p), selection);
    addToast("Applied", `Color mode updated`, "success");
  };

  const handleApplyWatermark = (newConfig: WatermarkConfig) => {
      setCurrentWatermark(newConfig);
      const t = new Set<string>();
      if (watermarkScope === 'all') pages.forEach(p => t.add(p.id));
      else { if (previewPageId) t.add(previewPageId); else if (selection.size > 0) selection.forEach(id => t.add(id)); }
      if (t.size === 0) { if (watermarkScope === 'current') { if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current); setShowSelectionWarning(true); warningTimeoutRef.current = setTimeout(() => setShowSelectionWarning(false), 2000); } return; }
      pushHistory(pages.map(p => t.has(p.id) ? { ...p, watermark: newConfig } : p), selection);
  };

  const handleRemoveWatermark = () => {
      const t = new Set<string>();
      if (watermarkScope === 'all') pages.forEach(p => t.add(p.id));
      else { if (previewPageId) t.add(previewPageId); else if (selection.size > 0) selection.forEach(id => t.add(id)); }
      if (t.size === 0) return;
      pushHistory(pages.map(p => t.has(p.id) ? { ...p, watermark: undefined } : p), selection);
  };

  const handleApplyCrop = (crop: CropData | undefined) => {
    if (!previewPageId) return;
    const newPages = pages.map(p => p.id === previewPageId ? { ...p, crop } : p);
    pushHistory(newPages, selection);
    setIsCropMode(false);
  };

  const handleEnlarge = async (id: string) => {
    if (!isMobile) return;
    const page = pages.find(p => p.id === id);
    if (!page || page.type === 'blank') return;
    setLoadingEnlargeId(id);
    try {
      const file = sourceFiles.get(page.sourceFileId);
      if (file) {
        // Render crop-aware preview or full page
        const url = await renderSinglePage(file, page.sourcePageIndex, 3.0, page.crop);
        registerUrl(url); setEnlargedUrl(url); setEnlargedPageId(id);
      }
    } catch (e) { addToast("Error", "Could not render high-res page", "error"); } finally { setLoadingEnlargeId(null); }
  };

  const handleDownload = async (mode: 'merge' | 'split') => {
    if (pages.length === 0) return;
    setIsGenerating(true); setProgressState({ progress: 0, status: 'Preparing export...' });
    try {
      const blob = mode === 'merge' ? await generateWorkspacePdf(pages, sourceFiles, numbering, p => setProgressState(s => ({ ...s, progress: p })), s => setProgressState(p => ({ ...p, status: s }))) : await generateSplitPdfZip(pages, sourceFiles, numbering, p => setProgressState(s => ({ ...s, progress: p })), s => setProgressState(p => ({ ...p, status: s })));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = mode === 'merge' ? 'EZtify_Merged.pdf' : 'EZtify_Split.zip'; link.click();
      URL.revokeObjectURL(url); addToast("Success", "File exported.", "success");
    } catch (e) { addToast("Error", "Generation failed.", "error"); } finally { setIsGenerating(false); }
  };

  const updateNumbering = (updates: Partial<WorkspaceNumberingConfig>) => { pushHistory(pages, selection, { ...numbering, ...updates }); };
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragStart = (e: DragStartEvent) => setActiveDragId(e.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null); const { active, over } = event;
    if (over && active.id !== over.id) { const oldIndex = pages.findIndex(p => p.id === active.id), newIndex = pages.findIndex(p => p.id === over.id); pushHistory(arrayMove(pages, oldIndex, newIndex), selection); }
  };

  useEffect(() => { if (!isMobile && pages.length > 0 && !previewPageId) setPreviewPageId(pages[0].id); if (previewPageId && !pages.find(p => p.id === previewPageId)) setPreviewPageId(null); }, [pages, previewPageId, isMobile]);
  const desktopPreviewPage = pages.find(p => p.id === previewPageId);
  const canAction = pages.length > 0;
  const activeDragPage = activeDragId ? pages.find(i => i.id === activeDragId) : null;
  const enlargedPage = pages.find(p => p.id === enlargedPageId);

  useEffect(() => {
    if (!desktopPreviewPage || !canvasRef.current) return;
    const updateFit = () => {
        if (!canvasRef.current || !desktopPreviewPage) return;
        const { width: contW, height: contH } = canvasRef.current.getBoundingClientRect();
        const padding = 100, isS = desktopPreviewPage.rotation === 90 || desktopPreviewPage.rotation === 270;
        let w = desktopPreviewPage.width || 595;
        let h = desktopPreviewPage.height || 842;
        
        // Calculate crop dimensions for fitting
        if (desktopPreviewPage.crop) {
            w = w * (desktopPreviewPage.crop.width / 100);
            h = h * (desktopPreviewPage.crop.height / 100);
        }
        
        const eW = isS ? h : w;
        const eH = isS ? w : h;
        setFitScale(Math.min((contW - padding) / eW, (contH - padding) / eH));
    };
    updateFit(); window.addEventListener('resize', updateFit); return () => window.removeEventListener('resize', updateFit);
  }, [desktopPreviewPage, desktopPreviewPage?.rotation, desktopPreviewPage?.crop]);

  // Load High-Res Preview for Crop or Display
  useEffect(() => {
    if (!desktopPreviewPage || desktopPreviewPage.type === 'blank') { setHighResPreview(null); return; }
    
    // We always load the FULL page for the crop editor to work correctly
    const ts = Math.min(5.0, Math.max(2.0, zoom * 2.0));
    let isM = true;
    const generate = async () => {
        const file = sourceFiles.get(desktopPreviewPage.sourceFileId);
        if (file) { 
            try { 
                // Don't pass crop here if we want the full image for the crop overlay to use
                // However, for the *view* mode, if we crop via CSS, we still need full image.
                // So always load full page.
                const url = await renderSinglePage(file, desktopPreviewPage.sourcePageIndex, ts); 
                if (isM) { registerUrl(url); setHighResPreview({ id: desktopPreviewPage.id, url, scale: ts }); } 
            } catch (e) {} 
        }
    };
    // Debounce slightly
    const timer = setTimeout(generate, 300); 
    return () => { isM = false; clearTimeout(timer); };
  }, [desktopPreviewPage, sourceFiles, zoom, registerUrl]);

  // Calculations for Main Canvas View
  const isSideways = desktopPreviewPage && (desktopPreviewPage.rotation === 90 || desktopPreviewPage.rotation === 270);
  
  // Base dimensions (Full Page)
  const baseW = desktopPreviewPage ? (desktopPreviewPage.width || 595) : 0;
  const baseH = desktopPreviewPage ? (desktopPreviewPage.height || 842) : 0;
  
  // Cropped dimensions
  const crop = desktopPreviewPage?.crop || { x: 0, y: 0, width: 100, height: 100 };
  const croppedW = baseW * (crop.width / 100);
  const croppedH = baseH * (crop.height / 100);
  
  // Display dimensions (Rotated if needed)
  const displayW = isSideways ? croppedH : croppedW;
  const displayH = isSideways ? croppedW : croppedH;
  
  // Final CSS Pixel Size
  const finalW = displayW * fitScale * zoom;
  const finalH = displayH * fitScale * zoom;

  // Image CSS for cropping in view mode
  const viewImageStyle: React.CSSProperties = {
      width: `${100 * (100 / crop.width)}%`,
      height: `${100 * (100 / crop.height)}%`,
      transform: `translate(${-crop.x}%, ${-crop.y}%)`,
      transformOrigin: 'top left',
      maxWidth: 'none',
      filter: getFilterStyle(desktopPreviewPage?.colorMode),
      // Apply rotation on the container usually, but if image is transformed for crop...
      // Ideally we rotate the container div, and the image inside is just cropped.
  };

  // Condition for enabling crop on mobile toolbar
  const canCrop = !!(previewPageId && pages.find(p => p.id === previewPageId)?.type !== 'blank' && selection.size <= 1);

  // --- DESKTOP LAYOUT ---
  if (!isMobile) {
    return (
        <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-[#FAF9F6] text-[#111111]" {...getRootProps()}>
            <PageReadyTracker />
            <DragDropOverlay isDragActive={isDragActive} message="Append Workspace" variant="violet" icon={<FilePlus size={64} />} />
            <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />
            <AnimatePresence>{isProcessing && pages.length > 0 && <ProcessingOverlay progress={processingProgress} />}</AnimatePresence>

            {/* Crop Overlay (Fullscreen Modal for Desktop too if requested, or overlay on canvas) */}
            <AnimatePresence>
                {isCropMode && highResPreview && desktopPreviewPage && (
                    <CropOverlay 
                        imageUrl={highResPreview.url} 
                        initialCrop={desktopPreviewPage.crop} 
                        onApply={handleApplyCrop} 
                        onCancel={() => setIsCropMode(false)} 
                    />
                )}
            </AnimatePresence>

            <div className="flex h-full overflow-hidden">
                {/* 1. LEFT SIDEBAR: THUMBNAILS (FIXED LIST) */}
                <div className="w-24 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col z-20 transition-all duration-300">
                    <div className="h-24 shrink-0 flex flex-col items-center justify-center gap-2 border-b border-stone-200 bg-white px-2">
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xl font-bold text-[#111111] tracking-tighter tabular-nums">{pages.length}</span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Pages</span>
                        </div>
                        <div className="flex items-center gap-1 w-full justify-center">
                            <button onClick={handleSelectAll} className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${selection.size === pages.length && pages.length > 0 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-[#111111] hover:border-stone-300'}`} title="Select All">
                                <CheckSquare size={14} />
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-xl bg-accent-lime text-[#111111] hover:bg-[#111111] hover:text-white border border-transparent transition-all shadow-sm" title="Add Pages">
                                <Plus size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-stone-50/50">
                        {pages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-stone-300 text-[10px] font-bold uppercase tracking-widest rotate-[-90deg] whitespace-nowrap">Empty</div> : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                    <div className="flex flex-col gap-2 pb-4">
                                        <AnimatePresence mode="popLayout">
                                            {pages.map((page, index) => <SortablePage key={page.id} page={page} index={index} isSelected={selection.has(page.id)} isActive={previewPageId === page.id} onSelect={handleSelect} isMobile={false} isLoadingEnlarge={page.id === loadingEnlargeId} onEnlarge={handleEnlarge} numbering={numbering} compact={true} />)}
                                        </AnimatePresence>
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>

                {/* 2. MIDDLE PANEL: CANVAS & TOOLBAR */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] relative z-10" onClick={() => { setSelection(new Set()); setPreviewPageId(null); }}>
                    {/* Top Toolbar */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-stone-200 bg-white/80 backdrop-blur-md z-30 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                                <button onClick={undo} disabled={historyIndex <= 0 || isCropMode} className="p-1.5 rounded-md hover:bg-white text-stone-500 disabled:opacity-30"><Undo2 size={16} /></button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1 || isCropMode} className="p-1.5 rounded-md hover:bg-white text-stone-500 disabled:opacity-30"><Redo size={16} /></button>
                            </div>
                            <div className="w-px h-5 bg-stone-200 mx-1" />
                            <UnifiedAction onClick={() => handleRotate('left')} disabled={!canAction || isCropMode} icon={<RotateCcw />} className="!h-8 !w-8 !px-0 !rounded-lg" />
                            <UnifiedAction onClick={() => handleRotate('right')} disabled={!canAction || isCropMode} icon={<RotateCw />} className="!h-8 !w-8 !px-0 !rounded-lg" />
                            <div className="w-px h-5 bg-stone-200 mx-1" />
                            <UnifiedAction onClick={() => setIsCropMode(true)} disabled={!canAction || !previewPageId} isActive={isCropMode} icon={<Crop />} className="!h-8 !w-8 !px-0 !rounded-lg" title="Crop Page" />
                            <UnifiedAction onClick={handleDuplicate} disabled={!canAction || isCropMode} icon={<Copy />} className="!h-8 !w-8 !px-0 !rounded-lg" title="Clone Page" />
                            <UnifiedAction onClick={() => handleDelete()} disabled={!canAction || isCropMode} icon={<Trash2 />} variant="danger" className="!h-8 !w-8 !px-0 !rounded-lg border border-rose-100 bg-rose-50" />
                        </div>
                        <div className="flex items-center gap-4">
                            {!isCropMode && (
                                <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
                                    <button onClick={() => handleZoom(-0.1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-stone-500"><Minus size={14} /></button>
                                    <span className="text-[10px] font-bold font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => handleZoom(0.1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-stone-500"><Plus size={14} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 relative overflow-auto flex items-center justify-center bg-[#FAF9F6]" ref={canvasRef}>
                        <div className="relative p-12 min-w-full min-h-full flex items-center justify-center">
                            <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                            {desktopPreviewPage ? (
                                highResPreview?.id === desktopPreviewPage.id ? (
                                    <motion.div 
                                        key={desktopPreviewPage.id + "-crisp"} 
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }} 
                                        animate={{ opacity: 1, scale: 1, width: finalW, height: finalH }} 
                                        transition={{ duration: 0.2, ease: "easeOut" }} 
                                        className="relative shadow-2xl bg-white ring-1 ring-black/5 origin-center pointer-events-auto overflow-hidden bg-white"
                                    >
                                        <div className="w-full h-full relative">
                                            {/* Container Rotation */}
                                            <motion.div 
                                                className="w-full h-full overflow-hidden"
                                                animate={{ rotate: desktopPreviewPage.rotation }}
                                                transition={{ duration: 0.3, ease: "backOut" }} 
                                            >
                                                <img 
                                                    src={highResPreview.url} 
                                                    className="block pointer-events-none" 
                                                    style={viewImageStyle}
                                                    draggable={false} 
                                                />
                                            </motion.div>
                                        </div>
                                        
                                        {numbering.enabled && (
                                            <motion.div layout className="absolute z-30 pointer-events-none text-stone-900 font-bold flex items-center justify-center bg-white/95 backdrop-blur-md rounded-md shadow-sm border border-stone-200 origin-center" style={{ left: `${numbering.hPos}%`, top: `${numbering.vPos}%`, transform: 'translate(-50%, -50%)', fontSize: `${numbering.fontSize * zoom}px`, padding: '0.2em 0.6em' }} >
                                                {numbering.startFrom + pages.findIndex(p => p.id === desktopPreviewPage.id)}
                                            </motion.div>
                                        )}
                                        {desktopPreviewPage.watermark && (
                                            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                                                <WatermarkLayer config={desktopPreviewPage.watermark} zoom={zoom} />
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 text-stone-300 animate-spin" />
                                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Rendering...</span>
                                    </div>
                                )
                            ) : (
                                <UnifiedUploadCard onUpload={() => fileInputRef.current?.click()} isProcessing={isProcessing} progress={processingProgress} status="Ready" isMobile={false} />
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT SIDEBAR: INSPECTOR */}
                <div className="w-80 flex-shrink-0 bg-white border-l border-stone-200 flex flex-col z-20">
                    {/* Tool Switcher Header */}
                    <div className="h-16 shrink-0 flex items-center justify-between px-2 border-b border-stone-200 bg-white">
                        <div className="flex bg-stone-100 p-1 rounded-xl w-full">
                            {[
                                { id: 'export', label: 'Export', icon: <Download size={14} /> },
                                { id: 'watermark', label: 'Stamp', icon: <Stamp size={14} /> },
                                { id: 'numbering', label: '#', icon: <Hash size={14} /> },
                                { id: 'filters', label: 'Color', icon: <Droplets size={14} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveToolPanel(tab.id as any)}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeToolPanel === tab.id ? 'bg-white text-[#111111] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    title={tab.label}
                                >
                                    {tab.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tool Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                        {activeToolPanel === 'export' && (
                            <div className="flex flex-col gap-4 h-full">
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-3">
                                    <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Document Stats</h3>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-stone-500">
                                        <div className="flex justify-between"><span>Pages:</span> <span className="text-[#111111]">{pages.length}</span></div>
                                        <div className="flex justify-between"><span>Selected:</span> <span className="text-[#111111]">{selection.size}</span></div>
                                    </div>
                                </div>
                                <div className="mt-auto space-y-3">
                                    <EZButton onClick={() => handleDownload('merge')} disabled={isGenerating || pages.length === 0} icon={isGenerating ? <RefreshCw className="animate-spin" /> : <Download />} fullWidth variant="primary" className="!h-12 !bg-accent-lime !text-[#111111] !border-[#111111]">Export PDF</EZButton>
                                    <EZButton onClick={() => handleDownload('split')} disabled={isGenerating || pages.length === 0} icon={<FileText />} fullWidth variant="secondary" className="!h-12">Split Pages (ZIP)</EZButton>
                                </div>
                            </div>
                        )}
                        {activeToolPanel === 'numbering' && <NumberingOptions config={numbering} onChange={updateNumbering} />}
                        {activeToolPanel === 'filters' && <ColorModeOptions scope={colorScope} onScopeChange={setColorScope} currentMode={desktopPreviewPage?.colorMode || 'original'} onModeChange={handleApplyColorMode} showWarning={showSelectionWarning} />}
                        {activeToolPanel === 'watermark' && (
                            <>
                                <WatermarkPanel config={currentWatermark} onChange={(c) => { const n = { ...currentWatermark, ...c }; setCurrentWatermark(n); handleApplyWatermark(n); }} scope={watermarkScope} onScopeChange={setWatermarkScope} showWarning={showSelectionWarning} />
                                <div className="pt-4 mt-4 border-t border-stone-100">
                                    <button onClick={handleRemoveWatermark} className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"><Trash2 size={14} /> Remove Watermark</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {createPortal(<DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>{activeDragId ? <div className="w-32"><PageCard page={pages.find(p=>p.id===activeDragId)} isMobile={false} isSelected={selection.has(activeDragId)} isActive={previewPageId===activeDragId} numbering={numbering} isOverlay /></div> : null}</DragOverlay>, document.body)}
        </div>
    );
  }

  // --- MOBILE LAYOUT (UNCHANGED LOGIC) ---
  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-[#FAF9F6] text-[#111111]" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Append Workspace" variant="violet" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />
      
      {/* Crop Overlay Portal for Mobile */}
      <AnimatePresence>
        {isCropMode && highResPreview && desktopPreviewPage && (
            <CropOverlay 
                imageUrl={highResPreview.url} 
                initialCrop={desktopPreviewPage.crop} 
                onApply={handleApplyCrop} 
                onCancel={() => setIsCropMode(false)} 
            />
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden md:p-6 md:gap-6 relative">
        <AnimatePresence>{isProcessing && pages.length > 0 && <ProcessingOverlay progress={processingProgress} />}</AnimatePresence>
        
        {/* MOBILE VIEW IS SINGLE COLUMN */}
        <div className={`flex-1 relative flex flex-col h-full overflow-hidden bg-[#FAF9F6]`} onClick={() => { setSelection(new Set()); setPreviewPageId(null); }}>
           {/* Mobile Top Bar */}
           <AnimatePresence>
             {pages.length > 0 && !isProcessing && (
               <div className="md:hidden fixed top-16 left-0 right-0 z-30 flex justify-between items-start px-4 mt-4 pointer-events-none">
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, x: -10 }} className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-stone-200 shadow-sm rounded-full px-5 py-2.5">
                     <span className="text-[11px] font-bold font-mono text-stone-500 uppercase tracking-wider">{pages.length} Pages</span>
                  </motion.div>
                  <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, x: 10 }} className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xl border border-stone-200 shadow-sm rounded-full p-1.5 gap-1.5" >
                     <button onClick={handleSelectAll} className={`p-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${selection.size === pages.length ? 'bg-[#111111] text-white' : 'text-stone-500 hover:bg-stone-100'}`}><CheckSquare size={18} /></button>
                     <div className="h-4 w-px bg-stone-200" />
                     <button 
                        onClick={() => { if (canCrop) setIsCropMode(true); }} 
                        disabled={!canCrop}
                        className={`p-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isCropMode ? 'bg-[#111111] text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'} ${!canCrop ? 'opacity-30' : ''}`}
                     >
                        <Crop size={18} />
                     </button>
                     <button onClick={() => { setIsMoreMenuOpen(true); setActiveToolPanel(null); }} className={`p-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isMoreMenuOpen || activeToolPanel ? 'bg-[#111111] text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'}`}><MoreHorizontal size={18} /></button>
                     <div className="h-4 w-px bg-stone-200" />
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 w-9 h-9 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-full transition-colors"><Plus size={20} /></button>
                  </motion.div>
               </div>
             )}
           </AnimatePresence>
           
           {/* MOBILE MENU MODAL */}
           <AnimatePresence>
                {isMoreMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-[1250] bg-white rounded-t-[2.5rem] p-6 pb-24 border-t border-stone-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest">Tools</h3>
                                <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-stone-100 rounded-full"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => { setActiveToolPanel('watermark'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                                    <Stamp size={24} className="text-stone-700" />
                                    <span className="text-xs font-bold text-stone-600">Watermark</span>
                                </button>
                                <button onClick={() => { setActiveToolPanel('numbering'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                                    <Hash size={24} className="text-stone-700" />
                                    <span className="text-xs font-bold text-stone-600">Numbers</span>
                                </button>
                                <button onClick={() => { setActiveToolPanel('filters'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                                    <Droplets size={24} className="text-stone-700" />
                                    <span className="text-xs font-bold text-stone-600">Filters</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
           </AnimatePresence>

           <div className={`flex-1 relative overflow-hidden bg-[#FAF9F6]`} ref={canvasRef}>
              <AnimatePresence mode="popLayout">
                 {(pages.length === 0 || (isProcessing && pages.length === 0)) ? <UnifiedUploadCard key="upload-card" onUpload={() => fileInputRef.current?.click()} isProcessing={isProcessing} progress={processingProgress} status="Parsing workspace..." isMobile={true} /> : 
                   /* MOBILE LIST VIEW */
                   <motion.div key="mobile-list" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full overflow-y-auto custom-scrollbar p-4 pt-32 pb-32"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}><SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}><div className="grid grid-cols-2 gap-4"><AnimatePresence mode="popLayout">{pages.map((page, index) => <SortablePage key={page.id} page={page} index={index} isSelected={selection.has(page.id)} isActive={previewPageId === page.id} onSelect={handleSelect} isMobile={true} numbering={numbering} isLoadingEnlarge={page.id === loadingEnlargeId} onEnlarge={handleEnlarge} />)}</AnimatePresence></div></SortableContext></DndContext></motion.div>
                 }
              </AnimatePresence>
           </div>
           
           {/* MOBILE BOTTOM CONTROLS */}
           {pages.length > 0 && !isProcessing && (
               <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
                <LayoutGroup id="mobile-controls">
                    <motion.div layout className={`pointer-events-auto flex items-center shadow-2xl overflow-hidden origin-bottom transition-colors duration-300 ${(selection.size > 0 || previewPageId) ? 'bg-[#111111] text-white rounded-3xl p-2 gap-3 border border-stone-800' : 'bg-white/95 border border-stone-200 backdrop-blur-xl rounded-3xl p-2 gap-3'}`}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {(selection.size > 0 || previewPageId) ? (
                                <motion.div key="mobile-selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-1.5">
                                    <div className="px-4 text-xs font-bold font-mono tracking-wide whitespace-nowrap text-accent-lime">{selection.size > 0 ? `${selection.size} Selected` : 'Active'}</div>
                                    <div className="h-5 w-px mx-1 bg-white/20" /><button onClick={() => handleRotate('left')} className="p-2.5 rounded-2xl hover:bg-white/10"><RotateCcw size={20} /></button><button onClick={() => handleRotate('right')} className="p-2.5 rounded-2xl hover:bg-white/10"><RotateCw size={20} /></button><button onClick={handleDuplicate} className="p-2.5 rounded-2xl hover:bg-white/10"><Copy size={20} /></button><div className="h-5 w-px mx-1 bg-white/20" /><button onClick={() => handleDelete()} className="p-2.5 rounded-2xl hover:bg-white/10 text-rose-400"><Trash2 size={20} /></button>
                                </motion.div>
                            ) : (
                                <motion.div key="mobile-global" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3">
                                    <EZButton variant="tertiary" onClick={() => fileInputRef.current?.click()} icon={<Plus size={20} />} className="!h-12 !rounded-2xl !bg-stone-100 !text-[#111111] !border-transparent">Add</EZButton>
                                    <EZButton variant="primary" onClick={() => handleDownload('merge')} disabled={isGenerating} isLoading={isGenerating} icon={!isGenerating && <Download size={20} fill="currentColor" />} className="!h-12 !rounded-2xl !text-sm shadow-sm !bg-accent-lime !text-[#111111] !border-[#111111]">Export</EZButton>
                                    <div className="w-px h-6 bg-stone-200 mx-1" /><button onClick={() => { setPages([]); setHistory([]); setHistoryIndex(-1); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-50 text-stone-500 hover:text-stone-900 transition-colors"><RefreshCw size={22} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </LayoutGroup>
             </div>
           )}
        </div>
      </div>
      
      {/* Mobile Tool Panel (Popup) */}
      <AnimatePresence>
          {activeToolPanel && activeToolPanel !== 'export' && isMobile && (
              <>
                  <div className="fixed inset-0 z-[1100] bg-transparent" onClick={() => setActiveToolPanel(null)} />
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 5 }} transition={{ type: 'spring', damping: 25, stiffness: 400 }} className={`fixed z-[1200] bg-white border border-stone-200 shadow-xl rounded-2xl p-3 w-[220px] flex flex-col top-[72px] right-4 max-h-[60vh]`} onClick={e => e.stopPropagation()} >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 shrink-0">
                          <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.1em]">
                              {activeToolPanel === 'numbering' ? 'Page Numbers' : activeToolPanel === 'filters' ? 'Filters' : 'Watermark'}
                          </h3>
                          <button onClick={() => setActiveToolPanel(null)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors"><X size={14} /></button>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-1 px-1">
                        {activeToolPanel === 'numbering' && <NumberingOptions config={numbering} onChange={updateNumbering} isMobile={isMobile} />}
                        {activeToolPanel === 'filters' && <ColorModeOptions scope={colorScope} onScopeChange={setColorScope} currentMode={previewPageId ? pages.find(p => p.id === previewPageId)?.colorMode || 'original' : 'original'} onModeChange={handleApplyColorMode} showWarning={showSelectionWarning} />}
                        {activeToolPanel === 'watermark' && <WatermarkPanel config={currentWatermark} onChange={(c) => { const n = { ...currentWatermark, ...c }; setCurrentWatermark(n); handleApplyWatermark(n); }} scope={watermarkScope} onScopeChange={setWatermarkScope} showWarning={showSelectionWarning} />}
                      </div>
                      {activeToolPanel === 'watermark' && (
                          <div className="pt-3 mt-3 border-t border-stone-100">
                              <button onClick={handleRemoveWatermark} className="w-full py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                                  <Trash2 size={14} /> Remove Watermark
                              </button>
                          </div>
                      )}
                  </motion.div>
              </>
          )}
      </AnimatePresence>
      <AnimatePresence>
        {isMobile && enlargedPageId && enlargedUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1500] bg-black/95 backdrop-blur-xl flex flex-col touch-none" onClick={() => setEnlargedPageId(null)} >
            <div className="flex items-center justify-between px-6 py-6 z-20 pointer-events-auto bg-gradient-to-b from-black/50 to-transparent"><span className="text-white/80 font-mono text-xs tracking-wider font-bold uppercase">Preview</span><button onClick={(e) => { e.stopPropagation(); setEnlargedPageId(null); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"><X size={20} /></button></div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                <motion.img key={enlargedPageId} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: pages.find(p => p.id === enlargedPageId)?.rotation || 0 }} exit={{ scale: 1.1, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} src={enlargedUrl} className="max-w-full max-h-full object-contain shadow-2xl" style={{ filter: getFilterStyle(pages.find(p => p.id === enlargedPageId)?.colorMode) }} onClick={(e) => e.stopPropagation()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
