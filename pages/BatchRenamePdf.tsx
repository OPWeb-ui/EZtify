
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDropzone } from 'react-dropzone';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { 
  FileText, Plus, X, Download, Check, ArrowRight, 
  RefreshCw, Trash2, Archive, Pencil,
  Hash, Type, Settings, ShieldCheck, AlertCircle, 
  FilePlus, CornerDownRight, AlignLeft, AlignRight, List
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  DndContext, closestCenter, MouseSensor, TouchSensor, 
  KeyboardSensor, useSensor, useSensors, DragOverlay,
  defaultDropAnimationSideEffects, DragEndEvent, DragStartEvent
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { EZButton } from '../components/EZButton';
import { EZSegmentedControl } from '../components/EZSegmentedControl';
import { IconBox } from '../components/IconBox';

// --- Constants ---
const MAX_FILES = 50;
const WORKSPACE_CARD_LAYOUT_ID = "batch-rename-card-surface";

// --- Sub-components ---

const Confetti = () => {
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -20 - Math.random() * 40,
    rotation: Math.random() * 360,
    color: ['#84CC16', '#111111', '#E5E7EB'][Math.floor(Math.random() * 3)],
    scale: 0.5 + Math.random() * 0.5
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ top: `${p.y}%`, left: `${p.x}%`, rotate: p.rotation, opacity: 1, scale: p.scale }}
          animate={{ 
            top: '110%', 
            rotate: p.rotation + 180 + Math.random() * 360,
            opacity: 0 
          }}
          transition={{ 
            duration: 2.5 + Math.random() * 1.5, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: Math.random() * 0.3
          }}
          className="absolute w-2 h-2 rounded-[1px]"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
};

interface PdfFileItem {
  id: string;
  file: File;
}

const ProcessingOverlay = ({ progress, status }: { progress: number, status: string }) => (
  <motion.div
    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-nd-base/60"
  >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl p-10 flex flex-col items-center border border-nd-border"
      >
        <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 p-5 rounded-3xl bg-[#111111] text-white shadow-sm"
        >
            <Pencil size={40} strokeWidth={2} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-nd-primary tracking-tight mb-2">Processing</h2>
        <p className="text-sm text-nd-secondary font-medium mb-8 font-mono max-w-[200px] truncate text-center">{status}</p>
        
        <div className="w-56 bg-nd-subtle rounded-full h-2 overflow-hidden mb-3 border border-nd-border">
            <motion.div 
              className="h-full bg-accent-lime rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${Math.max(5, progress)}%` }}
              transition={{ duration: 0.3, ease: "circOut" }}
            />
        </div>
        
        <span className="text-[10px] font-bold text-nd-muted uppercase tracking-widest tabular-nums">
            {Math.round(progress)}%
        </span>
      </motion.div>
  </motion.div>
);

const UnifiedUploadCard: React.FC<{ 
  onUpload: () => void; 
  isProcessing: boolean; 
  progress: number; 
  isMobile: boolean;
}> = ({ onUpload, isProcessing, progress, isMobile }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <motion.div
        layoutId={WORKSPACE_CARD_LAYOUT_ID}
        className={`
            relative flex flex-col items-center justify-center w-80 h-80 rounded-[3rem] 
            border-2 transition-all duration-500 overflow-hidden bg-white
            ${isProcessing 
                ? 'border-[#111111] shadow-xl' 
                : 'border-dashed border-nd-border shadow-sm hover:border-stone-400 hover:shadow-lg cursor-pointer group'
            }
        `}
        onClick={!isProcessing ? onUpload : undefined}
      >
         <AnimatePresence mode="wait">
            {isProcessing ? (
                <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col items-center w-full px-6 text-center"
                >
                    <div className="mb-6 w-20 h-24 bg-nd-subtle rounded-xl border-2 border-[#111111] rotate-3 flex flex-col p-2 gap-2 shadow-sm">
                       <div className="w-1/2 h-1.5 bg-nd-border rounded-full" />
                       <div className="w-full h-1.5 bg-nd-border/40 rounded-full" />
                       <div className="mt-auto w-full bg-accent-lime h-1.5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-[#111111]" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} />
                       </div>
                    </div>
                    <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Analyzing</h2>
                    <p className="text-sm text-nd-muted font-medium mb-6 font-mono">Mounting stream...</p>
                </motion.div>
            ) : (
                <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center z-10"
                >
                     <div className="w-24 h-24 rounded-full bg-nd-subtle border border-nd-border flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-nd-border" />
                         <Pencil size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111]">Batch Rename</span>
                     <span className="text-sm font-medium text-nd-muted mt-2">
                         {isMobile ? 'Tap to load PDFs' : 'Drag or click to load PDFs'}
                     </span>
                </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    </div>
  );
};

