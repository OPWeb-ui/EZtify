
// ... existing imports
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  RotateCcw, RotateCw, Trash2, 
  Plus, FilePlus, X, Check,
  Maximize2, ZoomIn, ZoomOut, Download, List, LayoutGrid,
  Settings, Image as ImageIcon, CheckSquare, RefreshCw, Sliders, AlertCircle
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
import { EZButton } from '../components/EZButton';
import { EZSlider } from '../components/EZSlider';
import { EZSegmentedControl } from '../components/EZSegmentedControl';
import { EZDropdown } from '../components/EZDropdown';

// --- HELPERS ---

const WORKSPACE_CARD_LAYOUT_ID = "img-pdf-card-surface";

const getPageDimensions = (config: PdfConfig, image: UploadedImage | null) => {
// ... existing getPageDimensions
  if (config.pageSize === 'auto' && image) {
    const isS = image.rotation % 180 !== 0;
    return { 
      width: isS ? image.height : image.width, 
      height: isS ? image.width : image.height 
    };
  }
  
  const sizes: Record<string, { w: number, h: number }> = {
    a4: { w: 210, h: 297 },
    letter: { w: 215.9, h: 279.4 }
  };
  
  const base = sizes[config.pageSize] || sizes.a4;
  return config.orientation === 'landscape' 
    ? { width: base.h, height: base.w } 
    : { width: base.w, height: base.h };
};

const getPageStyles = (config: PdfConfig, image: UploadedImage | null) => {
// ... existing getPageStyles
  const dims = getPageDimensions(config, image);
  
  const objectFitMap = {
    contain: 'contain',
    cover: 'cover',
    fill: 'fill'
  };

  const isAuto = config.pageSize === 'auto';
  const marginPercentW = isAuto ? 0 : (config.margin / dims.width) * 100;
  const marginPercentH = isAuto ? 0 : (config.margin / dims.height) * 100;

  return {
    aspectRatio: `${dims.width} / ${dims.height}`,
    padding: `${marginPercentH}% ${marginPercentW}%`,
    objectFit: isAuto ? 'fill' : objectFitMap[config.fitMode]
  };
};

const ProcessingOverlay = ({ progress }: { progress: number }) => (
// ... existing ProcessingOverlay
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
            <ImageIcon size={40} strokeWidth={2} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Processing</h2>
        <p className="text-sm text-stone-500 font-medium mb-8 font-mono max-w-[200px] truncate text-center">Optimizing media...</p>
        
        <div className="w-56 bg-stone-100 rounded-full h-3 overflow-hidden mb-3 border border-stone-200">
            <motion.div 
            className="h-full bg-[#111111] rounded-full" 
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.3, ease: "circOut" }}
            />
        </div>
        
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest tabular-nums">
            {Math.round(progress)}%
        </span>
      </motion.div>
  </motion.div>
);

const UnifiedUploadCard: React.FC<{ 
  onUpload: () => void; 
  isProcessing: boolean; 
  progress: number; 
  status: string;
  isMobile: boolean;
}> = ({ onUpload, isProcessing, progress, status, isMobile }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <motion.div
        layoutId={WORKSPACE_CARD_LAYOUT_ID}
        className={`
            relative flex flex-col items-center justify-center w-80 h-80 rounded-[3rem] 
            border-2 transition-all duration-500 overflow-hidden bg-white
            ${isProcessing 
                ? 'border-accent-lime shadow-xl shadow-lime-100' 
                : 'border-dashed border-stone-200 shadow-sm hover:border-stone-400 hover:shadow-lg cursor-pointer group'
            }
        `}
        onClick={!isProcessing ? onUpload : undefined}
      >
         <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-stone-50/50 via-white to-white z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isProcessing ? 1 : 0 }}
            transition={{ duration: 0.5 }}
         />

         <AnimatePresence mode="wait">
            {isProcessing ? (
                <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col items-center w-full px-6 text-center"
                >
                    <div className="mb-6 w-20 h-24 bg-[#FDFCF8] rounded-xl border-2 border-[#111111] rotate-3 flex flex-col p-2 gap-2 shadow-sm">
                       <div className="w-1/2 h-1.5 bg-stone-200 rounded-full" />
                       <div className="w-full h-1.5 bg-stone-100 rounded-full" />
                       <div className="mt-auto w-full bg-accent-lime h-1.5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-[#111111]" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} />
                       </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Processing</h2>
                    <p className="text-sm text-stone-500 font-medium mb-6 font-mono max-w-[90%] truncate">
                      {status || 'Optimizing...'}
                    </p>
                </motion.div>
            ) : (
                <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center z-10"
                >
                     {isMobile && (
                        <div className="mb-6 opacity-30">
                           <span className="text-[10px] font-black text-[#111111] uppercase tracking-[0.25em]">Image to PDF</span>
                        </div>
                     )}
                     <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-stone-300" />
                         <Plus size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111] group-hover:text-stone-600 transition-colors">
                         Add Images
                     </span>
                     <span className="text-sm font-medium text-stone-400 mt-2">
                         {isMobile ? 'Tap to upload' : 'Drag & drop or click'}
                     </span>
                </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    </div>
  );
};

