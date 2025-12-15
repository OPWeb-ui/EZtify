
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
import { Trash2, RotateCw, Check, X } from 'lucide-react';
import { standardLayoutTransition, buttonTap } from '../utils/animations';

interface SplitPageGridProps {
  pages: PdfPage[];
  onTogglePage: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onInvertSelection?: () => void;
  onRemovePage?: (id: string) => void;
  onRemoveSelected?: () => void;
  onReorder: (newPages: PdfPage[]) => void;
  useVisualIndexing?: boolean;
  numberingConfig?: PageNumberConfig;
  isReorderDisabled?: boolean;
  onRotate?: (id: string) => void;
  showBadges?: boolean;
  isMobile?: boolean;
}

interface PageCardProps {
  page: PdfPage;
  index: number;
  useVisualIndexing?: boolean;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRotate?: (id: string) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
  numberingConfig?: PageNumberConfig;
  showBadges?: boolean;
  isMobile?: boolean;
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
  onRotate,
  isOverlay, 
  isDragging,
  numberingConfig,
  showBadges = true,
  isMobile
}) => {
  // Numbering Preview
  const getNumberPreviewStyle = () => {
    if (!numberingConfig) return null;
    let styles: React.CSSProperties = { position: 'absolute', transform: '' };
    const { position, alignment, fontSize, fontFamily, offsetX, offsetY } = numberingConfig;

    if (position === 'top') styles.top = `calc(8% + ${offsetY}px)`;
    else styles.bottom = `calc(8% + ${offsetY}px)`;

    let xTransform = '';
    if (alignment === 'left') styles.left = `calc(8% + ${offsetX}px)`;
    else if (alignment === 'right') styles.right = `calc(8% - ${offsetX}px)`;
    else {
      styles.left = '50%';
      xTransform = `translateX(calc(-50% + ${offsetX}px))`;
    }

    styles.transform = xTransform.trim();
    styles.fontSize = `${fontSize * 0.75}px`; 
    styles.fontFamily = fontFamily.split('-')[0];
    
    return styles;
  };

  return (
    <div 
      className={`
        relative aspect-[3/4] rounded-lg overflow-hidden bg-white dark:bg-charcoal-800 transition-all duration-200 group
        border 
        ${isOverlay ? 'shadow-2xl border-brand-purple z-50 cursor-grabbing' : ''}
        ${isDragging ? 'opacity-30 grayscale border-dashed border-slate-400' : ''}
        ${!isDragging && !isOverlay && page.selected 
            ? 'border-brand-purple border-2 ring-1 ring-brand-purple/20' 
            : 'border-slate-200 dark:border-charcoal-700 hover:border-slate-300 dark:hover:border-charcoal-600 hover:shadow-md'}
      `}
      onClick={onToggle ? (e) => onToggle(page.id) : undefined}
    >
      {/* Selection Marker */}
      {page.selected && !isOverlay && !numberingConfig && (
         <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-l-[32px] border-t-brand-purple border-l-transparent z-20 pointer-events-none"
         >
            <Check size={12} className="absolute -top-7 -left-3.5 text-white" strokeWidth={3} />
         </motion.div>
      )}

      {/* Delete Button (Top Right) - Standardized */}
      {onRemove && !isOverlay && !numberingConfig && !isDragging && (
        <motion.button 
            whileTap={buttonTap}
            onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
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
              ${isMobile ? (page.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none') : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100'}
            `}
            title="Delete Page"
        >
            <Trash2 size={14} strokeWidth={2} />
        </motion.button>
      )}

      {/* Controls Overlay (Rotate Only now, Delete moved up) */}
      {!isOverlay && !numberingConfig && !isDragging && onRotate && (
        <div className={`absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center p-1.5 border-t border-slate-200 dark:border-charcoal-700`}>
            <button
                onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
                className="p-1 rounded-md text-charcoal-600 dark:text-slate-300 hover:text-brand-purple hover:bg-brand-purple/10 transition-colors flex items-center gap-1 text-[10px] font-bold font-mono uppercase"
                title="Rotate 90°"
            >
                <RotateCw size={12} /> Rotate
            </button>
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-4">
        <motion.img 
          src={page.previewUrl} 
          alt={`Page ${index + 1}`}
          layoutId={`page-preview-${page.id}`}
          className={`
            max-w-full max-h-full object-contain shadow-sm
            ${page.selected && !isOverlay && !isDragging && !numberingConfig ? 'opacity-90' : 'opacity-100'}
          `}
          animate={{ rotate: page.rotation || 0 }}
          transition={standardLayoutTransition}
          draggable={false}
        />
        
        {/* Numbering Preview */}
        {numberingConfig && showBadges && (
          <div 
            style={getNumberPreviewStyle() || {}} 
            className="z-20 font-bold bg-white/90 text-black shadow-sm border border-black/10 px-1.5 py-0.5 rounded-[2px] pointer-events-none min-w-[16px] text-center"
          >
            {numberingConfig.startFrom + index}
          </div>
        )}
      </div>

      {/* Tech Index Badge */}
      {!numberingConfig && showBadges && (
        <div className="absolute bottom-0 left-0 bg-slate-100 dark:bg-charcoal-700 px-2 py-0.5 text-[9px] font-mono font-bold text-charcoal-500 dark:text-slate-400 border-t border-r border-slate-200 dark:border-charcoal-600 rounded-tr-md z-10 pointer-events-none">
           {String(useVisualIndexing ? index + 1 : (page.pageIndex + 1)).padStart(2, '0')}
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={standardLayoutTransition}
      className="outline-none touch-manipulation relative"
    >
      <PageCard {...props} isDragging={isDragging} />
    </motion.div>
  );
};

export const SplitPageGrid: React.FC<SplitPageGridProps> = (props) => {
  const { pages, onReorder, isReorderDisabled, onRotate, showBadges = true, isMobile } = props;
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
      {!props.numberingConfig && (props.onSelectAll || props.onRemoveSelected) && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold font-mono text-charcoal-500 dark:text-slate-400 uppercase tracking-wider">
              {pages.length} PAGES LOADED
              {pages.filter(p => p.selected).length > 0 && <span className="text-brand-purple ml-2">// {pages.filter(p => p.selected).length} SELECTED</span>}
            </div>
            
            {props.onRemoveSelected && pages.some(p => p.selected) && (
               <motion.button onClick={props.onRemoveSelected} className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-md text-xs font-mono border border-transparent hover:border-rose-200 transition-all">
                 <Trash2 size={12} /> DELETE_SELECTED
               </motion.button>
            )}
          </div>
          {props.onSelectAll && (
            <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase">
              <button onClick={props.onSelectAll} className="px-3 py-1.5 bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded hover:border-brand-purple/50 transition-colors">Select_All</button>
              {props.onDeselectAll && <button onClick={props.onDeselectAll} className="px-3 py-1.5 bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded hover:border-brand-purple/50 transition-colors">Select_None</button>}
              {props.onInvertSelection && <button onClick={props.onInvertSelection} className="px-3 py-1.5 bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded hover:border-brand-purple/50 transition-colors">Invert</button>}
            </div>
          )}
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
                  onToggle={props.onTogglePage}
                  onRemove={props.onRemovePage}
                  onRotate={onRotate}
                  useVisualIndexing={props.useVisualIndexing}
                  numberingConfig={props.numberingConfig}
                  showBadges={showBadges}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={dropAnimation}>
          {activePage && <PageCard page={activePage} index={pages.indexOf(activePage)} useVisualIndexing={true} isOverlay numberingConfig={props.numberingConfig} showBadges={showBadges} onRotate={onRotate} isMobile={isMobile} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
