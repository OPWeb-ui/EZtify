import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { MultiToolPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { generateMultiToolPdf, generateSplitPdfZip, clearPdfCache } from '../services/pdfMultiToolProcessor';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { 
  Wand2, Cpu, Lock, Settings, Layers, Upload, Undo2, Redo, RefreshCw, 
  CheckSquare, XSquare, RotateCcw, RotateCw, Copy, Trash2, Download, 
  FileArchive, Loader2, MousePointer2, GripHorizontal, Plus, FilePlus
} from 'lucide-react';
import {
  DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor,
  DragOverlay, DropAnimation, defaultDropAnimationSideEffects, closestCenter,
  TouchSensor, MouseSensor
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  rectSortingStrategy, 
  useSortable, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { buttonTap, standardLayoutTransition, techEase } from '../utils/animations';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../components/EmptyState';
import { DragDropOverlay } from '../components/DragDropOverlay';

// --- TYPES & HELPERS ---

interface HistoryState {
  pages: MultiToolPage[];
  selection: Set<string>;
}

// --- SUB-COMPONENTS ---

const ToolButton = ({ 
  icon, 
  label, 
  onClick, 
  disabled = false, 
  active = false, 
  shortcut 
}: { 
  icon: React.ReactNode, 
  label?: string, 
  onClick: () => void, 
  disabled?: boolean, 
  active?: boolean,
  shortcut?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label + (shortcut ? ` (${shortcut})` : '')}
    className={`
      flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all border
      ${active 
        ? 'bg-brand-purple text-white border-brand-purple shadow-sm' 
        : disabled
          ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent text-charcoal-400 dark:text-slate-600'
          : 'bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-700'
      }
    `}
  >
    {icon}
    {label && <span className="hidden lg:inline">{label}</span>}
  </button>
);

const PageCard = ({ 
  page, 
  index,
  isSelected, 
  isOverlay, 
  isDragging,
  onSelect, 
  onRotate,
  onDelete
}: { 
  page: MultiToolPage, 
  index?: number,
  isSelected: boolean, 
  isOverlay?: boolean, 
  isDragging?: boolean,
  onSelect?: (id: string, multi: boolean) => void,
  onRotate?: (id: string, dir: 'left' | 'right') => void,
  onDelete?: (id: string) => void
}) => {
  
  return (
    <div 
      className={`
        relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200 group select-none
        bg-white dark:bg-charcoal-800
        ${isOverlay ? 'shadow-2xl border-2 border-brand-purple cursor-grabbing z-50 scale-105' : ''}
        ${isDragging ? 'opacity-20' : ''}
        ${!isOverlay && !isDragging && isSelected 
            ? 'ring-2 ring-brand-purple shadow-md z-10' 
            : 'border border-slate-200 dark:border-charcoal-700 hover:border-slate-300 dark:hover:border-charcoal-600'}
      `}
      onClick={(e) => onSelect?.(page.id, e.shiftKey || e.metaKey || e.ctrlKey)}
    >
      {/* Index Badge */}
      <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono font-bold text-white pointer-events-none">
        {index !== undefined ? String(index + 1).padStart(2, '0') : '#'}
      </div>

      {/* Selection Checkbox (Visual) */}
      <div className={`
        absolute top-2 right-2 z-20 w-5 h-5 rounded border flex items-center justify-center transition-colors
        ${isSelected 
          ? 'bg-brand-purple border-brand-purple text-white shadow-sm' 
          : 'bg-white/80 dark:bg-charcoal-900/80 border-charcoal-300 dark:border-charcoal-600 text-transparent hover:border-brand-purple'}
      `}>
        <CheckSquare size={12} strokeWidth={3} />
      </div>

      {/* Image Area */}
      <div className="w-full h-full p-3 flex items-center justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:8px_8px]">
         {page.type === 'blank' ? (
            <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-charcoal-600 flex flex-col items-center justify-center text-charcoal-400">
               <Plus size={24} className="mb-1 opacity-50" />
               <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Blank</span>
            </div>
         ) : (
            <motion.img 
              src={page.previewUrl} 
              alt="Page" 
              className="max-w-full max-h-full object-contain shadow-sm bg-white"
              animate={{ rotate: page.rotation }}
              transition={standardLayoutTransition}
              draggable={false}
            />
         )}
      </div>

      {/* Hover Actions (Desktop) */}
      {!isOverlay && !isDragging && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-charcoal-700 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
           <button 
             onClick={(e) => { e.stopPropagation(); onRotate?.(page.id, 'left'); }}
             className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-500 hover:text-brand-purple transition-colors"
             title="Rotate Left"
           >
             <RotateCcw size={14} />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete?.(page.id); }}
             className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-charcoal-500 hover:text-rose-500 transition-colors"
             title="Delete"
           >
             <Trash2 size={14} />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onRotate?.(page.id, 'right'); }}
             className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-500 hover:text-brand-purple transition-colors"
             title="Rotate Right"
           >
             <RotateCw size={14} />
           </button>
        </div>
      )}
    </div>
  );
};

