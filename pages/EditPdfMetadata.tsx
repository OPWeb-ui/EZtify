
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { getPdfMetadata, updatePdfMetadata, PdfMetadata } from '../services/pdfMetadata';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, Info, Save, RefreshCw, Plus, X, Download, 
  Check, ArrowRight, ShieldCheck, Tag, User, AlignLeft,
  Settings, PenTool, Layout, FilePlus, Monitor, Trash2, FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { EZButton } from '../components/EZButton';
import { IconBox } from '../components/IconBox';

const WORKSPACE_CARD_LAYOUT_ID = "pdf-metadata-card-surface";

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
  originalMetadata: PdfMetadata;
  status: 'idle' | 'processing' | 'done' | 'error';
}

const MetadataField = ({ label, value, icon: Icon, readOnly = false, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={12} className="text-nd-muted" />}
      <label className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">{label}</label>
    </div>
    {readOnly ? (
      <div className="w-full min-h-[44px] px-4 py-3 bg-nd-subtle/40 border border-nd-border rounded-xl text-sm font-medium text-nd-secondary truncate">
        {value || <span className="opacity-30 italic">Not defined</span>}
      </div>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 bg-white border border-nd-border rounded-xl text-sm font-bold text-nd-primary focus:ring-4 focus:ring-accent-lime/10 focus:border-nd-primary outline-none transition-all placeholder:text-nd-muted/40"
      />
    )}
  </div>
);