const UnifiedAction = React.forwardRef<HTMLButtonElement, any>(({ icon, label, isActive, className, variant = 'default', ...props }, ref) => {
// ... rest of the file remains unchanged
    const baseStyles = "h-10 px-3 rounded-2xl flex items-center gap-2 transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#111111] font-bold text-sm justify-center whitespace-nowrap shrink-0";
    const variants: any = {
      default: isActive 
        ? "bg-[#111111] text-white shadow-md transform scale-[1.02] border-transparent" 
        : "text-stone-500 hover:bg-stone-100 hover:text-[#111111] active:scale-95 disabled:opacity-30 disabled:pointer-events-none bg-white border border-stone-200 shadow-sm",
      danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-30 bg-rose-50 border border-rose-100",
      primary: "bg-accent-lime text-[#111111] hover:bg-[#111111] hover:text-white shadow-lg shadow-stone-200 border border-[#111111] active:scale-95 disabled:opacity-50 disabled:shadow-none transition-colors",
      minimal: "text-stone-400 hover:text-[#111111] active:scale-95 disabled:opacity-30 bg-transparent border-none shadow-none hover:bg-stone-100"
    };
    
    return (
      <motion.button ref={ref} whileTap={!props.disabled ? { scale: 0.96 } : undefined} className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props} >
        {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
        {label && <span className="hidden xl:inline tracking-tight">{label}</span>}
      </motion.button>
    );
});
UnifiedAction.displayName = "UnifiedAction";

const ImageCard = ({ image, index, isSelected, isActive, isOverlay, isDragging, onSelect, onEnlarge, isMobile, config }: any) => {
  const [visualRotation, setVisualRotation] = useState(image.rotation);
  const prevRotationProp = useRef(image.rotation);

  useEffect(() => {
    let diff = image.rotation - prevRotationProp.current;
    if (diff === -270) diff = 90;
    if (diff === 270) diff = -90;
    if (diff !== 0) {
        setVisualRotation(prev => prev + diff);
        prevRotationProp.current = image.rotation;
    }
  }, [image.rotation]);

  const showActiveBorder = isSelected || isActive;
  // Use effective config for this specific thumbnail
  const effectiveConfig = image.pdfConfig || config;
  const pageStyles = getPageStyles(effectiveConfig, image);

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
        boxShadow: isDragging 
            ? '0 10px 30px rgba(0,0,0,0.1)' 
            : showActiveBorder 
                ? '0 8px 24px rgba(0,0,0,0.08)' 
                : '0 2px 10px rgba(0,0,0,0.03)',
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: "easeOut" } }}
      whileHover={!isDragging && !isOverlay ? { y: -3, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' } : {}}
      whileTap={!isDragging && !isOverlay ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ aspectRatio: pageStyles.aspectRatio }}
      className={`
        relative overflow-hidden group select-none bg-white border border-stone-200 rounded-2xl
        ${isOverlay ? 'shadow-2xl z-50 cursor-grabbing bg-white ring-2 ring-[#111111]' : 'cursor-pointer'}
        w-full
      `}
      onClick={(e) => { e.stopPropagation(); onSelect?.(image.id, e.shiftKey || e.metaKey || e.ctrlKey); }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect?.(image.id, true); }}
        className={`
          absolute top-3 left-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer 
          ${isSelected 
            ? 'bg-[#111111] text-white shadow-md scale-100 opacity-100' 
            : 'bg-white/90 backdrop-blur-sm border border-stone-200 text-transparent opacity-0 group-hover:opacity-100 hover:border-[#111111] scale-90 hover:scale-100'}
          ${isMobile && !isSelected ? 'opacity-100 bg-white/80 border-stone-200 text-stone-300' : ''}
        `}
      >
        <Check size={14} strokeWidth={4} />
      </button>

      <div 
        className="absolute bottom-3 right-3 z-20 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-mono font-bold text-stone-500 pointer-events-none tabular-nums shadow-sm select-none border border-stone-100"
      >
        {index !== undefined ? index + 1 : '#'}
      </div>

      {isMobile && !isDragging && (
         <button
            onClick={(e) => { e.stopPropagation(); onEnlarge?.(image.id); }}
            className={`
              absolute bottom-3 left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center 
              bg-white shadow-md border border-stone-100 text-stone-500 transition-all duration-200 active:scale-95
              ${(isActive || isSelected) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
            `}
         >
            <Maximize2 size={18} />
         </button>
      )}

      <div 
        className="w-full h-full flex items-center justify-center relative overflow-hidden bg-stone-50/50 transition-all duration-200"
        style={{ padding: pageStyles.padding }}
      >
        <div className="relative shadow-sm bg-white overflow-hidden w-full h-full">
            <motion.img 
                src={image.previewUrl}
                initial={false}
                animate={{ rotate: visualRotation }}
                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                className="w-full h-full block"
                style={{ objectFit: pageStyles.objectFit as any }}
                draggable={false}
            />
        </div>
      </div>
    </motion.div>
  );
};