interface SortablePageProps {
  page: MultiToolPage;
  index: number;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onRotate: (id: string, dir: 'left' | 'right') => void;
  onDelete: (id: string) => void;
}

const SortablePage: React.FC<SortablePageProps> = ({ page, index, isSelected, onSelect, onRotate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  
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
      transition={standardLayoutTransition}
      className="outline-none touch-manipulation"
    >
      <PageCard 
        page={page} 
        index={index} 
        isDragging={isDragging} 
        isSelected={isSelected}
        onSelect={onSelect}
        onRotate={onRotate}
        onDelete={onDelete}
      />
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

export const PdfMultiToolPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [sourceFiles, setSourceFiles] = useState<Map<string, File>>(new Map());
  const [pages, setPages] = useState<MultiToolPage[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  
  // History Stack
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // --- HISTORY MANAGER ---
  
  // Push new state to history
  const pushHistory = useCallback((newPages: MultiToolPage[], newSelection: Set<string>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ pages: newPages, selection: newSelection });
      // Limit history depth
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
    setPages(newPages);
    setSelection(newSelection);
  }, [historyIndex]);

  // Initial history push on load
  const initHistory = (initialPages: MultiToolPage[]) => {
    setHistory([{ pages: initialPages, selection: new Set() }]);
    setHistoryIndex(0);
    setPages(initialPages);
    setSelection(new Set());
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setPages(prev.pages);
      setSelection(prev.selection);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setPages(next.pages);
      setSelection(next.selection);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // --- ACTIONS ---

  const handleUpload = useCallback(async (files: File[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const newSourceFiles = new Map(sourceFiles);
    const newPagesToAdd: MultiToolPage[] = [];

    for (const file of files) {
      const fileId = nanoid();
      newSourceFiles.set(fileId, file);
      try {
        const loaded = await loadPdfPages(file);
        const mapped: MultiToolPage[] = loaded.map(p => ({
          id: nanoid(),
          sourceFileId: fileId,
          sourcePageIndex: p.pageIndex,
          previewUrl: p.previewUrl,
          rotation: 0,
          type: 'original',
          width: p.width || 595,
          height: p.height || 842,
          selected: false
        }));
        newPagesToAdd.push(...mapped);
      } catch (e) {
        addToast("Error", `Failed to load ${file.name}`, "error");
      }
    }

    setSourceFiles(newSourceFiles);
    
    // If first load, init history. If appending, push history.
    if (pages.length === 0) {
      initHistory(newPagesToAdd);
    } else {
      pushHistory([...pages, ...newPagesToAdd], selection);
    }
    
    setIsProcessing(false);
    addToast("Success", `Added ${files.length} documents`, "success");
  }, [sourceFiles, pages, selection, isProcessing, pushHistory, addToast]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) addToast("Error", "Invalid file type.", "error");
    if (acceptedFiles.length > 0) handleUpload(acceptedFiles);
  }, [handleUpload, addToast]);

  const { getRootProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, noClick: true, noKeyboard: true });

  const handleReset = () => {
    setPages([]);
    setSelection(new Set());
    setSourceFiles(new Map());
    setHistory([]);
    setHistoryIndex(-1);
    clearPdfCache();
  };

  const handleAddPdfClick = () => {
    fileInputRef.current?.click();
  };

  // --- MANIPULATION ---

  const handleSelect = (id: string, multi: boolean) => {
    const newSelection = new Set(multi ? selection : []);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelection(newSelection);
    // Note: Selection changes do not push to history stack to avoid clutter
  };

  const handleSelectAll = () => setSelection(new Set(pages.map(p => p.id)));
  const handleDeselectAll = () => setSelection(new Set());

  const handleRotate = (direction: 'left' | 'right') => {
    const angle = direction === 'left' ? -90 : 90;
    const targetIds = selection.size > 0 ? selection : new Set(pages.map(p => p.id));
    
    const newPages = pages.map(p => {
      if (targetIds.has(p.id)) {
        return { ...p, rotation: (p.rotation + angle + 360) % 360 as any };
      }
      return p;
    });
    pushHistory(newPages, selection);
  };

  const handleSingleRotate = (id: string, direction: 'left' | 'right') => {
    const angle = direction === 'left' ? -90 : 90;
    const newPages = pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + angle + 360) % 360 as any } : p);
    pushHistory(newPages, selection);
  };

  const handleDelete = () => {
    if (selection.size === 0) return;
    const newPages = pages.filter(p => !selection.has(p.id));
    pushHistory(newPages, new Set());
  };

  const handleSingleDelete = (id: string) => {
    const newPages = pages.filter(p => p.id !== id);
    const newSelection = new Set(selection);
    newSelection.delete(id);
    pushHistory(newPages, newSelection);
  };

  const handleDuplicate = () => {
    if (selection.size === 0) return;
    const newPages: MultiToolPage[] = [];
    pages.forEach(p => {
      newPages.push(p);
      if (selection.has(p.id)) {
        newPages.push({ ...p, id: nanoid() });
      }
    });
    pushHistory(newPages, selection);
  };

  const handleAddBlank = () => {
    const blankPage: MultiToolPage = {
      id: nanoid(),
      sourceFileId: 'blank',
      sourcePageIndex: -1,
      previewUrl: '',
      rotation: 0,
      type: 'blank',
      width: 595, 
      height: 842,
      selected: false
    };
    pushHistory([...pages, blankPage], selection);
  };

  // --- DND HANDLERS ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: any) => setActiveDragId(e.active.id);
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      const newPages = arrayMove(pages, oldIndex, newIndex);
      pushHistory(newPages, selection);
    }
  };

  // --- DOWNLOAD ---
  const handleDownload = async (mode: 'merge' | 'zip') => {
    if (pages.length === 0) return;
    setIsGenerating(true);
    try {
      const blob = mode === 'merge' 
        ? await generateMultiToolPdf(pages, sourceFiles, setProgress)
        : await generateSplitPdfZip(pages, sourceFiles, setProgress);
        
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = mode === 'merge' ? 'merged_document_EZtify.pdf' : 'extracted_pages_EZtify.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "File downloaded.", "success");
    } catch (e) {
      addToast("Error", "Generation failed.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // --- RENDER ---

  if (pages.length === 0 && history.length === 0) {
    return (
      <ToolLandingLayout
        title="PDF Multi-Tool"
        description="The ultimate PDF editor. Merge, Split, Rotate, and Organize pages in one interface."
        icon={<Wand2 />}
        onDrop={onDrop}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={true}
        isProcessing={isProcessing}
        accentColor="text-indigo-500"
        specs={[
          { label: "Editor", value: "Studio", icon: <Layers /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "History", value: "Undo/Redo", icon: <Settings /> },
          { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
        ]}
        tip="Drop multiple PDFs to combine them. Click pages to select for rotation or deletion."
      />
    );
  }

  const activeDragPage = activeDragId ? pages.find(p => p.id === activeDragId) : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900 overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="ADD_TO_WORKSPACE" subMessage="DROP_PDF_TO_APPEND" variant="indigo" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files), false)} />

      {/* 1. Header Toolbar */}
      <div className="shrink-0 h-16 bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 px-4 md:px-6 flex items-center justify-between z-20 shadow-sm relative">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
             <Wand2 size={20} />
          </div>
          <div className="hidden sm:block">
             <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">PDF Studio</h3>
             <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">{pages.length} Pages</p>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-charcoal-700 mx-1 hidden sm:block" />
          
          {/* History Controls */}
          <div className="flex items-center gap-1">
             <ToolButton icon={<Undo2 size={16} />} disabled={historyIndex <= 0} onClick={undo} />
             <ToolButton icon={<Redo size={16} />} disabled={historyIndex >= history.length - 1} onClick={redo} />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
           <motion.button whileTap={buttonTap} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent">
              <Upload size={16} /> <span className="hidden sm:inline">Add PDF</span>
           </motion.button>
           <motion.button whileTap={buttonTap} onClick={handleAddBlank} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent">
              <Plus size={16} /> <span className="hidden sm:inline">Blank Page</span>
           </motion.button>
           <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors" title="Reset">
              <RefreshCw size={18} />
           </motion.button>
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-100 dark:bg-black/20 relative" onClick={() => setSelection(new Set())}>
         {pages.length === 0 ? (
            <EmptyState 
              title="Workspace Empty" 
              description="No pages remaining. Add a PDF to continue." 
              actionLabel="Add PDF" 
              onAction={handleAddPdfClick} 
              icon={<FilePlus size={40} />}
            />
         ) : (
            <div className="max-w-6xl mx-auto min-h-full pb-20" onClick={(e) => e.stopPropagation()}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {pages.map((page, index) => (
                              <SortablePage 
                                  key={page.id} 
                                  page={page} 
                                  index={index} 
                                  isSelected={selection.has(page.id)}
                                  onSelect={handleSelect}
                                  onRotate={handleSingleRotate}
                                  onDelete={handleSingleDelete}
                              />
                            ))}
                        </AnimatePresence>
                      </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                      {activeDragPage ? (
                        <PageCard 
                            page={activeDragPage} 
                            isSelected={selection.has(activeDragPage.id)} 
                            isOverlay 
                        />
                      ) : null}
                  </DragOverlay>
                </DndContext>
            </div>
         )}
      </div>

      {/* 3. Floating Context Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
         <AnimatePresence>
            {selection.size > 0 ? (
               <motion.div 
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.95 }}
                  className="bg-charcoal-900 text-white rounded-xl shadow-2xl p-2 flex items-center gap-2 border border-charcoal-700"
               >
                  <div className="px-3 text-xs font-mono font-bold border-r border-charcoal-700/50 mr-1 whitespace-nowrap">
                     {selection.size} Selected
                  </div>
                  <ToolButton icon={<RotateCcw size={16} />} onClick={() => handleRotate('left')} active={false} />
                  <ToolButton icon={<RotateCw size={16} />} onClick={() => handleRotate('right')} active={false} />
                  <div className="w-px h-6 bg-charcoal-700/50 mx-1" />
                  <ToolButton icon={<Copy size={16} />} onClick={handleDuplicate} active={false} />
                  <ToolButton icon={<Trash2 size={16} />} onClick={handleDelete} active={false} />
                  <div className="w-px h-6 bg-charcoal-700/50 mx-1" />
                  <ToolButton icon={<XSquare size={16} />} onClick={handleDeselectAll} active={false} />
               </motion.div>
            ) : pages.length > 0 ? (
               <motion.div 
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-charcoal-850 p-2 rounded-xl shadow-xl border border-slate-200 dark:border-charcoal-700 flex gap-2"
               >
                  <motion.button
                     onClick={handleSelectAll}
                     className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 font-bold rounded-lg text-xs font-mono transition-colors"
                  >
                     <CheckSquare size={16} /> Select All
                  </motion.button>
                  <div className="w-px h-8 bg-slate-200 dark:bg-charcoal-700 mx-1" />
                  
                  <motion.button
                     onClick={() => handleDownload('zip')}
                     disabled={isGenerating}
                     className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 font-bold rounded-lg text-xs font-mono transition-colors disabled:opacity-50"
                  >
                     <FileArchive size={16} /> Extract ZIP
                  </motion.button>
                  
                  <motion.button
                     onClick={() => handleDownload('merge')}
                     disabled={isGenerating}
                     className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple hover:bg-brand-purpleDark text-white font-bold rounded-lg text-xs font-mono transition-colors shadow-lg shadow-brand-purple/20 disabled:opacity-50"
                  >
                     {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                     <span>Save PDF</span>
                  </motion.button>
               </motion.div>
            ) : null}
         </AnimatePresence>
      </div>
    </div>
  );
};