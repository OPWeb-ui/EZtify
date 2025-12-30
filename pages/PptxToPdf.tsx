
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPptxToPdf } from '../services/pptxConverter';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  Presentation, FileText, RefreshCw, 
  Plus, X, Check, 
  Download, ArrowRight, Play,
  Trash2, Archive, FileType
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EZButton } from '../components/EZButton';
import JSZip from 'jszip';

// Refined Motion Tokens
const listTransition = { type: "spring", stiffness: 500, damping: 40 };
const MAX_FILES = 5; // PPTX is heavy, limit to 5
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultName?: string;
}

export const PptxToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setQueue(prev => {
      const remainingSlots = MAX_FILES - prev.length;
      if (remainingSlots <= 0) {
        addToast("Limit Reached", `Maximum ${MAX_FILES} files allowed.`, "warning");
        return prev;
      }

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      if (acceptedFiles.length > remainingSlots) {
        addToast("Files Capped", `Only the first ${remainingSlots} files were added.`, "info");
      }

      const newItems: QueueItem[] = filesToAdd.map(f => ({
        id: nanoid(),
        file: f,
        status: 'pending',
        progress: 0
      }));

      // Size check
      const validItems = newItems.filter(item => {
        if (item.file.size > MAX_FILE_SIZE) {
          addToast("Size Limit", `${item.file.name} exceeds 100MB limit.`, "error");
          return false;
        }
        return true;
      });

      return [...prev, ...validItems];
    });
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }, 
    noClick: true, 
    noKeyboard: true, 
    multiple: true,
    disabled: isProcessingGlobal 
  });

  const handleConvert = async () => {
    const pending = queue.filter(item => item.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessingGlobal(true);

    // Sequential processing to preserve browser memory
    for (const item of pending) {
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      
      try {
        const blob = await convertPptxToPdf(
            item.file, 
            { pageSize: 'auto', orientation: 'landscape', fitMode: 'contain', margin: 0, quality: 1 },
            (p) => {
                setQueue(q => q.map(i => i.id === item.id ? { ...i, progress: p } : i));
            }
        );
        
        const resultName = item.file.name.replace(/\.[^/.]+$/, "") + "_EZtify.pdf";
        
        setQueue(q => q.map(i => i.id === item.id ? { 
            ...i, 
            status: 'completed', 
            resultBlob: blob, 
            resultName: resultName,
            progress: 100 
        } : i));

      } catch (e) {
        console.error(e);
        setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
        addToast("Error", `Failed to convert ${item.file.name}`, "error");
      }
    }

    setIsProcessingGlobal(false);
    addToast("Success", "Batch conversion complete.", "success");
  };

  const handleDownloadSingle = (item: QueueItem) => {
    if (!item.resultBlob || !item.resultName) return;
    const url = URL.createObjectURL(item.resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.resultName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    const completed = queue.filter(item => item.status === 'completed' && item.resultBlob);
    if (completed.length === 0) return;

    if (completed.length === 1) {
      handleDownloadSingle(completed[0]);
      return;
    }

    const zip = new JSZip();
    completed.forEach(item => {
      if (item.resultBlob && item.resultName) zip.file(item.resultName, item.resultBlob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "converted_slides_EZtify.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id));
  };

  const reset = () => {
    setQueue([]);
    setIsProcessingGlobal(false);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const hasPending = queue.some(i => i.status === 'pending');
  const allCompleted = queue.length > 0 && queue.every(i => i.status === 'completed' || i.status === 'error');

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 bg-nd-base overflow-hidden" {...getRootProps()}>
      <PageReadyTracker />
      <input {...getInputProps()} />
      
      <div className="w-full max-w-xl flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          {queue.length === 0 ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`
                w-full aspect-[4/3] rounded-[2.5rem] bg-white shadow-2xl shadow-black/5 
                border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all
                ${isDragActive ? 'border-violet-400 bg-violet-50/20 scale-[1.01]' : 'border-nd-border hover:border-violet-200'}
                cursor-pointer group
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pptx" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />
              <div className="w-16 h-16 bg-nd-subtle rounded-2xl flex items-center justify-center text-violet-600 mb-6 group-hover:scale-105 transition-transform shadow-sm border border-nd-border">
                <Presentation size={32} />
              </div>
              <h3 className="text-xl font-bold text-nd-primary mb-1">PPTX to PDF</h3>
              <p className="text-xs text-nd-muted font-medium uppercase tracking-widest font-mono">
                {isMobile ? 'Tap to mount Slides' : 'Drag or click to mount PPTX'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2.5rem] bg-white shadow-2xl shadow-black/5 p-5 md:p-8 border border-nd-border flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h3 className="text-sm font-bold text-nd-primary uppercase tracking-widest">Workspace</h3>
                    <p className="text-[10px] font-bold text-nd-muted font-mono">{queue.length} / {MAX_FILES} DECKS</p>
                </div>
                {!isProcessingGlobal && (
                    <button onClick={reset} className="p-2 text-nd-muted hover:text-rose-500 transition-colors" title="Reset All">
                        <RefreshCw size={16} />
                    </button>
                )}
              </div>

              {/* List Area */}
              <div className="flex-1 max-h-[40vh] overflow-y-auto custom-scrollbar mb-6 pr-1 space-y-3">
                <AnimatePresence mode="popLayout">
                    {queue.map((item) => (
                        <motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={listTransition}
                            className="flex items-center gap-4 p-4 bg-nd-subtle/50 rounded-2xl border border-nd-border group relative overflow-hidden"
                        >
                            {/* Progress Background */}
                            {item.status === 'processing' && (
                                <motion.div 
                                    className="absolute inset-0 bg-violet-500/10 origin-left z-0" 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: item.progress / 100 }}
                                />
                            )}

                            <div className="relative z-10 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm border border-nd-border shrink-0">
                                {item.status === 'completed' ? <Check size={20} className="text-emerald-500" /> : <Presentation size={20} />}
                            </div>
                            
                            <div className="relative z-10 flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-nd-primary truncate">{item.file.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] font-bold text-nd-muted font-mono uppercase">
                                        {item.status === 'processing' 
                                            ? `Converting ${Math.round(item.progress)}%` 
                                            : item.status === 'completed' 
                                                ? 'Ready to Download' 
                                                : item.status === 'error'
                                                    ? 'Conversion Failed'
                                                    : formatSize(item.file.size)
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center gap-1">
                                {item.status === 'completed' ? (
                                    <button onClick={() => handleDownloadSingle(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                        <Download size={16} />
                                    </button>
                                ) : (
                                    <button onClick={() => removeItem(item.id)} disabled={isProcessingGlobal} className="p-2 text-nd-muted hover:text-rose-500 transition-colors disabled:opacity-0">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add More Button */}
                {queue.length < MAX_FILES && !isProcessingGlobal && !allCompleted && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-14 border-2 border-dashed border-nd-border rounded-2xl flex items-center justify-center gap-2 text-nd-muted hover:border-violet-300 hover:text-violet-600 transition-all active:scale-[0.98]"
                    >
                        <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pptx" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />
                        <Plus size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Add more Slides</span>
                    </button>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0 flex gap-3">
                {allCompleted ? (
                    <>
                        <EZButton variant="secondary" fullWidth size="lg" onClick={reset} className="h-16 rounded-2xl">
                            New Session
                        </EZButton>
                        <EZButton variant="primary" fullWidth size="lg" onClick={handleDownloadAll} className="h-16 rounded-2xl !bg-emerald-600 shadow-emerald-500/10" icon={<Archive size={18} />}>
                            Download All
                        </EZButton>
                    </>
                ) : (
                    <EZButton 
                        variant="primary" 
                        fullWidth 
                        size="lg" 
                        onClick={handleConvert} 
                        disabled={!hasPending || isProcessingGlobal}
                        isLoading={isProcessingGlobal}
                        className="h-16 rounded-2xl shadow-xl !bg-violet-600 shadow-violet-500/10" 
                        icon={!isProcessingGlobal && <Play size={18} fill="currentColor" />}
                    >
                        {isProcessingGlobal ? 'Converting...' : 'Start Conversion'}
                    </EZButton>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  );
};