const FileItemCard = ({ item, newName, isDragging, onRemove, isConflict, index }: any) => {
  return (
    <motion.div 
      layout
      className={`
        relative group flex items-center gap-4 p-4 bg-white border rounded-2xl transition-all duration-200
        ${isDragging ? 'shadow-xl z-50 ring-2 ring-nd-primary border-transparent opacity-90' : isConflict ? 'border-rose-300 bg-rose-50/30' : 'border-nd-border shadow-sm'}
        mb-3 select-none
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 
        ${isConflict ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-nd-subtle border-nd-border text-nd-primary'}
      `}>
         {isConflict ? <AlertCircle size={22} /> : <FileText size={22} strokeWidth={1.5} />}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
         <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-nd-primary truncate">
              {newName}
            </span>
            {isConflict && <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter bg-rose-100 px-1.5 py-0.5 rounded">Duplicate</span>}
         </div>
         <div className="flex items-center gap-1.5 opacity-40">
            <CornerDownRight size={10} className="text-nd-muted" />
            <span className="text-[10px] font-medium text-nd-muted truncate font-mono italic">{item.file.name}</span>
         </div>
      </div>

      <button 
        onClick={() => onRemove(item.id)} 
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-nd-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
};

const SortableFileItem: React.FC<any> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none touch-manipulation"><FileItemCard {...props} isDragging={isDragging} /></div>;
};

// --- MAIN PAGE ---

export const BatchRenamePdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core State
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ count: number; blob: Blob; fileName: string } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Renaming Protocol State
  const [baseName, setBaseName] = useState('Document');
  const [numberingStyle, setNumberingStyle] = useState<'none' | '123' | '010203'>('010203');
  const [numberPosition, setNumberPosition] = useState<'after' | 'before'>('after');
  const [extraText, setExtraText] = useState('');
  const [isPrefix, setIsPrefix] = useState(false);

  // Live Preview Calculation
  const filePreviews = useMemo(() => {
    return files.map((f, i) => {
      let num = '';
      if (numberingStyle === '123') num = String(i + 1);
      else if (numberingStyle === '010203') num = String(i + 1).padStart(2, '0');

      let name = baseName.trim() || 'Document';
      if (num) {
        name = numberPosition === 'before' ? `${num}-${name}` : `${name}-${num}`;
      }

      if (extraText.trim()) {
        const tag = extraText.trim();
        name = isPrefix ? `${tag}_${name}` : `${name}_${tag}`;
      }

      return { ...f, newName: `${name}.pdf` };
    });
  }, [files, baseName, numberingStyle, numberPosition, extraText, isPrefix]);

  const conflicts = useMemo(() => {
    const counts = filePreviews.reduce((acc: any, p) => {
      acc[p.newName] = (acc[p.newName] || 0) + 1;
      return acc;
    }, {});
    return new Set(Object.keys(counts).filter(n => counts[n] > 1));
  }, [filePreviews]);

  // Handlers
  const handleUpload = useCallback(async (uploadedFiles: File[]) => {
    if (files.length + uploadedFiles.length > MAX_FILES) {
      addToast("Limit Reached", `Maximum ${MAX_FILES} files per batch.`, "warning");
      return;
    }
    
    setIsProcessing(true);
    setProgress(10);
    setStatus('Initializing stream...');

    const newItems: PdfFileItem[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
        newItems.push({ id: nanoid(), file: uploadedFiles[i] });
        setProgress(10 + ((i + 1) / uploadedFiles.length) * 90);
        await new Promise(r => setTimeout(r, 10));
    }

    setFiles(prev => [...prev, ...newItems]);
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [files, addToast]);

  const onDrop = (acceptedFiles: File[]) => handleUpload(acceptedFiles);
  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    noClick: true, 
    noKeyboard: true 
  });

  const handleRenameExecute = async () => {
    if (files.length === 0) return;
    if (conflicts.size > 0) {
      addToast("Duplicate Names", "Please ensure all resulting filenames are unique.", "error");
      return;
    }

    setIsProcessing(true);
    setStatus('Rebuilding archive...');
    setProgress(10);

    try {
      if (files.length === 1) {
        setResult({
          count: 1,
          blob: files[0].file,
          fileName: filePreviews[0].newName
        });
        setProgress(100);
      } else {
        const zip = new JSZip();
        filePreviews.forEach((p, idx) => {
          zip.file(p.newName, p.file);
          setProgress(10 + (idx / filePreviews.length) * 70);
        });
        
        setStatus('Compressing for download...');
        const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
           setProgress(80 + (meta.percent * 0.2));
        });
        setResult({ count: files.length, blob, fileName: 'renamed_documents_EZtify.zip' });
      }
      addToast("Done", "Batch renaming complete", "success");
    } catch (e) {
      addToast("Error", "Processing failed", "error");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setBaseName('Document');
    setNumberingStyle('010203');
    setExtraText('');
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeDragItem = activeDragId ? filePreviews.find(p => p.id === activeDragId) : null;

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-nd-base text-nd-primary" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Append Batch" variant="slate" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-12 relative">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-10 h-full">
          
          <AnimatePresence mode="wait">
            {isProcessing && files.length > 0 && <ProcessingOverlay progress={progress} status={status} />}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="relative overflow-hidden flex flex-col items-center justify-center w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl border border-nd-border p-12 text-center" style={{ '--nd-primary': '#111111' } as any}>
                  <Confetti />
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm ring-4 ring-emerald-50 z-10">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-bold text-nd-primary mb-2 tracking-tight z-10">Rename Successful</h2>
                  <p className="text-nd-secondary font-medium mb-8 z-10">{result.count} documents have been updated.</p>
                  <div className="flex flex-col gap-3 w-full z-10 relative">
                    <EZButton variant="primary" onClick={handleDownload} className="!h-14 !text-base !rounded-2xl shadow-xl !bg-[#111111]" icon={<Download size={20} />} fullWidth>
                      Download {result.count > 1 ? 'ZIP Archive' : 'PDF File'}
                    </EZButton>
                    <EZButton variant="ghost" onClick={handleReset} className="!h-12 !rounded-2xl text-nd-muted hover:text-nd-primary" fullWidth>Finish Session</EZButton>
                  </div>
                </div>
              </motion.div>
            ) : files.length === 0 ? (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-lg aspect-square md:aspect-video rounded-[3rem] border-2 border-dashed border-nd-border bg-white hover:border-nd-muted transition-all cursor-pointer flex flex-col items-center justify-center group"
                >
                   <UnifiedUploadCard onUpload={() => fileInputRef.current?.click()} isProcessing={isProcessing} progress={progress} isMobile={isMobile} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="workspace"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10 pb-32"
              >
                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 border-b border-nd-border pb-8">
                  <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="h-10 px-4 flex items-center gap-2 rounded-xl bg-nd-subtle text-nd-secondary hover:text-nd-primary transition-all text-[11px] font-bold uppercase tracking-widest border border-nd-border">
                      <RefreshCw size={14} /> Clear
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="h-10 px-4 flex items-center gap-2 rounded-xl bg-nd-primary text-white hover:opacity-90 transition-all text-[11px] font-bold uppercase tracking-widest shadow-sm">
                      <Plus size={14} /> Add More
                    </button>
                  </div>
                </div>

                {/* INPUT BATCH LIST */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <IconBox icon={<List />} size="xs" variant="transparent" />
                    <h2 className="text-xs font-bold text-nd-muted uppercase tracking-[0.2em] font-mono">Input Batch</h2>
                  </div>
                  
                  <div className="min-h-[100px]">
                    <DndContext 
                      sensors={sensors} 
                      collisionDetection={closestCenter} 
                      onDragStart={(e) => setActiveDragId(e.active.id as string)}
                      onDragEnd={(e) => { 
                        setActiveDragId(null); 
                        if (e.over && e.active.id !== e.over.id) {
                          setFiles(prev => arrayMove(prev, prev.findIndex(x => x.id === e.active.id), prev.findIndex(x => x.id === e.over.id)));
                        }
                      }}
                    >
                      <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <AnimatePresence mode="popLayout" initial={false}>
                          {filePreviews.map((p, idx) => (
                            <SortableFileItem 
                              key={p.id} 
                              item={p} 
                              newName={p.newName} 
                              index={idx}
                              isConflict={conflicts.has(p.newName)} 
                              onRemove={(id: string) => setFiles(prev => prev.filter(x => x.id !== id))}
                            />
                          ))}
                        </AnimatePresence>
                      </SortableContext>
                      {createPortal(
                        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })}>
                          {activeDragItem ? (
                            <div className="w-[400px] pointer-events-none">
                              <FileItemCard item={activeDragItem} newName={activeDragItem.newName} isDragging />
                            </div>
                          ) : null}
                        </DragOverlay>,
                        document.body
                      )}
                    </DndContext>
                  </div>
                </div>

                {/* RENAME RULE PANEL */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 px-1">
                    <IconBox icon={<Settings />} size="xs" active toolAccentColor="#111111" />
                    <h2 className="text-xs font-bold text-nd-primary uppercase tracking-[0.2em] font-mono">Rename Rules</h2>
                  </div>

                  <div className="bg-white rounded-3xl border border-nd-border shadow-soft p-8 space-y-8">
                    {/* Base Name Input */}
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Base Name</label>
                       <div className="relative group">
                          <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nd-muted group-focus-within:text-nd-primary" />
                          <input 
                            value={baseName}
                            onChange={(e) => setBaseName(e.target.value)}
                            placeholder="Shared file name..."
                            className="w-full h-12 pl-12 pr-4 bg-nd-subtle border border-nd-border rounded-xl text-sm font-bold text-nd-primary outline-none focus:ring-4 focus:ring-accent-lime/10 focus:border-nd-primary transition-all"
                          />
                       </div>
                    </div>

                    {/* Numbering & Position Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Numbering Style</label>
                         <EZSegmentedControl 
                           value={numberingStyle}
                           onChange={setNumberingStyle}
                           options={[
                             { value: 'none', label: 'None' },
                             { value: '123', label: '1, 2, 3' },
                             { value: '010203', label: '01, 02' }
                           ]}
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Number Position</label>
                         <EZSegmentedControl 
                           value={numberPosition}
                           onChange={setNumberPosition}
                           options={[
                             { value: 'after', label: <div className="flex items-center gap-2"><AlignRight size={14}/> After</div> },
                             { value: 'before', label: <div className="flex items-center gap-2"><AlignLeft size={14}/> Before</div> }
                           ]}
                         />
                      </div>
                    </div>

                    {/* Optional Suffix / Prefix */}
                    <div className="pt-6 border-t border-nd-border">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Optional Tag</label>
                            <div className="flex bg-nd-subtle p-0.5 rounded-lg border border-nd-border">
                               <button onClick={() => setIsPrefix(true)} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${isPrefix ? 'bg-white text-nd-primary shadow-sm' : 'text-nd-muted'}`}>Prefix</button>
                               <button onClick={() => setIsPrefix(false)} className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${!isPrefix ? 'bg-white text-nd-primary shadow-sm' : 'text-nd-muted'}`}>Suffix</button>
                            </div>
                          </div>
                          <div className="relative group">
                            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nd-muted" />
                            <input 
                              value={extraText}
                              onChange={(e) => setExtraText(e.target.value)}
                              placeholder="v1, scan, final..."
                              className="w-full h-11 pl-11 pr-4 bg-white border border-nd-border rounded-xl text-sm font-bold text-nd-primary outline-none focus:border-nd-primary transition-all"
                            />
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <AnimatePresence>
        {files.length > 0 && !result && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-nd-border px-6 py-4"
          >
             <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                <div className="hidden md:flex flex-col">
                   <span className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Local Batch</span>
                   <span className="text-sm font-bold text-nd-primary">{files.length} Files Ready</span>
                </div>
                
                <EZButton 
                  variant="primary" 
                  onClick={handleRenameExecute}
                  disabled={isProcessing || files.length === 0}
                  isLoading={isProcessing}
                  className="!h-14 !px-12 !rounded-2xl shadow-xl !bg-[#111111] !text-white flex-1 md:flex-none uppercase tracking-widest text-xs"
                  icon={!isProcessing && <Archive size={18} />}
                >
                  Rename Files
                </EZButton>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
