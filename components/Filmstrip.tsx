import React from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedImage } from '../types';
import { X, RotateCw, GripHorizontal, Check } from 'lucide-react';
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
}

interface SortableItemProps {
  image: UploadedImage;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  onRotate: (e: React.MouseEvent) => void;
  isMobile: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  image, 
  isActive, 
  isSelected, 
  onSelect, 
  onRemove, 
  onRotate, 
  isMobile 
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

  const width = isMobile ? 'w-16' : 'w-20';
  const height = isMobile ? 'h-20' : 'h-28';

  // Standard Action Button Class for Thumbnails
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
      initial={{ opacity: 0, scale: 0.5, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: 'auto' }}
      exit={{ opacity: 0, scale: 0.5, width: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onSelect}
      className={`
        relative group flex-shrink-0 cursor-pointer select-none
        ${width} ${height} rounded-xl overflow-hidden border-2 transition-all duration-200
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
        style={{ transform: `rotate(${image.rotation}deg)` }}
      />

      {/* Subtle Outline Overlay */}
      <div className={`absolute inset-0 ring-1 ring-inset pointer-events-none ${isSelected ? 'ring-brand-purple/30' : 'ring-black/5 dark:ring-white/5'}`} />
      
      {/* Selection Check */}
      {isSelected && (
        <div className="absolute top-1 left-1 z-20 w-4 h-4 bg-brand-purple text-white rounded-full flex items-center justify-center shadow-sm">
          <Check size={10} strokeWidth={3} />
        </div>
      )}

      {/* Quick Actions (Remove & Rotate) - Stacked Vertically Top-Right */}
      <div className={`absolute top-1 right-1 z-20 flex flex-col gap-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <motion.button
          onClick={onRemove}
          whileTap={buttonTap}
          className={`${actionBtnClass} hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200`}
          title="Remove"
        >
          <X size={14} />
        </motion.button>
        <motion.button
          onClick={onRotate}
          whileTap={buttonTap}
          className={`${actionBtnClass} hover:bg-brand-purple/10 hover:text-brand-purple hover:border-brand-purple/30`}
          title="Rotate"
        >
          <RotateCw size={14} />
        </motion.button>
      </div>
      
      {/* Visible Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className={`
          absolute bottom-1 left-1/2 -translate-x-1/2 z-20 w-8 h-4 flex items-center justify-center 
          bg-white/90 dark:bg-charcoal-800/90 rounded-full shadow-sm border border-slate-200 dark:border-charcoal-600 
          cursor-grab active:cursor-grabbing hover:bg-brand-purple hover:text-white 
          text-charcoal-400 dark:text-slate-400 transition-colors 
          ${isMobile || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        title="Drag to reorder"
      >
        <GripHorizontal size={12} />
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
  className = ''
}) => {
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

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map(img => img.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 flex-row items-center px-6 py-4 overflow-x-auto custom-scrollbar max-w-full min-h-[120px]">
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
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};