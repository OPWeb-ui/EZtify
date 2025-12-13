
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PdfFile } from '../types';
import { FileText, GripVertical, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';

interface MergeFileListProps {
  files: PdfFile[];
  onReorder: (newFiles: PdfFile[]) => void;
  onRemove: (id: string) => void;
}

const SortableItem: React.FC<{ file: PdfFile; onRemove: () => void }> = ({ file, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    // We allow scrolling (touchAction auto) until the long-press activates the drag
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isDragging ? 1.03 : 1,
        boxShadow: isDragging 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        zIndex: isDragging ? 50 : 0
      }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ 
         type: "spring", 
         stiffness: 400, 
         damping: 25,
         layout: { duration: 0.3 }
      }}
      className={`
        relative flex items-center gap-4 p-3 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700
        ${isDragging ? 'border-brand-purple ring-2 ring-brand-purple/20' : 'hover:border-brand-purple/30'}
        mb-3 origin-center cursor-grab active:cursor-grabbing select-none group
      `}
    >
      <div className="text-charcoal-400 dark:text-slate-500">
        <GripVertical size={20} />
      </div>

      <div className="w-12 h-16 bg-slate-100 dark:bg-charcoal-700 rounded-lg overflow-hidden flex-shrink-0 relative shadow-inner border border-slate-200 dark:border-charcoal-600 flex items-center justify-center">
         <AnimatePresence mode="wait">
            {file.previewUrl ? (
               <motion.img 
                  key="thumb"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={file.previewUrl} 
                  alt="preview" 
                  className="w-full h-full object-cover" 
               />
            ) : (
               <motion.div 
                  key="icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-400"
               >
                  <Loader2 size={16} className="animate-spin" />
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-charcoal-800 dark:text-slate-200 truncate">{file.file.name}</h4>
        <p className="text-xs text-charcoal-500 dark:text-slate-500 font-mono">{(file.file.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-2 text-charcoal-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors cursor-pointer"
      >
        <X size={18} />
      </motion.button>
    </motion.div>
  );
};

export const MergeFileList: React.FC<MergeFileListProps> = ({ files, onReorder, onRemove }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { 
      activationConstraint: { 
        distance: 8 
      } 
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press (250ms) to start drag on touch
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(files, oldIndex, newIndex));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-bold text-charcoal-500 dark:text-slate-500 uppercase tracking-wider">Merge Order</h3>
        <span className="text-xs font-bold bg-brand-purple/10 text-brand-purple px-2 py-1 rounded-full">
          {files.length} Files
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode='popLayout' initial={false}>
            {files.map((file) => (
              <SortableItem key={file.id} file={file} onRemove={() => onRemove(file.id)} />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  );
};
