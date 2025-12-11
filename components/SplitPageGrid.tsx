

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { PdfPage, PageNumberConfig } from '../types';
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
  useVisualIndexing?: boolean;
  numberingConfig?: PageNumberConfig;
  isReorderDisabled?: boolean;
  onRotate?: (id: string) => void;
  showBadges?: boolean;
}

interface PageCardProps {
  page: PdfPage;
  index: number;
  useVisualIndexing?: boolean;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
  numberingConfig?: PageNumberConfig;
  showBadges?: boolean;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const PageCard: React.FC<PageCardProps> = ({ 
  page, 
  index, 
  useVisualIndexing, 
  onToggle, 
  onRemove, 
  isOverlay, 
  isDragging,
  numberingConfig,
  showBadges = true
}) => {
  // Numbering Preview Logic
  const getNumberPreviewStyle = () => {
    if (!numberingConfig) return null;
    let styles: React.CSSProperties = { position: 'absolute', transform: '' };
    const { position, alignment, fontSize, fontFamily, offsetX, offsetY } = numberingConfig;

    // Base vertical position
    if (position === 'top') styles.top = `calc(8% + ${offsetY}px)`;
    else styles.bottom = `calc(8% - ${offsetY}px)`;

    // Base horizontal position and transform
    let xTransform = '';
    if (alignment === 'left') styles.left = `calc(8% + ${offsetX}px)`;
    else if (alignment === 'right') styles.right = `calc(8% - ${offsetX}px)`;
    else {
      styles.left = '50%';
      xTransform = `translateX(calc(-50% + ${offsetX}px))`;
    }

    styles.transform = xTransform.trim();
    styles.fontSize = `${fontSize * 0.75}px`; // Scale down slightly for thumbnail preview

    // Map font family for preview
    const genericFontMap: { [key: string]: string } = {
      'Helvetica': 'sans-serif', 'Times-Roman': 'serif', 'Courier': 'monospace',
    };
    const baseFont = fontFamily.split('-')[0];
    styles.fontFamily = genericFontMap[baseFont] || 'sans-serif';
    if (fontFamily.includes('Bold')) styles.fontWeight = 'bold';
    if (fontFamily.includes('Oblique') || fontFamily.includes('Italic')) styles.fontStyle = 'italic';
    
    return styles;
  };

  return (
    <div 
      className={`
        relative aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-charcoal-800 transition-all duration-200 group
        ${isOverlay ? 'shadow-2xl ring-4 ring-brand-purple scale-105 z-50 cursor-grabbing' : 'shadow-sm hover:shadow-md'}
        ${isDragging ? 'opacity-30 grayscale ring-2 ring-dashed ring-slate-300 dark:ring-charcoal-600' : ''}
        ${!isDragging && !isOverlay && page.selected ? 'ring-4 ring-brand-purple shadow-lg shadow-brand-purple/20' : ''}
        ${!isDragging && !isOverlay && !page.selected ? 'ring-1 ring-slate-200 dark:ring-charcoal-700 hover:ring-brand-purple/30' : ''}
      `}
      onClick={onToggle ? (e) => onToggle(page.id) : undefined}
    >
      {/* Controls Overlay (Only visible in normal mode, not numbering) */}
      {!isOverlay && !numberingConfig && !isDragging && (
        <div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); onRemove?.(page.id); }}
             className="p-1.5 rounded-full bg-white/90 shadow-sm text-rose-500 hover:text-rose-600 hover:bg-white"
             title="Delete Page"
           >
             <Trash2 size={14} />
           </button>
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full h-full bg-slate-50 dark:bg-charcoal-900 flex items-center justify-center p-2">
        <img 
          src={page.previewUrl} 
          alt={`Page ${index + 1}`}
          className={`
            max-w-full max-h-full object-contain shadow-sm transition-transform duration-300
            ${page.selected && !isOverlay && !isDragging && !numberingConfig ? 'opacity-90' : 'opacity-100'}
          `}
          style={{ transform: `rotate(${page.rotation || 0}deg)` }}
          draggable={false}
        />
        
        {/* Numbering Preview */}
        {numberingConfig && showBadges && (
          <div 
            style={getNumberPreviewStyle() || {}} 
            className="z-20 font-heading font-bold bg-white/90 text-black shadow-sm border border-black/10 px-1.5 py-0.5 rounded-[2px] pointer-events-none min-w-[16px] text-center"
          >
            {numberingConfig.startFrom + index}
          </div>
        )}
      </div>

      {/* Index Badge */}
      {!numberingConfig && showBadges && (
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${isOverlay ? 'bg-brand-purple text-white' : 'bg-charcoal-900/80 text-white'}`}>
             {useVisualIndexing ? index + 1 : (page.pageIndex + 1)}
           </span>
        </div>
      )}

      {/* Selection Overlay */}
      {!isOverlay && !isDragging && !numberingConfig && page.selected && (
        <div className="absolute inset-0 bg-brand-purple/10 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-md">
              <Check size={16} strokeWidth={3} />
            </motion.div>
        </div>
      )}
    </div>
  );
};

interface SortablePageProps extends PageCardProps {}

const SortablePage: React.FC<SortablePageProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.page.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="outline-none touch-manipulation relative"
    >
      <PageCard {...props} isDragging={isDragging} />
    </motion.div>
  );
};

export const SplitPageGrid: React.FC<SplitPageGridProps> = (props) => {
  const { pages, onReorder, isReorderDisabled, showBadges = true } = props;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (isReorderDisabled) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      if (oldIndex > -1 && newIndex > -1) {
        onReorder(arrayMove(pages, oldIndex, newIndex));
      }
    }
  };

  const activePage = activeId ? pages.find(p => p.id === activeId) : null;

  return (
    <div className="w-full">
      {/* Controls Bar - Selection Actions */}
      {!props.numberingConfig && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-charcoal-600 dark:text-slate-300">
              <span className="bg-brand-purple/10 text-brand-purple px-2.5 py-1 rounded-lg mr-2">{pages.length} Pages</span>
              {pages.filter(p => p.selected).length > 0 && <span className="text-xs opacity-70">{pages.filter(p => p.selected).length} selected</span>}
            </div>
            
            {/* Action Buttons for Selection */}
            {pages.some(p => p.selected) && (
               <div className="flex gap-2">
                 <motion.button onClick={props.onRemoveSelected} whileTap={buttonTap} className="flex items-center gap-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-100 hover:bg-rose-100 dark:hover:bg-rose-900/30">
                   <Trash2 size={14} /> Delete
                 </motion.button>
               </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <button onClick={props.onSelectAll} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 px-3 py-2 rounded-lg hover:border-slate-300 dark:hover:border-charcoal-600 transition-colors"><SquareCheck size={14} /> All</button>
            <button onClick={props.onDeselectAll} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 px-3 py-2 rounded-lg hover:border-slate-300 dark:hover:border-charcoal-600 transition-colors"><SquareX size={14} /> None</button>
            <button onClick={props.onInvertSelection} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 px-3 py-2 rounded-lg hover:border-slate-300 dark:hover:border-charcoal-600 transition-colors"><ArrowLeftRight size={14} /> Invert</button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => !isReorderDisabled && setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy} disabled={isReorderDisabled || !!props.numberingConfig}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {pages.map((page, index) => (
                <SortablePage
                  key={page.id}
                  page={page}
                  index={index}
                  onToggle={!props.numberingConfig ? props.onTogglePage : undefined}
                  onRemove={props.onRemovePage}
                  useVisualIndexing={props.useVisualIndexing}
                  numberingConfig={props.numberingConfig}
                  showBadges={showBadges}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={dropAnimation}>
          {activePage && <PageCard page={activePage} index={pages.indexOf(activePage)} useVisualIndexing={true} isOverlay numberingConfig={props.numberingConfig} showBadges={showBadges} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};