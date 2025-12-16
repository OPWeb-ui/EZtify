
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedImage, CropData } from '../types';
import { X, RotateCw, GripHorizontal, Hash, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, standardLayoutTransition } from '../utils/animations';
import { IconBox } from './IconBox';

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
  size?: 'sm' | 'md' | 'lg';
}

const fullPageCrop: CropData = { x: 0, y: 0, width: 100, height: 100 };
const isEqual = (a: CropData, b: CropData) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

// --- Visual Item Component ---
interface FilmstripItemProps {
  image: UploadedImage;
  index?: number;
  isActive?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  isMobile: boolean;
  direction: 'horizontal' | 'vertical';
  showRemoveButton: boolean;
  showRotateButton: boolean;
  isReorderable: boolean;
  isCompact: boolean;
  dragListeners?: any;
  dragAttributes?: any;
}

const FilmstripItem: React.FC<FilmstripItemProps> = React.memo(({ 
  image, 
  index,
  isActive, 
  isSelected, 
  isDragging,
  isOverlay,
  onSelect, 
  onRemove, 
  onRotate, 
  isMobile,
  direction,
  showRemoveButton,
  showRotateButton,
  isReorderable,
  isCompact,
  dragListeners,
  dragAttributes
}) => {
  const isVertical = direction === 'vertical';
  const crop = image.appliedCrop;
  const isCropped = crop && !isEqual(crop, fullPageCrop);
  
  const imgStyle: React.CSSProperties = {
    transform: `rotate(${image.rotation}deg)`
  };

  if (isCropped) {
    (imgStyle as any).clipPath = `inset(${crop.y.toFixed(2)}% ${(100 - (crop.x + crop.width)).toFixed(2)}% ${(100 - (crop.y + crop.height)).toFixed(2)}% ${crop.x.toFixed(2)}%)`;
  }

  const verticalDims = 'w-full aspect-square';
  const horizontalDims = isCompact ? 'w-24 h-32' : 'w-36 h-48';
  
  const sizingClass = isMobile 
    ? 'w-full aspect-[3/4]' 
    : isVertical 
      ? verticalDims 
      : horizontalDims;

  return (
    <div className={`relative group flex-shrink-0 select-none ${isVertical ? 'w-full mb-3' : 'mr-3 last:mr-0'}`}>
      <div
        role="button"
        tabIndex={isOverlay ? -1 : 0}
        onClick={onSelect}
        className={`
          relative overflow-hidden transition-all duration-200 ease-out cursor-pointer outline-none
          ${sizingClass}
          rounded-2xl
          border
          ${isOverlay 
             ? 'border-brand-purple shadow-2xl scale-105 z-50 bg-white dark:bg-charcoal-800' 
             : isDragging 
                ? 'opacity-30 grayscale border-dashed border-slate-300 dark:border-charcoal-600' 
                : isActive 
                  ? 'border-brand-purple ring-1 ring-brand-purple/20 bg-slate-50 dark:bg-charcoal-800 shadow-md' 
                  : isSelected
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-slate-300 dark:hover:border-charcoal-600'
          }
        `}
      >
        {/* Delete Button - Using IconBox logic (Strict Square) */}
        {showRemoveButton && !isDragging && (
          <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
             <motion.button 
               onClick={onRemove} 
               whileTap={buttonTap}
               className="bg-white dark:bg-charcoal-800 text-charcoal-400 hover:text-rose-500 border border-slate-200 dark:border-charcoal-600 hover:border-rose-200 dark:hover:border-rose-900 rounded-lg p-1.5 shadow-sm transition-colors"
             >
               <X size={14} />
             </motion.button>
          </div>
        )}

        {/* Index Badge (Strict Tag) */}
        {index !== undefined && (
          <div className="absolute top-2 left-2 z-20">
             <div className={`
               h-6 px-2 flex items-center justify-center rounded-lg text-[10px] font-mono font-bold
               ${isActive 
                 ? 'bg-brand-purple text-white shadow-sm' 
                 : 'bg-slate-100 dark:bg-charcoal-700 text-charcoal-500 dark:text-charcoal-400 border border-slate-200 dark:border-charcoal-600'}
             `}>
               {String(index + 1).padStart(2, '0')}
             </div>
          </div>
        )}

        {/* Image Area */}
        <div className="w-full h-full p-4 flex items-center justify-center relative">
          {!isDragging && (
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                  style={{ 
                    backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', 
                    backgroundSize: '12px 12px', 
                    backgroundPosition: '0 0, 6px 6px' 
                  }} 
             />
          )}
          
          <img
            src={image.previewUrl}
            alt={`Frame ${index !== undefined ? index + 1 : ''}`}
            className="max-w-full max-h-full object-contain relative z-10 shadow-sm transition-all duration-300"
            style={imgStyle}
            draggable={false}
          />
        </div>

        {/* Bottom Actions Overlay (Strict Rectangular Bar) */}
        {(showRotateButton || isReorderable) && !isDragging && (
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
             <div className="flex items-center justify-center gap-2 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-charcoal-700 p-1 shadow-sm">
                {isReorderable && (
                  <div 
                    {...dragAttributes} 
                    {...dragListeners}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-400 cursor-grab active:cursor-grabbing"
                  >
                    <GripHorizontal size={14} />
                  </div>
                )}
                {showRotateButton && (
                   <motion.button 
                     onClick={onRotate} 
                     whileTap={buttonTap} 
                     className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-brand-purple transition-colors"
                   >
                     <RotateCw size={14} />
                   </motion.button>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
});

// --- Sortable Wrapper ---
interface SortableItemProps extends Omit<FilmstripItemProps, 'dragListeners' | 'dragAttributes' | 'isDragging'> {
  id: string;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !props.isReorderable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isDragging} 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={standardLayoutTransition}
      className={props.isMobile || props.direction === 'vertical' ? 'w-full' : ''}
    >
      <FilmstripItem 
        {...props} 
        isDragging={isDragging} 
        dragListeners={listeners} 
        dragAttributes={attributes} 
      />
    </motion.div>
  );
};

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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onReorder(arrayMove(images, oldIndex, newIndex));
    }
    setActiveDragId(null);
  };

  const isCompact = images.length > 10;
  const isVertical = direction === 'vertical';
  const dndStrategy = isVertical ? verticalListSortingStrategy : horizontalListSortingStrategy;

  const containerClasses = isMobile
    ? 'grid grid-cols-2 landscape:grid-cols-3 gap-3 p-3 w-full content-start' 
    : isVertical
      ? 'flex flex-col w-full' 
      : 'flex flex-row items-center gap-3 px-4 py-4 overflow-x-auto custom-scrollbar max-w-full bg-slate-50/30 dark:bg-charcoal-900/30';

  const activeItem = activeDragId ? images.find(i => i.id === activeDragId) : null;

  return (
    <div className={`w-full h-full relative flex flex-col group/filmstrip ${className}`}>
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 relative">
          {images.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-400 opacity-50">
                <IconBox icon={<Hash />} size="lg" variant="transparent" />
                <span className="text-[10px] font-mono uppercase tracking-widest mt-2">No Frames</span>
             </div>
          )}

          <SortableContext items={images.map(img => img.id)} strategy={dndStrategy}>
            <div className={containerClasses} role="list">
              <AnimatePresence mode="popLayout" initial={false}>
                {images.map((img, idx) => (
                  <SortableItem
                    key={img.id}
                    id={img.id}
                    image={img}
                    index={idx}
                    isActive={img.id === activeImageId}
                    isSelected={selectedImageIds?.has(img.id) ?? false}
                    onSelect={(e) => onSelect(img.id, e)}
                    onRemove={(e) => { e.stopPropagation(); onRemove(img.id); }}
                    onRotate={(e) => { e.stopPropagation(); onRotate(img.id); }}
                    isMobile={isMobile}
                    direction={direction}
                    showRemoveButton={showRemoveButton}
                    showRotateButton={showRotateButton}
                    isReorderable={isReorderable}
                    isCompact={isCompact}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
          
          <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })}>
            {activeItem ? (
                <FilmstripItem
                    image={activeItem}
                    index={images.findIndex(i => i.id === activeDragId)}
                    isOverlay
                    isCompact={isCompact}
                    direction={direction}
                    isMobile={isMobile}
                    showRemoveButton={showRemoveButton}
                    showRotateButton={showRotateButton}
                    isReorderable={isReorderable}
                />
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  );
};