const ResultView: React.FC<{ 
  fileItem: PdfFileItem; 
  updatedMetadata: PdfMetadata; 
  onDownload: () => void; 
  onEditAgain: () => void 
}> = ({ fileItem, updatedMetadata, onDownload, onEditAgain }) => {
    const original = fileItem.originalMetadata;

    const diffs = useMemo(() => {
        const items = [];
        if (original.title !== updatedMetadata.title) items.push({ label: 'Title', from: original.title, to: updatedMetadata.title });
        if (original.author !== updatedMetadata.author) items.push({ label: 'Author', from: original.author, to: updatedMetadata.author });
        if (original.subject !== updatedMetadata.subject) items.push({ label: 'Subject', from: original.subject, to: updatedMetadata.subject });
        if (original.keywords !== updatedMetadata.keywords) items.push({ label: 'Keywords', from: original.keywords, to: updatedMetadata.keywords });
        return items;
    }, [original, updatedMetadata]);

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

            <h2 className="text-3xl font-bold text-[#111111] mb-2 tracking-tight z-10">Metadata Updated</h2>
            <p className="text-stone-500 font-medium mb-8 z-10">Your PDF metadata has been successfully applied.</p>

            {diffs.length > 0 && (
                 <div className="w-full space-y-4 mb-8 text-left bg-stone-50 rounded-2xl p-6 border border-stone-100 z-10 relative shadow-inner">
                     {diffs.map(d => (
                         <div key={d.label} className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{d.label}</span>
                             <div className="flex items-center gap-3 min-w-0">
                                 <span className="text-xs text-stone-400 truncate max-w-[40%] line-through decoration-stone-300">{d.from || '(Empty)'}</span>
                                 <ArrowRight size={12} className="text-accent-lime shrink-0" />
                                 <span className="text-sm font-bold text-[#111111] truncate flex-1">{d.to || '(Empty)'}</span>
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            <div className="flex flex-col gap-3 w-full z-10 relative">
                <EZButton 
                    variant="primary" 
                    onClick={onDownload} 
                    className="!h-14 !text-base !rounded-2xl shadow-xl shadow-stone-200 !bg-[#111111]" 
                    icon={<Download size={20} />}
                    fullWidth
                >
                    Download PDF
                </EZButton>
                <EZButton 
                    variant="ghost" 
                    onClick={onEditAgain} 
                    className="!h-12 !rounded-2xl text-stone-500 hover:text-stone-900"
                    fullWidth
                >
                    Continue Editing
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
                           <span className="text-[10px] font-black text-[#111111] uppercase tracking-[0.25em]">Metadata Editor</span>
                        </div>
                     )}
                     <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-stone-300" />
                         <PenTool size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111] group-hover:text-stone-600 transition-colors">
                         Select PDF
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

export const EditPdfMetadataPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileItem, setFileItem] = useState<PdfFileItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [updatedMetadata, setUpdatedMetadata] = useState<PdfMetadata>({
    title: '', author: '', subject: '', keywords: '', creator: '', producer: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleUpload = useCallback(async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0) return;
    setIsProcessing(true);
    setStatus('Analyzing document...');
    setProgress(20);
    
    const file = uploadedFiles[0];
    try {
      const meta = await getPdfMetadata(file);
      setProgress(100);
      
      setTimeout(() => {
        setFileItem({
          id: nanoid(),
          file,
          originalMetadata: meta,
          status: 'idle'
        });
        setUpdatedMetadata(meta);
        setIsProcessing(false);
        setProgress(0);
        setStatus('');
        addToast("Success", "PDF loaded for editing", "success");
      }, 300);
    } catch (e) {
      setIsProcessing(false);
      addToast("Error", "Could not read PDF metadata", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [addToast]);

  const onDrop = (acceptedFiles: File[]) => handleUpload(acceptedFiles);
  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    noClick: true, 
    noKeyboard: true,
    multiple: false
  });

  const handleApply = async () => {
    if (!fileItem) return;
    setIsProcessing(true);
    setStatus('Applying metadata...');
    setProgress(1);

    try {
      const blob = await updatePdfMetadata(fileItem.file, updatedMetadata, (p) => {
         setProgress(p);
      });

      setResultBlob(blob);
      setFileItem({ ...fileItem, status: 'done' });
      setIsSuccess(true);
      addToast("Done", "Metadata updated successfully", "success");
    } catch (e) {
      addToast("Error", "Failed to apply changes", "error");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !fileItem) return;
    const url = URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited_${fileItem.file.name}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFileItem(null);
    setIsSuccess(false);
    setResultBlob(null);
    setUpdatedMetadata({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
  };

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-nd-base text-nd-primary" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Replace PDF" variant="slate" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-12 relative">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 h-full">
          
          <AnimatePresence mode="wait">
            {!fileItem ? (
              <motion.div 
                key="upload-container" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
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
            ) : isSuccess ? (
                <div key="result" className="flex-1 flex items-center justify-center">
                    <ResultView 
                        fileItem={fileItem} 
                        updatedMetadata={updatedMetadata} 
                        onDownload={handleDownload} 
                        onEditAgain={() => setIsSuccess(false)} 
                    />
                </div>
            ) : (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10 pb-32"
              >
                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 border-b border-nd-border pb-8">
                  <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="h-10 px-4 flex items-center gap-2 rounded-xl bg-nd-subtle text-nd-secondary hover:text-nd-primary transition-all text-[11px] font-bold uppercase tracking-widest border border-nd-border">
                      <RefreshCw size={14} /> Clear Session
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="h-10 px-4 flex items-center gap-2 rounded-xl bg-nd-primary text-white hover:opacity-90 transition-all text-[11px] font-bold uppercase tracking-widest shadow-sm">
                      <FileEdit size={14} /> Change Source
                    </button>
                  </div>
                </div>

                {/* CURRENT FILE CARD */}
                <div className="bg-white rounded-3xl border border-nd-border shadow-soft p-6 flex items-center justify-between group transition-all hover:border-nd-muted">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-nd-subtle border border-nd-border flex items-center justify-center text-nd-primary transition-transform group-hover:scale-105">
                      <FileText size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-nd-primary text-base truncate max-w-[200px] md:max-w-md">{fileItem.file.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-nd-muted uppercase tracking-widest font-mono">Active_Buffer</span>
                        <div className="w-1 h-1 rounded-full bg-accent-lime animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleReset}
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-rose-50 text-nd-muted hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                    title="Flush file from memory"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* EDITOR GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <IconBox icon={<Monitor />} size="xs" variant="transparent" />
                      <h2 className="text-xs font-bold text-nd-muted uppercase tracking-[0.2em] font-mono">Extracted_Source</h2>
                    </div>
                    
                    <div className="bg-nd-surface rounded-4xl p-8 border border-nd-border shadow-sm space-y-6">
                       <MetadataField readOnly label="Title" value={fileItem.originalMetadata.title} icon={Layout} />
                       <MetadataField readOnly label="Author" value={fileItem.originalMetadata.author} icon={User} />
                       <MetadataField readOnly label="Subject" value={fileItem.originalMetadata.subject} icon={AlignLeft} />
                       <MetadataField readOnly label="Keywords" value={fileItem.originalMetadata.keywords} icon={Tag} />
                       <div className="grid grid-cols-2 gap-6">
                        <MetadataField readOnly label="Creator" value={fileItem.originalMetadata.creator} icon={PenTool} />
                        <MetadataField readOnly label="Producer" value={fileItem.originalMetadata.producer} icon={Settings} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <IconBox icon={<Check />} size="xs" active toolAccentColor="#111111" />
                      <h2 className="text-xs font-bold text-nd-primary uppercase tracking-[0.2em] font-mono">Output_Profile</h2>
                    </div>

                    <div className="bg-nd-surface rounded-4xl p-8 border-2 border-nd-primary shadow-2xl relative space-y-6">
                       <MetadataField 
                          label="Title" 
                          value={updatedMetadata.title} 
                          onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, title: v})}
                          placeholder="Document display title"
                          icon={Layout}
                       />
                       <MetadataField 
                          label="Author" 
                          value={updatedMetadata.author} 
                          onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, author: v})}
                          placeholder="Individual or organization"
                          icon={User}
                       />
                       <MetadataField 
                          label="Subject" 
                          value={updatedMetadata.subject} 
                          onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, subject: v})}
                          placeholder="Brief description of contents"
                          icon={AlignLeft}
                       />
                       <MetadataField 
                          label="Keywords" 
                          value={updatedMetadata.keywords} 
                          onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, keywords: v})}
                          placeholder="Tags, separated by commas"
                          icon={Tag}
                       />
                       <div className="grid grid-cols-2 gap-6">
                        <MetadataField 
                            label="Creator" 
                            value={updatedMetadata.creator} 
                            onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, creator: v})}
                            placeholder="Creator app"
                            icon={PenTool}
                        />
                        <MetadataField 
                            label="Producer" 
                            value={updatedMetadata.producer} 
                            onChange={(v: string) => setUpdatedMetadata({...updatedMetadata, producer: v})}
                            placeholder="PDF generator"
                            icon={Settings}
                        />
                       </div>

                       <div className="pt-6">
                          <EZButton 
                            variant="primary" 
                            fullWidth 
                            onClick={handleApply} 
                            disabled={isProcessing}
                            isLoading={isProcessing}
                            className="!h-16 !text-sm !rounded-2xl !bg-nd-primary !text-white shadow-xl hover:scale-[1.01] active:scale-95 uppercase tracking-widest font-mono"
                            icon={!isProcessing && <Save size={20} />}
                          >
                            Execute Update
                          </EZButton>
                       </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <AnimatePresence>
        {isProcessing && fileItem && progress > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-nd-base/90 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
             <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
             >
                <div className="w-24 h-24 bg-nd-primary text-white rounded-4xl flex items-center justify-center mb-8 shadow-2xl">
                  <RefreshCw size={40} className="animate-spin" />
                </div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Updating Metadata</h3>
                <p className="text-nd-secondary font-medium mb-12 text-center leading-relaxed">Processing document bytes in secure browser memory. This may take a few seconds for larger files.</p>
                
                <div className="w-full bg-nd-subtle h-2 rounded-full overflow-hidden mb-4 border border-nd-border">
                  <motion.div 
                    className="h-full bg-accent-lime" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-nd-muted uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                   <span>Status: {progress}% committed</span>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
