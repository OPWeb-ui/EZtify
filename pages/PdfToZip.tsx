
// ... existing imports
import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { generatePdfThumbnail } from '../services/pdfThumbnail';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  Trash2, Plus, FilePlus, X,
  FileArchive, Download, RefreshCw, Loader2, FileText, Check, ArrowRight
} from 'lucide-react';
import {
  DndContext, DragEndEvent, useSensor, useSensors, KeyboardSensor,
  DragOverlay, defaultDropAnimationSideEffects, closestCenter,
  TouchSensor, MouseSensor, DragStartEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  rectSortingStrategy, 
  useSortable, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { EZButton } from '../components/EZButton';
import JSZip from 'jszip';

const WORKSPACE_CARD_LAYOUT_ID = "pdf-zip-card-surface";

// ... existing Confetti component

const Confetti = () => {
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -20 - Math.random() * 40,
    rotation: Math.random() * 360,
    color: ['#10B981', '#111111', '#E5E7EB'][Math.floor(Math.random() * 3)],
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

// ... existing interfaces

interface PdfFileItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  thumbnail?: string;
}

interface ZipResultState {
  originalSize: number;
  finalSize: number;
  blob: Blob;
  fileName: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ProcessingOverlay = ({ progress, status }: { progress: number, status: string }) => (
// ... existing ProcessingOverlay
  <motion.div
    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
    transition={{ duration: 0.3 }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAF9F6]/80"
  >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl p-10 flex flex-col items-center border border-stone-200"
      >
        <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 p-5 rounded-3xl bg-[#111111] text-white shadow-sm border-2 border-[#111111]"
        >
            <FileArchive size={40} strokeWidth={2} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Archiving</h2>
        <p className="text-sm text-stone-500 font-medium mb-8 font-mono max-w-[200px] truncate text-center">{status}</p>
        
        <div className="w-56 bg-stone-100 rounded-full h-3 overflow-hidden mb-3 border border-stone-200">
            <motion.div 
            className="h-full bg-[#111111] rounded-full" 
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.3, ease: "circOut" }}
            />
        </div>
        
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest tabular-nums">
            {Math.round(progress)}%
        </span>
      </motion.div>
  </motion.div>
);

const ResultView: React.FC<{ result: ZipResultState; onDownload: () => void; onReset: () => void }> = ({ result, onDownload, onReset }) => {
// ... existing ResultView
    const savings = Math.max(0, result.originalSize - result.finalSize);
    const savingsPercent = result.originalSize > 0 ? Math.round((savings / result.originalSize) * 100) : 0;
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative overflow-hidden flex flex-col items-center justify-center w-full max-w-lg mx-auto bg-white rounded-[2.5rem] shadow-xl border border-stone-200 p-8 md:p-12 text-center"
        >
            <Confetti />
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm ring-4 ring-emerald-50 z-10">
                <Check size={40} strokeWidth={3} />
            </div>

            <h2 className="text-3xl font-bold text-[#111111] mb-2 tracking-tight z-10">Archive Ready</h2>
            <p className="text-stone-500 font-medium mb-8 z-10">Your PDFs have been converted & zipped.</p>

            <div className="grid grid-cols-3 gap-4 w-full mb-8 bg-stone-50 rounded-2xl p-5 border border-stone-100 z-10">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Original</span>
                    <span className="text-lg font-bold text-stone-900 font-mono">{formatSize(result.originalSize)}</span>
                </div>
                <div className="flex flex-col items-center justify-center text-stone-300">
                    <ArrowRight size={24} />
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Archive</span>
                    <span className="text-lg font-bold text-emerald-600 font-mono">{formatSize(result.finalSize)}</span>
                </div>
            </div>
            
            {savings > 0 && (
                 <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-100 z-10">
                    <span>Reduced by {savingsPercent}%</span>
                 </div>
            )}

            <div className="flex flex-col gap-3 w-full z-10">
                <EZButton 
                    variant="primary" 
                    onClick={onDownload} 
                    className="!h-14 !text-base !rounded-2xl shadow-xl shadow-stone-200 !bg-[#111111]" 
                    icon={<Download size={20} />}
                    fullWidth
                >
                    Download ZIP
                </EZButton>
                <EZButton 
                    variant="ghost" 
                    onClick={onReset} 
                    className="!h-12 !rounded-2xl text-stone-500 hover:text-stone-900"
                    fullWidth
                >
                    Start Over
                </EZButton>
            </div>
        </motion.div>
    );
};

