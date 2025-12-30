
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
import { X, RotateCw, GripHorizontal, Hash, Image as ImageIcon, Trash2, GripVertical } from 'lucide-react';
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

  // Consistent sizing logic
  const widthClass = isVertical ? 'w-full' : isCompact ? 'w-24' : 'w-36';
  const aspectRatioClass = 'aspect-[3/4]'; // Fixed aspect ratio for consistency

  return (
    <div 
      className={`relative group flex-shrink-0 select-none ${isVertical ? 'mb-3 last:mb-0' : 'mr-3 last:mr-0'} ${widthClass}`}
    >
      <div
        role="button"
        tabIndex={isOverlay ? -1 : 0}
        onClick={onSelect}
        className={`
          relative overflow-hidden transition-all duration-200 ease-out cursor-pointer outline-none
          ${aspectRatioClass}
          rounded-xl
          border
          ${isOverlay 
             ? 'border-orange-500 shadow-2xl scale-105 z-50 bg-white dark:bg-charcoal-800' 
             : isDragging 
                ? 'opacity-30 grayscale border-dashed border-slate-300 dark:border-charcoal-600' 
                : isActive 
                  ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white dark:bg-charcoal-800 shadow-md transform scale-[1.02]' 
                  : isSelected
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
                    : 'border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-slate-300 dark:hover:border-charcoal-600 hover:shadow-sm'
          }
        `}
      >
        {/* Drag Handle (Hover Only) */}
        {isReorderable && !isDragging && !isMobile && (
          <div 
            {...dragAttributes} 
            {...dragListeners}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 p-1.5 text-charcoal-300 dark:text-charcoal-600 opacity-0 group-hover:opacity-100 hover:text-charcoal-500 cursor-grab active:cursor-grabbing transition-opacity"
          >
            <GripHorizontal size={16} />
          </div>
        )}

        {/* Index Badge - Subtle */}
        {index !== undefined && (
          <div className="absolute top-2 left-2 z-20">
             <div className={`
               h-5 min-w-[20px] px-1 flex items-center justify-center rounded-md text-[9px] font-mono font-bold
               ${isActive 
                 ? 'bg-orange-500 text-white shadow-sm' 
                 : 'bg-charcoal-900/80 text-white backdrop-blur-sm'}
             `}>
               {String(index + 1)}
             </div>
          </div>
        )}

        {/* Delete Button (Hover) */}
        {showRemoveButton && !isDragging && (
          <motion.button 
            whileTap={buttonTap}
            onClick={onRemove} 
            className="
              absolute top-2 right-2 z-30 
              w-7 h-7 flex items-center justify-center
              bg-white/90 dark:bg-charcoal-800/90 
              text-charcoal-400 hover:text-rose-500 
              rounded-lg opacity-0 group-hover:opacity-100 transition-opacity 
              shadow-sm border border-slate-100 dark:border-charcoal-600
            "
          >
            <X size={14} />
          </motion.button>
        )}

        {/* Image Container */}
        <div className="w-full h-full p-4 flex items-center justify-center relative">
          {/* Radial Dot Pattern for consistency with other tools */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
                 backgroundSize: '8px 8px'
               }} 
          />
          <motion.img
            src={image.previewUrl}
            alt={`Frame ${index !== undefined ? index + 1 : ''}`}
            className="max-w-full max-h-full object-contain relative z-10 shadow-sm transition-transform duration-300 bg-white"
            animate={{
              rotate: image.rotation,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            draggable={false}
          />
        </div>

        {/* Quick Rotate Action (Hover) */}
        {showRotateButton && !isDragging && (
          <div className="absolute bottom-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
             <motion.button 
               whileTap={buttonTap}
               onClick={onRotate} 
               className="
                 w-7 h-7 flex items-center justify-center
                 bg-white/90 dark:bg-charcoal-800/90 
                 text-charcoal-500 hover:text-orange-500 
                 rounded-lg shadow-sm border border-slate-100 dark:border-charcoal-600
               "
             >
               <RotateCw size={14} />
             </motion.button>
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

  // Force compact mode for horizontal strip on desktop to keep it slim
  const isCompact = images.length > 10 || (direction === 'horizontal' && !isMobile);
  const isVertical = direction === 'vertical';
  const dndStrategy = isVertical ? verticalListSortingStrategy : horizontalListSortingStrategy;

  const containerClasses = isMobile
    ? 'grid grid-cols-2 landscape:grid-cols-3 gap-3 p-4 w-full content-start' 
    : isVertical
      ? 'flex flex-col w-full px-1 pb-4' 
      : 'flex flex-row items-center gap-3 px-4 py-3 overflow-x-auto custom-scrollbar max-w-full';

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
                <IconBox icon={<ImageIcon />} size="lg" variant="transparent" />
                <span className="text-[10px] font-mono uppercase tracking-widest mt-2">No Content</span>
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
