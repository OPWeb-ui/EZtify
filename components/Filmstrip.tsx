
import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedImage, CropData } from '../types';
import { X, RotateCw, GripHorizontal, Plus, Minus, Hash, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, standardLayoutTransition } from '../utils/animations';

interface FilmstripProps {
  images: UploadedImage[];
  activeImageId: string | null;
  selectedImageIds?: Set<string>;
  onReorder: (newImages: UploadedImage[]) => void;
  onSelect: (id: string, event?: React.MouseEvent) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  isMobile: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  showRemoveButton?: boolean;
  showRotateButton?: boolean;
  isReorderable?: boolean;
}

type ThumbnailSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ThumbnailSize, { width: string; height: string }> = {
  sm: { width: 'w-20', height: 'h-24' },
  md: { width: 'w-28', height: 'h-36' },
  lg: { width: 'w-36', height: 'h-48' },
};

const fullPageCrop: CropData = { x: 0, y: 0, width: 100, height: 100 };
const isEqual = (a: CropData, b: CropData) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

interface SortableItemProps {
  image: UploadedImage;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  onRotate: (e: React.MouseEvent) => void;
  isMobile: boolean;
  sizeClasses: { width: string; height: string };
  direction: 'horizontal' | 'vertical';
  size: ThumbnailSize;
  showRemoveButton: boolean;
  showRotateButton: boolean;
  isReorderable: boolean;
}

