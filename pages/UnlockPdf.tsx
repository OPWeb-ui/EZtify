
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { isPdfEncrypted, unlockPdf } from '../services/pdfSecurity';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  UnlockKeyhole, Lock, RefreshCw, 
  Plus, X, Check, 
  Download, Play,
  KeyRound, Eye, EyeOff, ShieldCheck, Archive, FileKey2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EZButton } from '../components/EZButton';
import JSZip from 'jszip';

// --- CONSTANTS & TYPES ---
const MAX_FILES = 20;
const LIST_TRANSITION = { type: "spring", stiffness: 500, damping: 40 };

interface QueueItem {
  id: string;
  file: File;
  status: 'analyzing' | 'locked' | 'unlocked' | 'processing' | 'completed' | 'failed';
  message?: string;
  progress: number;
  resultBlob?: Blob;
  resultName?: string;
}

export const UnlockPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);

  // --- LOGIC ---
  
  // Are there any files that actually need a password?
  const hasLockedItems = useMemo(() => {
    return queue.some(i => i.status === 'locked' || i.status === 'failed');
  }, [queue]);

  const allCompleted = queue.length > 0 && queue.every(i => i.status === 'completed' || i.status === 'unlocked' || i.status === 'failed');
  
  // Count only files that we have a valid result for (either originally open or unlocked)
  const successCount = queue.filter(i => (i.status === 'completed' || i.status === 'unlocked') && (i.resultBlob || !isPdfEncrypted)).length;

  const processFileAnalysis = async (item: QueueItem): Promise<QueueItem> => {
    try {
      // Artificial delay for smooth UI feel (analyzing state)
      await new Promise(r => setTimeout(r, 600));
      const isEnc = await isPdfEncrypted(item.file);
      
      if (!isEnc) {
          // If not encrypted, it's effectively "completed" or "unlocked" immediately
          // We treat it as 'unlocked' so we can show a green check but distinct from "unlocked by password"
          return { 
            ...item, 
            status: 'unlocked', 
            progress: 100,
            message: 'Already Open',
            resultBlob: item.file, // The original file is the result
            resultName: item.file.name
          };
      }

      return { 
        ...item, 
        status: 'locked', 
        progress: 0,
        message: 'Password Protected'
      };
    } catch (e) {
      return { ...item, status: 'failed', message: 'Corrupt File' };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const newItems: QueueItem[] = acceptedFiles.slice(0, MAX_FILES - queue.length).map(f => ({
      id: nanoid(),
      file: f,
      status: 'analyzing',
      progress: 0,
      message: 'Detecting security...'
    }));

    if (newItems.length === 0) {
        addToast("Limit Reached", "Maximum file limit reached.", "warning");
        return;
    }

    setQueue(prev => [...prev, ...newItems]);

    // Analyze in background
    const analyzedItems = await Promise.all(newItems.map(processFileAnalysis));
    
    setQueue(prev => prev.map(p => {
        const analyzed = analyzedItems.find(a => a.id === p.id);
        return analyzed || p;
    }));

  }, [queue.length, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    noClick: true, 
    noKeyboard: true, 
    multiple: true,
    disabled: isProcessingGlobal 
  });

  const handleUnlock = async () => {
    if (!password) {
        addToast("Password Required", "Please enter the PDF password.", "warning");
        return;
    }

    setIsProcessingGlobal(true);

    // Only target locked files or failed files (retry)
    const targets = queue.filter(i => i.status === 'locked' || i.status === 'failed');

    for (const item of targets) {
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing', message: 'Decrypting...', progress: 10 } : i));
      
      try {
        const blob = await unlockPdf(item.file, password, (p) => {
            setQueue(q => q.map(i => i.id === item.id ? { ...i, progress: p } : i));
        });
        
        setQueue(q => q.map(i => i.id === item.id ? { 
            ...i, 
            status: 'completed', 
            progress: 100, 
            message: 'Unlocked',
            resultBlob: blob, 
            resultName: `unlocked_${item.file.name}` 
        } : i));

      } catch (e) {
        setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'failed', message: 'Wrong Password', progress: 0 } : i));
      }
    }

    setIsProcessingGlobal(false);
    // Do not clear password immediately in case they want to retry or add more files with same pass
    // Actually, usually safer to clear, but for UX on multiple fails, maybe keep it?
    // Let's clear if at least one success to encourage security.
    if (queue.some(i => i.status === 'completed')) {
        setPassword('');
    }
    
    const anyFailed = queue.some(i => i.status === 'failed');
    if (!anyFailed) {
        addToast("Success", "Documents unlocked.", "success");
    } else {
        addToast("Warning", "Some files could not be unlocked.", "warning");
    }
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
    const validItems = queue.filter(i => (i.status === 'completed' || i.status === 'unlocked') && i.resultBlob);
    if (validItems.length === 0) return;

    if (validItems.length === 1) {
        handleDownloadSingle(validItems[0]);
        return;
    }

    const zip = new JSZip();
    validItems.forEach(item => {
        if (item.resultBlob && item.resultName) {
            zip.file(item.resultName, item.resultBlob);
        }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = "unlocked_documents_EZtify.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id));
  };

  const reset = () => {
    setQueue([]);
    setPassword('');
    setIsProcessingGlobal(false);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 bg-nd-base overflow-hidden font-sans" {...getRootProps()}>
      <PageReadyTracker />
      <input {...getInputProps()} />
      
      <div className="w-full max-w-xl flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* --- EMPTY STATE --- */}
          {queue.length === 0 ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`
                w-full aspect-[4/3] rounded-[2.5rem] bg-white dark:bg-charcoal-800 shadow-2xl shadow-black/5 dark:shadow-black/20
                border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all
                ${isDragActive ? 'border-violet-400 bg-violet-50/20 scale-[1.01]' : 'border-nd-border hover:border-violet-200'}
                cursor-pointer group
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />
              <div className="w-16 h-16 bg-nd-subtle rounded-2xl flex items-center justify-center text-violet-600 mb-6 group-hover:scale-105 transition-transform shadow-sm border border-nd-border">
                <UnlockKeyhole size={32} />
              </div>
              <h3 className="text-xl font-bold text-nd-primary mb-1">Unlock PDF</h3>
              <p className="text-xs text-nd-muted font-medium uppercase tracking-widest font-mono">
                {isMobile ? 'Tap to load locked files' : 'Drag locked files here'}
              </p>
            </motion.div>
          ) : (
            
            /* --- WORKSPACE STATE --- */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2.5rem] bg-white dark:bg-charcoal-900 shadow-2xl shadow-black/5 dark:shadow-black/20 p-5 md:p-8 border border-nd-border flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h3 className="text-sm font-bold text-nd-primary uppercase tracking-widest flex items-center gap-2">
                        Unlock PDF
                        {hasLockedItems && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600">
                                SECURED
                            </span>
                        )}
                    </h3>
                    <p className="text-[10px] font-bold text-nd-muted font-mono mt-1">{queue.length} DOCUMENTS</p>
                </div>
                {!isProcessingGlobal && (
                    <button onClick={reset} className="p-2 text-nd-muted hover:text-rose-500 transition-colors" title="Reset All">
                        <RefreshCw size={16} />
                    </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 max-h-[40vh] overflow-y-auto custom-scrollbar mb-6 pr-1 space-y-3">
                <AnimatePresence mode="popLayout">
                    {queue.map((item) => (
                        <motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={LIST_TRANSITION}
                            className={`
                                flex items-center gap-4 p-4 rounded-2xl border group relative overflow-hidden
                                ${item.status === 'failed' ? 'bg-rose-50 border-rose-200' : 
                                  (item.status === 'completed' || item.status === 'unlocked') ? 'bg-emerald-50/30 border-emerald-100' :
                                  item.status === 'locked' ? 'bg-amber-50/50 border-amber-100' :
                                  'bg-nd-subtle/50 border-nd-border'}
                            `}
                        >
                            {/* Progress Bar Background */}
                            {item.status === 'processing' && (
                                <motion.div 
                                    className="absolute inset-0 bg-violet-500/10 origin-left z-0" 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: item.progress / 100 }}
                                />
                            )}

                            {/* Icon State */}
                            <div className="relative z-10 w-10 h-10 bg-white dark:bg-charcoal-800 rounded-xl flex items-center justify-center shadow-sm border border-nd-border shrink-0">
                                {(item.status === 'completed' || item.status === 'unlocked') ? (
                                    <UnlockKeyhole size={20} className="text-emerald-500" /> 
                                ) : item.status === 'failed' ? (
                                    <X size={20} className="text-rose-500" />
                                ) : item.status === 'analyzing' ? (
                                    <RefreshCw size={18} className="animate-spin text-nd-muted" />
                                ) : item.status === 'locked' ? (
                                    <Lock size={18} className="text-amber-500" />
                                ) : (
                                    <FileKey2 size={18} className="text-slate-400" />
                                )}
                            </div>
                            
                            {/* File Info */}
                            <div className="relative z-10 flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-nd-primary truncate">{item.file.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-bold font-mono uppercase ${
                                        item.status === 'locked' ? 'text-amber-600' :
                                        (item.status === 'completed' || item.status === 'unlocked') ? 'text-emerald-600' :
                                        item.status === 'failed' ? 'text-rose-500' :
                                        'text-nd-muted'
                                    }`}>
                                        {item.status === 'analyzing' ? 'Detecting...' :
                                         item.status === 'processing' ? `${item.message} ${Math.round(item.progress)}%` :
                                         item.message}
                                    </span>
                                </div>
                            </div>

                            {/* Row Action */}
                            <div className="relative z-10 flex items-center gap-1">
                                {(item.status === 'completed' || item.status === 'unlocked') ? (
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

                {/* Add More */}
                {!isProcessingGlobal && queue.length < MAX_FILES && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-14 border-2 border-dashed border-nd-border rounded-2xl flex items-center justify-center gap-2 text-nd-muted hover:border-violet-300 hover:text-violet-600 transition-all active:scale-[0.98]"
                    >
                        <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />
                        <Plus size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Add Files</span>
                    </button>
                )}
              </div>

              {/* Password Input Area (Conditional) */}
              <AnimatePresence>
                {hasLockedItems && !allCompleted && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="space-y-2 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest">
                                Master Password
                            </label>
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Required</span>
                        </div>
                        <div className="relative group">
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isProcessingGlobal ? 'text-nd-muted' : 'text-violet-600'}`}>
                                <KeyRound size={16} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password to unlock..."
                                disabled={isProcessingGlobal}
                                className="w-full h-12 pl-10 pr-10 bg-nd-subtle border border-nd-border rounded-xl text-sm font-medium text-nd-primary placeholder:text-nd-muted focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all disabled:opacity-50"
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-nd-muted hover:text-nd-primary p-1 rounded-md transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-nd-muted leading-tight px-1 flex items-center gap-1.5">
                            <ShieldAlert size={10} />
                            This password will be tested against all locked files.
                        </p>
                    </motion.div>
                )}
              </AnimatePresence>

              {/* Footer Actions */}
              <div className="shrink-0 flex gap-3">
                {allCompleted ? (
                    <>
                        <EZButton variant="secondary" fullWidth size="lg" onClick={reset} className="h-14 rounded-2xl">
                            New Session
                        </EZButton>
                        <EZButton 
                            variant="primary" 
                            fullWidth 
                            size="lg" 
                            onClick={handleDownloadAll} 
                            disabled={queue.length === 0}
                            className="h-14 rounded-2xl !bg-emerald-600 shadow-emerald-500/10" 
                            icon={queue.length > 1 ? <Archive size={18} /> : <Download size={18} />}
                        >
                            {queue.length > 1 ? 'Download All' : 'Download PDF'}
                        </EZButton>
                    </>
                ) : (
                    <EZButton 
                        variant="primary" 
                        fullWidth 
                        size="lg" 
                        onClick={handleUnlock} 
                        disabled={!hasLockedItems || isProcessingGlobal || !password}
                        isLoading={isProcessingGlobal}
                        className={`h-14 rounded-2xl shadow-xl !bg-violet-600 shadow-violet-500/20`} 
                        icon={!isProcessingGlobal && <Play size={18} fill="currentColor" />}
                    >
                        {isProcessingGlobal ? 'Unlocking...' : 'Unlock Files'}
                    </EZButton>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  );
};
