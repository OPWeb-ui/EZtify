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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { PdfPage } from '../types';
import { Check, Trash2, ArrowLeftRight, SquareCheck, SquareX } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface SplitPageGridProps {
  pages: PdfPage[];
  onTogglePage: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onRemovePage: (id: string) => void;
  onRemoveSelected: () => void;
  onReorder: (newPages: PdfPage[]) => void;
}

interface SortablePageProps {
  page: PdfPage;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const SortablePage: React.FC<SortablePageProps> = ({ page, onToggle, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onToggle(page.id)}
      className={`
        relative aspect-[3/4] cursor-grab active:cursor-grabbing rounded-xl overflow-hidden shadow-sm transition-shadow duration-200 group bg-white dark:bg-charcoal-800
        ${page.selected 
          ? 'ring-4 ring-brand-purple shadow-lg shadow-brand-purple/20' 
          : 'ring-1 ring-slate-200 dark:ring-charcoal-700 hover:ring-brand-mint/50'}
        ${isDragging ? 'z-50 ring-brand-purple' : ''}
      `}
    >
      {/* Delete Button - Top Right */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
           e.stopPropagation();
           onRemove(page.id);
        }}
        className={`
          absolute top-2 right-2 z-30 p-1.5 rounded-full 
          bg-white/90 dark:bg-charcoal-800/90 border border-slate-100 dark:border-charcoal-600
          text-charcoal-400 dark:text-slate-400 shadow-sm transition-all opacity-0 group-hover:opacity-100
          hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800
        `}
        title="Remove Page"
      >
        <Trash2 size={14} />
      </motion.button>

      {/* Image */}
      <img 
        src={page.previewUrl} 
        alt={`Page ${page.pageIndex + 1}`}
        className={`
          w-full h-full object-contain bg-white transition-opacity select-none pointer-events-none
          ${page.selected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}
        `}
      />

      {/* Page Number Badge */}
      <div className="absolute bottom-2 left-2 z-10">
         <span className="bg-charcoal-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
           {page.pageIndex + 1}
         </span>
      </div>

      {/* Selection Overlay */}
      <div 
        className={`
          absolute inset-0 transition-colors duration-200 flex items-center justify-center
          ${page.selected ? 'bg-brand-purple/20' : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}
        `}
      >
        {page.selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-md"
          >
            <Check size={18} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export const SplitPageGrid: React.FC<SplitPageGridProps> = ({ 
  pages, 
  onTogglePage,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onRemovePage,
  onRemoveSelected,
  onReorder
}) => {
  
  const safePages = pages || [];
  const selectedCount = safePages.filter(p => p.selected).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require movement of 8px to start drag (allows clicking)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = safePages.findIndex((p) => p.id === active.id);
      const newIndex = safePages.findIndex((p) => p.id === over.id);
      if (oldIndex > -1 && newIndex > -1) {
        onReorder(arrayMove(safePages, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="w-full">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 px-2 gap-4">
        <div className="text-sm font-bold text-charcoal-600 dark:text-slate-300">
          <span className="bg-brand-mint/10 text-brand-mint px-2 py-1 rounded-md mr-2">
            {safePages.length} Pages
          </span>
          <span className="text-charcoal-400 dark:text-slate-500 text-xs ml-2">
            ({selectedCount} selected)
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs md:text-sm font-medium">
          <motion.button 
            onClick={onSelectAll}
            whileTap={buttonTap}
            className="flex items-center gap-1.5 text-brand-purple hover:text-brand-purpleDark hover:bg-brand-purple/5 px-3 py-1.5 rounded-lg transition-colors"
            title="Select All"
          >
            <SquareCheck size={14} /> All
          </motion.button>
          
          <motion.button 
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            whileTap={buttonTap}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors
              ${selectedCount > 0 
                ? 'text-charcoal-500 hover:text-charcoal-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800' 
                : 'text-charcoal-300 dark:text-charcoal-600 cursor-not-allowed'}
            `}
            title="Deselect All"
          >
            <SquareX size={14} /> None
          </motion.button>

          <motion.button 
            onClick={onInvertSelection}
            whileTap={buttonTap}
            className="flex items-center gap-1.5 text-charcoal-500 hover:text-charcoal-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 px-3 py-1.5 rounded-lg transition-colors"
            title="Invert Selection"
          >
            <ArrowLeftRight size={14} /> Invert
          </motion.button>

          {selectedCount > 0 && (
             <motion.button 
               onClick={onRemoveSelected}
               whileTap={buttonTap}
               className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors ml-2 border border-rose-100 dark:border-rose-900/30"
               title="Remove Selected Pages"
             >
               <Trash2 size={14} /> Remove Selected
             </motion.button>
          )}
        </div>
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={safePages.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
            {safePages.map((page) => (
              <SortablePage
                key={page.id}
                page={page}
                onToggle={onTogglePage}
                onRemove={onRemovePage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};