const SortableItem: React.FC<SortableItemProps> = React.memo(({ 
  image, 
  index,
  isActive, 
  isSelected, 
  onSelect, 
  onRemove, 
  onRotate, 
  isMobile,
  sizeClasses,
  direction,
  size,
  showRemoveButton,
  showRotateButton,
  isReorderable
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled: !isReorderable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isVertical = direction === 'vertical';

  const crop = image.appliedCrop;
  const isCropped = crop && !isEqual(crop, fullPageCrop);
  
  const imgStyle: React.CSSProperties = {
    transform: `rotate(${image.rotation}deg)`
  };

  if (isCropped) {
    imgStyle.clipPath = `inset(${crop.y.toFixed(2)}% ${(100 - (crop.x + crop.width)).toFixed(2)}% ${(100 - (crop.y + crop.height)).toFixed(2)}% ${crop.x.toFixed(2)}%)`;
  }

  // Keyboard Event Handler for the Item
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Select on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(e as any);
    }
    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRemove(e as any);
    }
    // Navigation (Arrow keys handled by browser focus flow mostly, but we can enhance)
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={standardLayoutTransition}
      className={`relative group flex-shrink-0 select-none ${isVertical ? 'w-full' : ''}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        aria-label={`Select page ${index + 1}`}
        aria-selected={isSelected || isActive}
        className={`
          relative overflow-hidden transition-all duration-200 ease-out cursor-pointer outline-none
          ${isVertical ? 'w-full aspect-[3/4]' : `${sizeClasses.width} ${sizeClasses.height}`}
          rounded-xl
          border-2
          ${isActive 
            ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_0_2px_rgba(124,58,237,0.15)]' 
            : isSelected
              ? 'border-brand-purple/60 bg-brand-purple/5'
              : 'border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-850 hover:border-slate-300 dark:hover:border-charcoal-600'
          }
          ${isDragging ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}
          focus-visible:ring-4 focus-visible:ring-brand-purple/30 focus-visible:border-brand-purple
        `}
      >
        {/* Delete Button (Top Right) - Standardized Placement */}
        {showRemoveButton && (
          <motion.button 
            onClick={onRemove} 
            whileTap={buttonTap}
            // Mobile: Always visible if selected/active or just ensure large target. Desktop: Hover/Focus
            className={`
              absolute top-1.5 right-1.5 z-30 
              flex items-center justify-center 
              w-7 h-7 rounded-full 
              bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm 
              text-charcoal-400 dark:text-slate-400 
              border border-slate-200 dark:border-charcoal-600 
              shadow-sm
              hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20
              transition-all duration-200
              focus:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-rose-500
              ${isMobile ? (isSelected || isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none') : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100'}
            `}
            title="Remove Item"
            tabIndex={0} 
          >
            <X size={14} strokeWidth={2.5} />
          </motion.button>
        )}

        {/* Index Badge */}
        <div className={`
          absolute top-0 left-0 z-20 
          flex items-center gap-1
          bg-slate-50/90 dark:bg-charcoal-800/90 backdrop-blur-[2px]
          px-1.5 py-0.5 border-b border-r 
          ${isActive ? 'border-brand-purple/20' : 'border-slate-200 dark:border-charcoal-700'}
          rounded-br-lg
        `}>
          <span className={`text-[9px] font-mono font-bold leading-none ${isActive ? 'text-brand-purple' : 'text-charcoal-500 dark:text-slate-500'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Image Area */}
        <div className="w-full h-full p-3 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
               style={{ 
                 backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', 
                 backgroundSize: '12px 12px', 
                 backgroundPosition: '0 0, 6px 6px' 
               }} 
          />
          
          <img
            src={image.previewUrl}
            alt={`Frame ${index + 1}`}
            className="max-w-full max-h-full object-contain relative z-10 shadow-sm transition-all duration-300"
            style={imgStyle}
            draggable={false}
          />
        </div>

        {/* Bottom Actions Overlay */}
        {(showRotateButton || isReorderable) && (
          <div className={`
             absolute bottom-0 left-0 right-0 flex items-center justify-between p-1.5 
             bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md 
             border-t border-slate-200 dark:border-charcoal-700 
             transition-transform duration-200 ease-out z-30
             ${isMobile ? (isSelected || isActive ? 'translate-y-0' : 'translate-y-full') : 'translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0'}
          `}>
             
             {isReorderable ? (
               <div 
                 {...attributes} 
                 {...listeners}
                 className="p-1 rounded hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-400 dark:text-slate-500 cursor-grab active:cursor-grabbing outline-none"
                 title="Drag to Reorder"
                 tabIndex={-1} 
               >
                 <GripHorizontal size={14} />
               </div>
             ) : <div />}

             <div className="flex items-center gap-1">
               {showRotateButton && (
                  <motion.button 
                    onClick={onRotate} 
                    whileTap={buttonTap} 
                    className="p-1 rounded hover:bg-brand-purple/10 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple transition-colors outline-none focus-visible:bg-brand-purple/10" 
                    title="Rotate"
                    tabIndex={0}
                  >
                    <RotateCw size={14} />
                  </motion.button>
               )}
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const Filmstrip: React.FC<FilmstripProps> = ({
  images,
  activeImageId,
  selectedImageIds = new Set(),
  onReorder,
  onSelect,
  onRemove,
  onRotate,
  isMobile,
  className = '',
  direction = 'horizontal',
  showRemoveButton = true,
  showRotateButton = true,
  isReorderable = true,
}) => {
  const [size, setSize] = useState<ThumbnailSize>(isMobile ? 'md' : 'sm');

  const handleZoomIn = () => {
    if (size === 'sm') setSize('md');
    else if (size === 'md') setSize('lg');
  };

  const handleZoomOut = () => {
    if (size === 'lg') setSize('md');
    else if (size === 'md') setSize('sm');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onReorder(arrayMove(images, oldIndex, newIndex));
    }
  };

  const currentSizeClasses = SIZES[size];
  const isVertical = direction === 'vertical';
  const dndStrategy = isVertical ? rectSortingStrategy : horizontalListSortingStrategy;
  
  const gridCols = size === 'sm' 
    ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' 
    : size === 'md' 
      ? 'grid-cols-2 md:grid-cols-3' 
      : 'grid-cols-1 md:grid-cols-2';
  
  const containerClasses = isVertical
    ? `grid ${gridCols} gap-3 p-3 content-start w-full`
    : 'flex flex-row items-center gap-3 px-4 py-4 overflow-x-auto custom-scrollbar max-w-full bg-slate-50/30 dark:bg-charcoal-900/30';

  return (
    <div className={`w-full h-full relative flex flex-col group/filmstrip ${className}`}>
      
      {/* Zoom Controls (Desktop only) */}
      {!isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            absolute z-40 flex items-center bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg shadow-sm
            ${isVertical ? 'top-3 right-3' : 'bottom-full mb-3 right-4'}
          `}
        >
          <div className="flex items-center gap-px p-0.5">
            <button 
              onClick={handleZoomOut} 
              disabled={size === 'sm'} 
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <Minus size={12} />
            </button>
            <div className="px-2 min-w-[32px] text-center">
              <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-slate-400 uppercase tracking-wider">
                {size}
              </span>
            </div>
            <button 
              onClick={handleZoomIn} 
              disabled={size === 'lg'} 
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded-md text-charcoal-500 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <Plus size={12} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Info Bar */}
      {!isMobile && isVertical && (
         <div className="px-3 py-2 border-b border-slate-200 dark:border-charcoal-800 flex items-center gap-2 text-xs text-charcoal-500 font-mono">
            <ImageIcon size={12} />
            <span className="uppercase tracking-wide">Frames: {images.length}</span>
         </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 relative">
          {images.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-400 opacity-50">
                <Hash size={24} className="mb-2" />
                <span className="text-[10px] font-mono uppercase tracking-widest">No Frames</span>
             </div>
          )}

          <SortableContext items={images.map(img => img.id)} strategy={dndStrategy}>
            <div className={containerClasses} role="list" aria-label="Pages list">
              <AnimatePresence mode="popLayout" initial={false}>
                {images.map((img, idx) => (
                  <SortableItem
                    key={img.id}
                    image={img}
                    index={idx}
                    isActive={img.id === activeImageId}
                    isSelected={selectedImageIds?.has(img.id) ?? false}
                    onSelect={(e) => onSelect(img.id, e)}
                    onRemove={(e) => { e.stopPropagation(); onRemove(img.id); }}
                    onRotate={(e) => { e.stopPropagation(); onRotate(img.id); }}
                    isMobile={isMobile}
                    sizeClasses={currentSizeClasses}
                    direction={direction}
                    size={size}
                    showRemoveButton={showRemoveButton}
                    showRotateButton={showRotateButton}
                    isReorderable={isReorderable}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};