const SortableImage: React.FC<any> = ({ image, index, isSelected, isActive, onSelect, onEnlarge, isMobile, config, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none touch-manipulation">
      <ImageCard 
        image={image} 
        index={index} 
        isDragging={isDragging} 
        isSelected={isSelected}
        isActive={isActive}
        onSelect={onSelect} 
        onEnlarge={onEnlarge}
        isMobile={isMobile}
        config={config}
        {...props} 
      />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export const ImageToPdfPage: React.FC = () => {
// ... existing ImageToPdfPage implementation
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const configBtnRef = useRef<HTMLButtonElement>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [thumbnailView, setThumbnailView] = useState<'list' | 'grid'>('grid'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [settingsScope, setSettingsScope] = useState<'current' | 'all'>('all');
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const [enlargedImageId, setEnlargedImageId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, align: 'left' });

  // PDF Configuration
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.9
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // --- Handlers ---

  const handleUpload = useCallback(async (files: File[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProgress(10); 

    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        
        const dims = await new Promise<{w: number, h: number}>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.width, h: img.height });
            img.onerror = () => resolve({ w: 0, h: 0 });
            img.src = previewUrl;
        });
        
        newImages.push({
            id: nanoid(),
            file,
            previewUrl,
            width: dims.w, 
            height: dims.h,
            rotation: 0
        });
        
        setProgress(10 + ((i + 1) / files.length) * 80);
        await new Promise(resolve => setTimeout(resolve, 5)); 
    }

    setProgress(100);
    setTimeout(() => {
        setImages(prev => [...prev, ...newImages]);
        setIsProcessing(false);
        setProgress(0);
        addToast("Success", `Added ${files.length} images`, "success");
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, 400);

  }, [isProcessing, addToast]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) handleUpload(acceptedFiles);
  };

  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] }, 
    noClick: true, 
    noKeyboard: true, 
    disabled: isProcessing 
  });

  // Handle setting scope logic when opening popup
  useEffect(() => {
    if (isSettingsOpen) {
      setSettingsScope(previewImageId ? 'current' : 'all');
      setShowSelectionWarning(false);
    }
  }, [isSettingsOpen, previewImageId]);

  // Auto-dismiss warning on selection change or scope change to "all"
  useEffect(() => {
    if (previewImageId || settingsScope === 'all') {
      setShowSelectionWarning(false);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    }
  }, [previewImageId, settingsScope]);

  // Accurate Popup Positioning with resize listeners
  useLayoutEffect(() => {
    if (isSettingsOpen && configBtnRef.current && !isMobile) {
      const updatePosition = () => {
        if (!configBtnRef.current) return;
        const rect = configBtnRef.current.getBoundingClientRect();
        const POPUP_WIDTH = 240;
        const SCREEN_PADDING = 20;
        
        let left = rect.left;
        
        // Flip to left align if not enough space on right
        if (left + POPUP_WIDTH > window.innerWidth - SCREEN_PADDING) {
            left = rect.right - POPUP_WIDTH;
        }
        
        // Ensure strictly below button
        setPopupPos({
            top: rect.bottom + 8, // 8px gap
            left: Math.max(SCREEN_PADDING, left),
            align: 'left'
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, { capture: true });
      };
    }
  }, [isSettingsOpen, isMobile]);

  const handleSelect = (id: string, multi: boolean) => {
    if (isMobile) {
        setSelection(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        return; 
    }

    setPreviewImageId(id);
    if (!multi) {
        setSelection(new Set());
    } else {
        setSelection(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
  };

  const handleSelectAll = () => {
    if (selection.size === images.length) {
        setSelection(new Set());
    } else {
        setSelection(new Set(images.map(img => img.id)));
    }
  };

  const desktopPreviewImage = useMemo(() => images.find(i => i.id === previewImageId), [images, previewImageId]);

  const activeConfig = useMemo(() => {
    if (settingsScope === 'current' && desktopPreviewImage) {
        return desktopPreviewImage.pdfConfig || config;
    }
    return config;
  }, [settingsScope, desktopPreviewImage, config]);

  const updateConfig = (key: keyof PdfConfig, value: any) => {
    if (settingsScope === 'current') {
        if (previewImageId) {
            setImages(prev => prev.map(img => 
                img.id === previewImageId 
                    ? { ...img, pdfConfig: { ...(img.pdfConfig || config), [key]: value } } 
                    : img
            ));
        } else {
            // No selection - trigger warning
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            setShowSelectionWarning(true);
            warningTimeoutRef.current = setTimeout(() => setShowSelectionWarning(false), 2000);
        }
    } else {
        // Apply to All: Update global and reset individual overrides to maintain uniformity
        setConfig(prev => ({ ...prev, [key]: value }));
        setImages(prev => prev.map(img => ({ ...img, pdfConfig: undefined })));
    }
  };

  const handleScopeChange = (newScope: 'current' | 'all') => {
    if (newScope === 'current' && !previewImageId) {
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setShowSelectionWarning(true);
        warningTimeoutRef.current = setTimeout(() => setShowSelectionWarning(false), 2200);
        return; // Prevent switch to Current if no image selected
    }
    setSettingsScope(newScope);
    setShowSelectionWarning(false);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const angle = direction === 'left' ? -90 : 90;
    let targetIds = new Set<string>();
    if (selection.size > 0) targetIds = selection;
    else if (previewImageId) targetIds.add(previewImageId);
    
    if (targetIds.size === 0) return;
    setImages(prev => prev.map(img => targetIds.has(img.id) ? { ...img, rotation: (img.rotation + angle + 360) % 360 } : img));
  };

  const handleDelete = () => {
    let idsToDelete = new Set<string>();
    if (selection.size > 0) idsToDelete = selection;
    else if (previewImageId) idsToDelete.add(previewImageId);
    
    if (idsToDelete.size === 0) return;
    
    const newImages = images.filter(img => !idsToDelete.has(img.id));
    
    images.forEach(img => {
        if (idsToDelete.has(img.id)) URL.revokeObjectURL(img.previewUrl);
    });

    setImages(newImages);
    setSelection(new Set());
    if (previewImageId && idsToDelete.has(previewImageId)) setPreviewImageId(null);
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setSelection(new Set());
    setPreviewImageId(null);
    setIsSettingsOpen(false);
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
        await generatePDF(images, config, setProgress);
        addToast("Success", "PDF Generated", "success");
    } catch (e) {
        addToast("Error", "Generation failed", "error");
    } finally {
        setIsGenerating(false);
        setProgress(0);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(e.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(p => p.id === active.id);
      const newIndex = images.findIndex(p => p.id === over.id);
      setImages(arrayMove(images, oldIndex, newIndex));
    }
  };

  useEffect(() => {
      if (!isMobile && images.length > 0 && !previewImageId) setPreviewImageId(images[0].id);
      if (previewImageId && !images.find(p => p.id === previewImageId)) setPreviewImageId(null);
  }, [images, previewImageId, isMobile]);

  useEffect(() => { setZoom(1); }, [previewImageId]);

  const activeDragItem = activeDragId ? images.find(i => i.id === activeDragId) : null;
  const canAction = images.length > 0;

  useEffect(() => {
    if (!desktopPreviewImage || !canvasRef.current) return;
    
    const updateFit = () => {
        if (!canvasRef.current || !desktopPreviewImage) return;
        const { width: contW, height: contH } = canvasRef.current.getBoundingClientRect();
        const padding = 100;
        
        // Ensure fit is calculated from specific page config
        const effectiveConfig = desktopPreviewImage.pdfConfig || config;
        const dims = getPageDimensions(effectiveConfig, desktopPreviewImage);
        const scale = Math.min((contW - padding) / dims.width, (contH - padding) / dims.height);
        setFitScale(scale);
    };
    
    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, [desktopPreviewImage, desktopPreviewImage?.rotation, config.pageSize, config.orientation, config.margin, desktopPreviewImage?.pdfConfig]);

  const effectivePreviewConfig = desktopPreviewImage?.pdfConfig || config;
  const dims = desktopPreviewImage ? getPageDimensions(effectivePreviewConfig, desktopPreviewImage) : { width: 0, height: 0 };
  const previewW = dims.width * fitScale * zoom;
  const previewH = dims.height * fitScale * zoom;
  const pageStyles = desktopPreviewImage ? getPageStyles(effectivePreviewConfig, desktopPreviewImage) : null;

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-[#FAF9F6] text-[#111111]" {...getRootProps()}>
      {/* ... existing PageReadyTracker, DragDropOverlay, input ... */}
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Append Images" variant="slate" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />

      {/* UNIFIED SHELL */}
      <div className="flex-1 flex overflow-hidden md:p-6 md:gap-6 relative">
        
        <AnimatePresence>
            {isProcessing && images.length > 0 && (
                <ProcessingOverlay progress={progress} />
            )}
        </AnimatePresence>

        {/* ... existing Left Panel ... */}
        <div className={`
            flex-col h-full z-20 
            ${isMobile ? 'hidden' : 'flex w-80 flex-shrink-0 bg-white md:rounded-3xl md:shadow-soft md:border md:border-stone-200 overflow-hidden'}
        `}>
           <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-stone-200 bg-white">
              <div className="flex items-center gap-3">
                 <div className="flex items-center bg-stone-50 rounded-xl p-1 border border-stone-200">
                    <UnifiedAction icon={<LayoutGrid />} isActive={thumbnailView === 'grid'} onClick={() => setThumbnailView('grid')} className="!h-8 !px-2.5 !rounded-lg" />
                    <UnifiedAction icon={<List />} isActive={thumbnailView === 'list'} onClick={() => setThumbnailView('list')} className="!h-8 !px-2.5 !rounded-lg" />
                 </div>
                 
                 <div className="w-px h-6 bg-stone-200" />
                 
                 <UnifiedAction 
                    onClick={handleSelectAll}
                    disabled={images.length === 0}
                    isActive={selection.size === images.length && images.length > 0}
                    icon={<CheckSquare />}
                    variant="minimal"
                    className="!h-9 !w-9 !p-0 !rounded-xl"
                    title="Select All"
                 />
              </div>
              
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest tabular-nums">{images.length} imgs</span>
                  <UnifiedAction onClick={() => fileInputRef.current?.click()} icon={<Plus />} className="!h-9 !w-9 !p-0 !rounded-xl bg-accent-lime text-[#111111] hover:bg-[#111111] hover:text-white border-transparent" />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFCF8]">
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 text-xs font-medium tracking-wide opacity-60">
                    No images loaded
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={images.map(p => p.id)} strategy={thumbnailView === 'list' ? verticalListSortingStrategy : rectSortingStrategy}>
                        <div className={thumbnailView === 'list' ? "flex flex-col gap-4 pb-20 px-5 pt-5" : "grid grid-cols-2 gap-4 pb-20 p-4"}>
                        <AnimatePresence mode="popLayout">
                            {images.map((img, index) => (
                                <SortableImage 
                                    key={img.id} 
                                    image={img} 
                                    index={index} 
                                    isSelected={selection.has(img.id)}
                                    isActive={previewImageId === img.id}
                                    onSelect={handleSelect}
                                    isMobile={false}
                                    config={config}
                                    onEnlarge={(id: string) => setEnlargedImageId(id)}
                                />
                            ))}
                        </AnimatePresence>
                        </div>
                    </SortableContext>
                </DndContext>
              )}
           </div>
        </div>

        {/* RIGHT PANEL: PREVIEW & SETTINGS */}
        <div 
            className={`
                flex-1 relative flex flex-col h-full overflow-hidden 
                ${isMobile ? 'bg-[#FAF9F6]' : 'bg-white md:rounded-3xl md:shadow-soft md:border md:border-stone-200'}
            `} 
            onClick={() => setSelection(new Set())}
        >
           {/* ... existing Desktop Toolbar ... */}
           <div className="hidden md:flex h-20 items-center justify-between px-6 bg-white/80 backdrop-blur-xl z-30 shrink-0 select-none rounded-t-3xl border-b border-stone-200">
              
              {/* Actions Group */}
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 p-1 bg-stone-50 rounded-2xl border border-stone-200">
                      <UnifiedAction onClick={() => handleRotate('left')} disabled={!canAction} icon={<RotateCcw />} className="!h-9 !w-10 !px-0 !rounded-xl" />
                      <UnifiedAction onClick={() => handleRotate('right')} disabled={!canAction} icon={<RotateCw />} className="!h-9 !w-10 !px-0 !rounded-xl" />
                  </div>

                  <div className="flex items-center gap-2">
                      <UnifiedAction 
                        ref={configBtnRef}
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                        isActive={isSettingsOpen}
                        icon={<Sliders />} 
                        label="Configure"
                        className="!h-11 !rounded-xl"
                      />
                      <UnifiedAction onClick={() => handleDelete()} disabled={!canAction} icon={<Trash2 />} variant="danger" className="!h-11 !w-11 !p-0 !rounded-xl border border-rose-100 bg-rose-50" />
                  </div>
              </div>

              {/* Zoom & Export */}
              <div className="flex items-center gap-6">
                  {/* Zoom Group */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200">
                      <UnifiedAction onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} icon={<ZoomOut />} className="!h-5 !w-5 !px-0 !rounded-md text-stone-400 hover:text-[#111111]" variant="minimal" />
                      <span className="min-w-[3rem] text-center text-[11px] font-bold text-[#111111] font-mono tabular-nums select-none">{Math.round(zoom * 100)}%</span>
                      <UnifiedAction onClick={() => setZoom(z => Math.min(3, z + 0.1))} icon={<ZoomIn />} className="!h-5 !w-5 !px-0 !rounded-md text-stone-400 hover:text-[#111111]" variant="minimal" />
                  </div>

                  <div className="w-px h-6 bg-stone-200" />

                  <UnifiedAction 
                      onClick={handleGenerate} 
                      disabled={isGenerating || images.length === 0} 
                      icon={isGenerating ? <RefreshCw className="animate-spin" /> : <Download />} 
                      label={isGenerating ? "Processing..." : "Export PDF"} 
                      variant="primary" 
                      className="!h-12 !px-8 !rounded-2xl text-base shadow-xl !bg-accent-lime !text-[#111111] !border-[#111111]"
                  />
              </div>
           </div>

           {/* ... existing Mobile Toolbar ... */}
           <AnimatePresence>
             {isMobile && images.length > 0 && !isProcessing && (
               <div className="md:hidden fixed top-16 left-0 right-0 z-30 flex justify-between items-start px-4 mt-4 pointer-events-none">
                  {/* Total Images Pill */}
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    exit={{ opacity: 0, x: -10 }} 
                    className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-stone-200 shadow-sm rounded-full px-5 py-2.5"
                  >
                     <span className="text-[11px] font-bold font-mono text-stone-500 uppercase tracking-wider">{images.length} Images</span>
                  </motion.div>

                  {/* Actions Pill */}
                  <motion.div 
                    initial={{ x: 10, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    exit={{ opacity: 0, x: 10 }} 
                    className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xl border border-stone-200 shadow-sm rounded-full p-1.5 gap-1.5"
                  >
                     <button 
                        onClick={handleSelectAll} 
                        className={`p-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${selection.size === images.length ? 'bg-[#111111] text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                     >
                        <CheckSquare size={18} />
                     </button>

                     <div className="h-4 w-px bg-stone-200" />

                     <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                        className={`p-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isSettingsOpen ? 'bg-[#111111] text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                     >
                        <Settings size={18} />
                     </button>
                     
                     <div className="h-4 w-px bg-stone-200" />

                     <button onClick={() => fileInputRef.current?.click()} className="p-2 w-9 h-9 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-full transition-colors">
                        <Plus size={20} />
                     </button>
                  </motion.div>
               </div>
             )}
           </AnimatePresence>

           {/* ... existing Settings Panel ... */}
           <AnimatePresence>
             {isSettingsOpen && (
               <>
                  <div className="fixed inset-0 z-[1100] bg-transparent" onClick={() => setIsSettingsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 5 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 5 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }} 
                    className={`
                        fixed z-[1200] bg-white border border-stone-200 shadow-xl rounded-2xl p-3 w-[240px]
                        ${isMobile ? 'top-[72px] right-4' : ''}
                    `}
                    style={!isMobile ? {
                        top: popupPos.top,
                        left: popupPos.left,
                    } : {}}
                    onClick={e => e.stopPropagation()} 
                  >
                      {/* ... existing settings panel content ... */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                          <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.1em]">PDF Options</h3>
                          <button onClick={() => setIsSettingsOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors"><X size={14} /></button>
                      </div>
                      
                      <div className="space-y-5">
                         {/* Scope Selector */}
                         <div className="space-y-2">
                           <div className="flex items-center justify-between h-5">
                             <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest pl-0.5">Apply to</label>
                             <AnimatePresence>
                               {showSelectionWarning && (
                                 <motion.div 
                                    initial={{ opacity: 0, x: 5 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: 5 }}
                                    className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md"
                                 >
                                    <AlertCircle size={10} />
                                    <span>Select first</span>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                           <EZSegmentedControl 
                              value={settingsScope} 
                              options={[
                                { value: 'current', label: 'Current' },
                                { value: 'all', label: 'All' }
                              ]} 
                              onChange={handleScopeChange} 
                           />
                         </div>

                         <div className="h-px bg-stone-100" />

                         <EZDropdown 
                            label="Page Size" 
                            value={activeConfig.pageSize} 
                            options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'auto', label: 'Auto (Fit)' }]} 
                            onChange={(val) => updateConfig('pageSize', val)} 
                            fullWidth 
                         />
                         <EZSegmentedControl 
                            label="Orientation" 
                            value={activeConfig.orientation} 
                            options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} 
                            onChange={(val) => updateConfig('orientation', val)} 
                         />
                         <EZSlider 
                            label="Margin" 
                            value={activeConfig.margin} 
                            min={0} 
                            max={50} 
                            suffix="mm" 
                            onChange={(val) => updateConfig('margin', val)} 
                            className="!h-2"
                         />
                         <EZSegmentedControl 
                            label="Fit Mode" 
                            value={activeConfig.fitMode} 
                            options={[{ value: 'contain', label: 'Fit' }, { value: 'cover', label: 'Fill' }, { value: 'fill', label: 'Stretch' }]} 
                            onChange={(val) => updateConfig('fitMode', val)} 
                         />
                      </div>
                  </motion.div>
               </>
             )}
           </AnimatePresence>

           {/* MAIN CANVAS AREA */}
           <div className={`flex-1 relative overflow-hidden ${isMobile ? 'bg-[#FAF9F6]' : 'bg-[#FAF9F6]'}`} ref={canvasRef}>
              <AnimatePresence mode="popLayout">
                 {(images.length === 0 || (isProcessing && images.length === 0)) ? (
                    <UnifiedUploadCard
                        key="upload-card"
                        onUpload={() => fileInputRef.current?.click()}
                        isProcessing={isProcessing}
                        progress={progress}
                        status="Ready to convert"
                        isMobile={isMobile}
                    />
                 ) : isMobile ? (
                   /* MOBILE LIST VIEW */
                   <motion.div key="mobile-list" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full overflow-y-auto custom-scrollbar p-4 pt-32 pb-32">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <SortableContext items={images.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 gap-4">
                              <AnimatePresence mode="popLayout">
                                  {images.map((img, index) => (
                                    <SortableImage 
                                        key={img.id} 
                                        image={img} 
                                        index={index} 
                                        isSelected={selection.has(img.id)}
                                        isActive={previewImageId === img.id}
                                        onSelect={handleSelect}
                                        isMobile={true} 
                                        config={config}
                                        onEnlarge={(id: string) => setEnlargedImageId(id)}
                                    />
                                  ))}
                              </AnimatePresence>
                            </div>
                        </SortableContext>
                      </DndContext>
                   </motion.div>
                 ) : (
                   /* DESKTOP PREVIEW CANVAS */
                   <motion.div key="desktop-canvas" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex items-center justify-center p-16 overflow-auto">
                      <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                      
                      {desktopPreviewImage && pageStyles && (
                        <motion.div 
                            key={desktopPreviewImage.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                width: previewW,
                                height: previewH,
                            }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-2xl bg-white overflow-hidden ring-1 ring-black/5 origin-center pointer-events-auto"
                        >
                            <div 
                              className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white transition-all duration-200"
                              style={{ padding: pageStyles.padding }}
                            >
                                <motion.img 
                                    src={desktopPreviewImage.previewUrl} 
                                    className="w-full h-full pointer-events-none block bg-white" 
                                    animate={{ rotate: desktopPreviewImage.rotation }}
                                    style={{ objectFit: pageStyles.objectFit as any }}
                                    transition={{ duration: 0.3, ease: "backOut" }}
                                    draggable={false}
                                />
                            </div>
                        </motion.div>
                      )}
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* MOBILE BOTTOM CONTROLS */}
           {isMobile && images.length > 0 && !isProcessing && (
             <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
                <LayoutGroup id="mobile-controls">
                    <motion.div 
                        layout 
                        className={`pointer-events-auto flex items-center shadow-2xl overflow-hidden origin-bottom transition-colors duration-300
                        ${(selection.size > 0 || previewImageId)
                            ? 'bg-[#111111] text-white rounded-3xl p-2 gap-3 border border-stone-800' 
                            : 'bg-white/95 border border-stone-200 backdrop-blur-xl rounded-3xl p-2 gap-3'}`}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            {(selection.size > 0 || previewImageId) ? (
                                <motion.div key="mobile-selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-1.5">
                                    <div className="px-4 text-xs font-bold font-mono tracking-wide whitespace-nowrap text-accent-lime">
                                      {selection.size > 0 ? `${selection.size} Selected` : 'Active'}
                                    </div>
                                    <div className="h-5 w-px mx-1 bg-white/20" />
                                    <button onClick={() => handleRotate('left')} className="p-2.5 rounded-2xl hover:bg-white/10"><RotateCcw size={20} /></button>
                                    <button onClick={() => handleRotate('right')} className="p-2.5 rounded-2xl hover:bg-white/10"><RotateCw size={20} /></button>
                                    <div className="h-5 w-px mx-1 bg-white/20" />
                                    <button onClick={() => handleDelete()} className="p-2.5 rounded-2xl hover:bg-white/10 text-rose-400"><Trash2 size={20} /></button>
                                </motion.div>
                            ) : (
                                <motion.div key="mobile-global" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3">
                                    <EZButton variant="tertiary" onClick={() => fileInputRef.current?.click()} icon={<Plus size={20} />} className="!h-12 !rounded-2xl !bg-stone-100 !text-[#111111] !border-transparent">Add</EZButton>
                                    <EZButton variant="primary" onClick={handleGenerate} disabled={isGenerating} isLoading={isGenerating} icon={!isGenerating && <Download size={20} fill="currentColor" />} className="!h-12 !rounded-2xl !text-sm shadow-sm !bg-accent-lime !text-[#111111] !border-[#111111] shadow-stone-200">Export</EZButton>
                                    
                                    <div className="w-px h-6 bg-stone-200 mx-1" />
                                    
                                    <button 
                                        onClick={handleClearAll} 
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-50 text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-transparent transition-colors active:scale-95"
                                    >
                                        <RefreshCw size={22} strokeWidth={2} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </LayoutGroup>
             </div>
           )}
        </div>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeDragItem ? (
                <div className="w-32"><ImageCard image={activeDragItem} isMobile={false} isSelected={selection.has(activeDragItem.id)} isActive={previewImageId===activeDragItem.id} isOverlay config={config} /></div>
            ) : null}
        </DragOverlay>,
        document.body
      )}

      {/* MOBILE ENLARGE OVERLAY */}
      <AnimatePresence>
        {enlargedImageId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1500] bg-black/95 backdrop-blur-xl flex flex-col touch-none"
            onClick={() => setEnlargedImageId(null)}
          >
            <div className="flex items-center justify-between px-6 py-6 z-20 pointer-events-auto bg-gradient-to-b from-black/50 to-transparent">
               <span className="text-white/80 font-mono text-xs tracking-wider font-bold uppercase">Preview</span>
               <button 
                 onClick={(e) => { e.stopPropagation(); setEnlargedImageId(null); }}
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
               <motion.img
                 key={enlargedImageId}
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 400, damping: 30 }}
                 src={images.find(i => i.id === enlargedImageId)?.previewUrl}
                 className="max-w-full max-h-full object-contain shadow-2xl"
                 onClick={(e) => e.stopPropagation()}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
