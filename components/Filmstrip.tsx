import React, { useState, useEffect } from 'react';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedImage } from '../types';
import { X, RotateCw, GripHorizontal, GripVertical, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';

interface FilmstripProps {
  images: UploadedImage[];
  activeImageId: string | null;
  selectedImageIds?: Set<string>;
  onReorder: (newImages: UploadedImage[]) => void;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  isMobile: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

type ThumbnailSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ThumbnailSize, { width: string; height: string }> = {
  sm: { width: 'w-20', height: 'h-24' }, // Mobile: ~80px x 96px
  md: { width: 'w-28', height: 'h-36' }, // Desktop: ~112px x 144px
  lg: { width: 'w-36', height: 'h-48' }, // Large: ~144px x 192px
};

interface SortableItemProps {
  image: UploadedImage;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  onRotate: (e: React.MouseEvent) => void;
  isMobile: boolean;
  sizeClasses: { width: string; height: string };
  direction: 'horizontal' | 'vertical';
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  image, 
  isActive, 
  isSelected, 
  onSelect, 
  onRemove, 
  onRotate, 
  isMobile,
  sizeClasses,
  direction
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isVertical = direction === 'vertical';

  const actionBtnClass = `
    w-7 h-7 flex items-center justify-center rounded-lg shadow-sm border transition-colors duration-200
    bg-white/95 dark:bg-charcoal-900/95 border-slate-200 dark:border-charcoal-600 text-charcoal-600 dark:text-slate-300
    hover:scale-110 active:scale-95
  `;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onSelect}
      className={`
        relative group flex-shrink-0 cursor-pointer select-none
        ${isVertical ? 'w-full rounded-lg' : `${sizeClasses.width} ${sizeClasses.height} rounded-xl`}
        overflow-hidden border-2 transition-all duration-200
        ${isActive 
          ? 'border-brand-purple ring-4 ring-brand-purple/10 scale-105 shadow-xl shadow-brand-purple/10 z-10' 
          : isSelected
            ? 'border-brand-purple/60 ring-2 ring-brand-purple/5 bg-brand-purple/5 shadow-md'
            : 'border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/40 shadow-sm hover:shadow-md'
        }
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        bg-white dark:bg-charcoal-800
      `}
    >
      <img
        src={image.previewUrl}
        alt="Thumbnail"
        className={`w-full h-full object-cover transition-opacity ${isSelected && !isActive ? 'opacity-80' : 'opacity-100'}`}
        style={{ transform: `rotate(${image.rotation}deg)`, aspectRatio: isVertical ? '4/3' : 'auto' }}
      />

      <div className={`absolute inset-0 ring-1 ring-inset pointer-events-none ${isSelected ? 'ring-brand-purple/30' : 'ring-black/5 dark:ring-white/5'}`} />
      
      {isSelected && (
        <div className="absolute top-1 left-1 z-20 w-4 h-4 bg-brand-purple text-white rounded-full flex items-center justify-center shadow-sm">
          <Check size={10} strokeWidth={3} />
        </div>
      )}

      <div className={`absolute top-1 right-1 z-20 flex flex-col gap-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <motion.button onClick={onRemove} whileTap={buttonTap} className={`${actionBtnClass} hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200`} title="Remove">
          <X size={14} />
        </motion.button>
        <motion.button onClick={onRotate} whileTap={buttonTap} className={`${actionBtnClass} hover:bg-brand-purple/10 hover:text-brand-purple hover:border-brand-purple/30`} title="Rotate">
          <RotateCw size={14} />
        </motion.button>
      </div>
      
      <div 
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={`
          absolute bottom-1 z-20 w-8 h-4 flex items-center justify-center 
          bg-white/90 dark:bg-charcoal-800/90 rounded-full shadow-sm border border-slate-200 dark:border-charcoal-600 
          cursor-grab active:cursor-grabbing hover:bg-brand-purple hover:text-white 
          text-charcoal-400 dark:text-slate-400 transition-colors 
          ${isVertical ? 'left-1' : 'left-1/2 -translate-x-1/2'}
          ${isMobile || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        title="Drag to reorder"
      >
        {isVertical ? <GripVertical size={12} /> : <GripHorizontal size={12} />}
      </div>
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
  direction = 'horizontal'
}) => {
  const [size, setSize] = useState<ThumbnailSize>(isMobile ? 'sm' : 'md');

  useEffect(() => {
    setSize(isMobile ? 'sm' : 'md');
  }, [isMobile]);

  const handleZoomIn = () => {
    if (size === 'sm') setSize('md');
    else if (size === 'md') setSize('lg');
  };

  const handleZoomOut = () => {
    if (size === 'lg') setSize('md');
    else if (size === 'md') setSize('sm');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
  const dndStrategy = isVertical ? verticalListSortingStrategy : horizontalListSortingStrategy;
  const containerClasses = isVertical
    ? 'flex flex-col gap-3 p-4 overflow-y-auto custom-scrollbar h-full'
    : 'flex flex-row items-center gap-3 px-6 py-4 overflow-x-auto custom-scrollbar max-w-full';

  return (
    <div className={`w-full h-full relative group/filmstrip ${className}`}>
      
      {!isVertical && (
        <div className="absolute top-1 right-6 z-40 flex items-center gap-1 bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md rounded-lg border border-slate-200 dark:border-charcoal-600 p-1 shadow-sm opacity-0 group-hover/filmstrip:opacity-100 transition-opacity duration-200">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleZoomOut} disabled={size === 'sm'} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 rounded disabled:opacity-30 disabled:hover:bg-transparent" title="Smaller Thumbnails">
            <Minus size={14}/>
          </motion.button>
          <span className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 w-4 text-center select-none">
            {size === 'sm' ? 'S' : size === 'md' ? 'M' : 'L'}
          </span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleZoomIn} disabled={size === 'lg'} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 rounded disabled:opacity-30 disabled:hover:bg-transparent" title="Larger Thumbnails">
            <Plus size={14}/>
          </motion.button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images.map(img => img.id)} strategy={dndStrategy}>
          <div className={containerClasses}>
            <AnimatePresence mode="popLayout" initial={false}>
              {images.map((img) => (
                <SortableItem
                  key={img.id}
                  image={img}
                  isActive={img.id === activeImageId}
                  isSelected={selectedImageIds.has(img.id)}
                  onSelect={(e) => onSelect(img.id, e)}
                  onRemove={(e) => { e.stopPropagation(); onRemove(img.id); }}
                  onRotate={(e) => { e.stopPropagation(); onRotate(img.id); }}
                  isMobile={isMobile}
                  sizeClasses={currentSizeClasses}
                  direction={direction}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};