const UnifiedUploadCard: React.FC<{ 
  onUpload: () => void; 
  isProcessing: boolean; 
  progress: number; 
  status: string; 
  isMobile: boolean;
}> = ({ onUpload, isProcessing, progress, status, isMobile }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <motion.div
        layoutId={WORKSPACE_CARD_LAYOUT_ID}
        className={`
            relative flex flex-col items-center justify-center w-80 h-80 rounded-[3rem] 
            border-2 transition-all duration-500 overflow-hidden bg-white
            ${isProcessing 
                ? 'border-[#111111] shadow-xl' 
                : 'border-dashed border-stone-200 shadow-sm hover:border-stone-400 hover:shadow-lg cursor-pointer group'
            }
        `}
        onClick={!isProcessing ? onUpload : undefined}
      >
         <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-stone-50/50 via-white to-white z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isProcessing ? 1 : 0 }}
            transition={{ duration: 0.5 }}
         />

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
                    <div className="mb-6 w-20 h-24 bg-[#FDFCF8] rounded-xl border-2 border-[#111111] rotate-3 flex flex-col p-2 gap-2 shadow-sm">
                       <div className="w-full h-1.5 bg-stone-100 rounded-full" />
                       <div className="w-1/2 h-1.5 bg-stone-100 rounded-full" />
                       <div className="mt-auto w-full bg-[#111111] h-1.5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-accent-lime" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} />
                       </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Processing</h2>
                    <p className="text-sm text-stone-500 font-medium mb-6 font-mono max-w-[90%] truncate">
                      {status || 'Working...'}
                    </p>
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
                     {isMobile && (
                        <div className="mb-6 opacity-30">
                           <span className="text-[10px] font-black text-[#111111] uppercase tracking-[0.25em]">PDF to ZIP</span>
                        </div>
                     )}
                     <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-stone-300" />
                         <FileArchive size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111] group-hover:text-stone-600 transition-colors">
                         Add PDFs
                     </span>
                     <span className="text-sm font-medium text-stone-400 mt-2">
                         {isMobile ? 'Tap to upload' : 'Drag & drop or click'}
                     </span>
                </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ... rest of the file remains unchanged
const UnifiedAction = React.forwardRef<HTMLButtonElement, any>(({ icon, label, isActive, className, variant = 'default', ...props }, ref) => {
    const baseStyles = "h-10 px-3 rounded-2xl flex items-center gap-2 transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#111111] font-bold text-sm justify-center whitespace-nowrap shrink-0";
    const variants: any = {
      default: isActive 
        ? "bg-[#111111] text-white shadow-md transform scale-[1.02] border-transparent" 
        : "text-stone-500 hover:bg-stone-100 hover:text-[#111111] active:scale-95 disabled:opacity-30 disabled:pointer-events-none bg-white border border-stone-200 shadow-sm",
      danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-30 bg-rose-50 border border-rose-100",
      primary: "bg-[#111111] text-white hover:bg-black shadow-lg shadow-stone-200 border border-transparent active:scale-95 disabled:opacity-50 disabled:shadow-none transition-colors",
      minimal: "text-stone-400 hover:text-[#111111] active:scale-95 disabled:opacity-30 bg-transparent border-none shadow-none hover:bg-stone-100"
    };
    
    return (
      <motion.button ref={ref} whileTap={!props.disabled ? { scale: 0.96 } : undefined} className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props} >
        {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
        {label && <span className="hidden xl:inline tracking-tight">{label}</span>}
      </motion.button>
    );
});
UnifiedAction.displayName = "UnifiedAction";

