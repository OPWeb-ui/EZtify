
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
import { Trash2, RotateCw, Check } from 'lucide-react';
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
    styles: { active: { opacity: '0.5' } },
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
        relative aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-charcoal-800 transition-all duration-200 group
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
         <div className="absolute top-2 right-2 w-6 h-6 bg-brand-purple text-white rounded-lg flex items-center justify-center shadow-sm z-20 pointer-events-none">
            <Check size={14} strokeWidth={3} />
         </div>
      )}

      {/* Delete Button (Strict IconBox Style) */}
      {onRemove && !isOverlay && !numberingConfig && !isDragging && (
        <motion.button 
            whileTap={buttonTap}
            onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
            className={`
              absolute top-2 left-2 z-30 
              flex items-center justify-center 
              w-8 h-8 rounded-lg
              bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-sm 
              text-charcoal-400 dark:text-slate-400 
              border border-slate-200 dark:border-charcoal-600 
              shadow-sm
              hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20
              transition-all duration-200
              ${isMobile ? (page.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none') : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}
            `}
            title="Delete Page"
        >
            <Trash2 size={14} strokeWidth={1.5} />
        </motion.button>
      )}

      {/* Rotate Control (Strict Bar Style) */}
      {!isOverlay && !numberingConfig && !isDragging && onRotate && (
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            <button
                onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
                className="w-full py-1.5 rounded-lg bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-sm text-charcoal-600 dark:text-slate-300 hover:text-brand-purple border border-slate-200 dark:border-charcoal-600 shadow-sm flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono uppercase transition-colors"
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
        
        {numberingConfig && showBadges && (
          <div 
            style={getNumberPreviewStyle() || {}} 
            className="z-20 font-bold bg-white/90 text-black shadow-sm border border-black/10 px-1.5 py-0.5 rounded-[4px] pointer-events-none min-w-[16px] text-center"
          >
            {numberingConfig.startFrom + index}
          </div>
        )}
      </div>

      {/* Index Badge */}
      {!numberingConfig && showBadges && (
        <div className="absolute bottom-2 left-2 bg-charcoal-900/80 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono font-bold text-white rounded-md z-10 pointer-events-none">
           {String(useVisualIndexing ? index + 1 : (page.pageIndex + 1)).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

interface SortablePageProps extends PageCardProps {}

const SortablePage: React.FC<SortablePageProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.page.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };

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
      {!props.numberingConfig && (props.onSelectAll || props.onRemoveSelected) && (
        <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-bold font-mono text-charcoal-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              {pages.length} PAGES
              {pages.filter(p => p.selected).length > 0 && (
                 <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-md">
                    {pages.filter(p => p.selected).length} SELECTED
                 </span>
              )}
            </div>
            
            {props.onRemoveSelected && pages.some(p => p.selected) && (
               <motion.button 
                 onClick={props.onRemoveSelected} 
                 className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/30 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/30"
               >
                 <Trash2 size={14} /> DELETE SELECTED
               </motion.button>
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
          {activePage && <PageCard page={activePage} index={pages.indexOf(activePage)} useVisualIndexing={true} isOverlay numberingConfig={props.numberingConfig} showBadges={showBadges} onRotate={onRotate} isMobile={isMobile} isSelected={activePage.selected} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