const PdfCard = ({ file, isDragging, onRemove, onPreview, isMobile }: any) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDragging ? 0.6 : 1,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging 
            ? '0 10px 30px rgba(0,0,0,0.1)' 
            : '0 2px 10px rgba(0,0,0,0.03)',
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={!isDragging ? { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative overflow-hidden group select-none bg-white border border-stone-200 rounded-2xl
        ${isDragging ? 'shadow-2xl z-50 cursor-grabbing bg-white ring-2 ring-[#111111]' : ''}
        w-full aspect-[3/4] flex flex-col
      `}
    >
      {/* Remove Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
        className={`
          absolute top-3 left-3 z-30 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer 
          bg-white/90 backdrop-blur-sm border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50
          opacity-0 group-hover:opacity-100 scale-90 hover:scale-100
          ${isMobile ? 'opacity-100' : ''}
        `}
      >
        <Trash2 size={14} />
      </button>

      {/* Thumbnail Area */}
      <div className="flex-1 bg-stone-50/50 flex items-center justify-center p-4 relative overflow-hidden">
         {file.thumbnail ? (
            <img src={file.thumbnail} className="max-w-full max-h-full object-contain shadow-sm bg-white" />
         ) : (
            <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center text-stone-400">
               <Loader2 className="animate-spin" size={20} />
            </div>
         )}
      </div>

      {/* Footer Info */}
      <div className={`h-14 bg-white border-t border-stone-100 p-3 flex flex-col justify-center gap-0.5 transition-colors`}>
         <span className="text-xs font-bold text-[#111111] truncate">{file.file.name}</span>
         <span className={`text-[10px] font-mono text-stone-500`}>
            {formatSize(file.file.size)}
         </span>
      </div>
    </motion.div>
  );
};

const SortablePdf: React.FC<any> = ({ file, onRemove, onPreview, isMobile, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none touch-manipulation">
      <PdfCard 
        file={file} 
        isDragging={isDragging} 
        onRemove={onRemove}
        onPreview={onPreview}
        isMobile={isMobile}
        {...props} 
      />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export const PdfToZipPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [result, setResult] = useState<ZipResultState | null>(null);
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // --- Handlers ---

  const handleUpload = useCallback(async (uploadedFiles: File[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProgress(5);
    setStatus('Analyzing PDFs...');

    const newFiles: PdfFileItem[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const thumbnail = await generatePdfThumbnail(file);
        newFiles.push({
            id: nanoid(),
            file,
            status: 'pending',
            progress: 0,
            thumbnail
        });
        setProgress(5 + ((i + 1) / uploadedFiles.length) * 90);
    }

    setProgress(100);
    setTimeout(() => {
        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessing(false);
        setProgress(0);
        setStatus('');
        addToast("Success", `Added ${uploadedFiles.length} files`, "success");
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, 400);

  }, [isProcessing, addToast]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) handleUpload(acceptedFiles);
  };

  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    noClick: true, 
    noKeyboard: true, 
    disabled: isProcessing 
  });

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
    setStatus('');
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Starting conversion...');
    
    let totalOriginal = 0;
    const zip = new JSZip();
    const total = files.length;

    try {
        for (let i = 0; i < total; i++) {
            const fileData = files[i];
            setStatus(`Extracting ${fileData.file.name}...`);
            totalOriginal += fileData.file.size;
            
            // Extract images
            const images = await extractImagesFromPdf(
                fileData.file, 
                (p) => setProgress(Math.round(((i + p/100) / total) * 80)), // Map to first 80%
                undefined // No internal status update needed
            );
            
            // Add to zip folder per PDF
            const folderName = fileData.file.name.replace(/\.pdf$/i, "");
            const folder = zip.folder(folderName);
            
            images.forEach((img, idx) => {
                const imgName = `page-${idx + 1}.jpg`;
                folder?.file(imgName, img.file);
            });
            
            // Update status to done for this file (visually)
            setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'done', progress: 100 } : f));
        }

        setStatus('Compressing archive...');
        const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
             setProgress(80 + (metadata.percent * 0.2));
        });
        
        setResult({
            originalSize: totalOriginal,
            finalSize: content.size,
            blob: content,
            fileName: 'converted_images_EZtify.zip'
        });
        
        addToast("Success", "Archive created", "success");

    } catch (e) {
        console.error(e);
        addToast("Error", "Conversion failed", "error");
    } finally {
        setIsProcessing(false);
        setProgress(0);
        setStatus('');
    }
  };

  const handleDownloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(e.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex(p => p.id === active.id);
      const newIndex = files.findIndex(p => p.id === over.id);
      setFiles(arrayMove(files, oldIndex, newIndex));
    }
  };

  const activeDragItem = activeDragId ? files.find(i => i.id === activeDragId) : null;

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-[#FAF9F6] text-[#111111]" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Add PDFs" variant="slate" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-8 relative">
        <AnimatePresence>
            {isProcessing && files.length > 0 && (
                <ProcessingOverlay progress={progress} status={status} />
            )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
            {result ? (
                // RESULT STATE
                <div key="result" className="flex-1 flex items-center justify-center">
                    <ResultView 
                        result={result} 
                        onDownload={handleDownloadResult} 
                        onReset={handleReset} 
                    />
                </div>
            ) : files.length === 0 ? (
                // EMPTY STATE
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex items-center justify-center"
                >
                    <div className="w-full max-w-lg aspect-square md:aspect-video">
                        <UnifiedUploadCard 
                            onUpload={() => fileInputRef.current?.click()} 
                            isProcessing={isProcessing} 
                            progress={progress} 
                            status={status} 
                            isMobile={isMobile} 
                        />
                    </div>
                </motion.div>
            ) : (
                // POPULATED DASHBOARD
                <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col w-full max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden"
                >
                    {/* Toolbar */}
                    <div className="h-20 shrink-0 border-b border-stone-100 flex items-center justify-between px-6 md:px-8 bg-white z-20">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-[#111111] tracking-tight">PDF to ZIP</h2>
                            <span className="px-3 py-1 bg-stone-100 rounded-full text-xs font-bold text-stone-500 font-mono">
                                {files.length} FILES
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <UnifiedAction 
                                onClick={() => setFiles([])} 
                                icon={<RefreshCw />} 
                                label={isMobile ? undefined : "Reset"}
                                variant="default"
                            />
                            <UnifiedAction 
                                onClick={() => fileInputRef.current?.click()} 
                                icon={<Plus />} 
                                label={isMobile ? undefined : "Add"}
                                variant="default"
                                className="bg-stone-50"
                            />
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#FAFAFA]">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {files.map((file) => (
                                            <SortablePdf 
                                                key={file.id}
                                                file={file}
                                                onRemove={handleDelete}
                                                onPreview={() => {}}
                                                isMobile={isMobile}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </SortableContext>
                            {createPortal(
                                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                                    {activeDragItem ? (
                                        <div className="w-48"><PdfCard file={activeDragItem} isDragging onRemove={() => {}} onPreview={() => {}} /></div>
                                    ) : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </DndContext>
                        
                        {/* Add More Placehoder */}
                        <motion.button
                            layout
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 w-full h-20 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-3 text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <Plus size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Add more files</span>
                        </motion.button>
                    </div>

                    {/* Footer Controls */}
                    <div className="shrink-0 p-6 border-t border-stone-100 bg-white flex flex-col md:flex-row items-center gap-6 z-20">
                        
                        <div className="w-full md:w-auto flex-1 min-w-0">
                            {/* Empty spacer or config if needed later */}
                        </div>

                        {/* Action Button */}
                        <div className="w-full md:w-auto flex gap-3">
                            <EZButton 
                                variant="primary" 
                                onClick={handleConvert}
                                disabled={isProcessing}
                                isLoading={isProcessing}
                                className="!h-14 !px-10 !rounded-2xl !bg-[#111111] !text-white shadow-xl w-full md:w-auto"
                                icon={!isProcessing && <FileArchive size={20} />}
                            >
                                {isProcessing ? 'Archiving...' : 'Convert to ZIP'}
                            </EZButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
