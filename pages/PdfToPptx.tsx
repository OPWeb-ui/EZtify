
// ... existing imports
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToPptx, PptxConfig } from '../services/pdfToPptxConverter';
import { generatePdfThumbnail } from '../services/pdfThumbnail';
import { nanoid } from 'nanoid';
import { useDropzone } from 'react-dropzone';
import { 
  Trash2, Plus, X, Check,
  Presentation, Download, RefreshCw, Loader2, ArrowRight,
  LayoutTemplate, Monitor, Ratio, FileText, FilePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { EZButton } from '../components/EZButton';

const WORKSPACE_CARD_LAYOUT_ID = "pdf-pptx-card-surface";

// ... existing Confetti component ...
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

// ... existing interfaces ...
interface PptxFileItem {
  id: string;
  file: File;
  thumbnail: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  resultBlob?: Blob;
  slideCount?: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            relative flex flex-col items-center justify-center w-full max-w-lg aspect-[4/3] rounded-[3rem] 
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
                       <div className="w-1/2 h-1.5 bg-stone-200 rounded-full" />
                       <div className="w-full h-1.5 bg-stone-100 rounded-full" />
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
                           <span className="text-[10px] font-black text-[#111111] uppercase tracking-[0.25em]">PDF to PPTX</span>
                        </div>
                     )}
                     <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[#111111] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-sm relative">
                         <div className="absolute inset-2 rounded-full border border-dashed border-stone-300" />
                         <Presentation size={40} strokeWidth={2.5} />
                     </div>
                     <span className="text-xl font-bold text-[#111111]">PDF to PPTX</span>
                     <span className="text-sm font-medium text-stone-400 mt-2">
                         {isMobile ? 'Tap to load PDF' : 'Drag & drop or click to load'}
                     </span>
                </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ... rest of the file
const ProcessingOverlay = ({ progress, status }: { progress: number, status: string }) => (
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
            <Presentation size={40} strokeWidth={2} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Converting PDF</h2>
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

const ResultView: React.FC<{ 
  fileItem: PptxFileItem; 
  layout: string;
  onDownload: () => void; 
  onReset: () => void 
}> = ({ fileItem, layout, onDownload, onReset }) => {
    const getRatioLabel = (layout: string) => {
        if (layout === '16x9') return '16:9';
        if (layout === '4x3') return '4:3';
        return 'Auto';
    };

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

            <h2 className="text-3xl font-bold text-[#111111] mb-2 tracking-tight z-10">PDF Converted to PPTX</h2>
            <p className="text-stone-500 font-medium mb-8 z-10">Your document is ready for download.</p>

            <div className="w-full bg-stone-50 rounded-2xl p-5 border border-stone-100 mb-8 flex flex-col items-center gap-3 z-10 shadow-inner">
                <span className="text-sm font-bold text-[#111111] break-all line-clamp-1 px-4 max-w-full">
                    {fileItem.file.name.replace(/\.pdf$/i, '')}_EZtify.pptx
                </span>
                
                <div className="w-12 h-px bg-stone-200/80" />

                <div className="flex items-center justify-center gap-6 w-full">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Slides</span>
                        <span className="text-base font-bold text-[#111111] font-mono">{fileItem.slideCount}</span>
                    </div>
                    
                    <div className="w-px h-8 bg-stone-200" />

                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Ratio</span>
                        <span className="text-base font-bold text-emerald-600 font-mono">
                            {getRatioLabel(layout)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full z-10 relative">
                <EZButton 
                    variant="primary" 
                    onClick={onDownload} 
                    className="!h-14 !text-base !rounded-2xl shadow-xl shadow-stone-200 !bg-[#111111]" 
                    icon={<Download size={20} />}
                    fullWidth
                >
                    Download PPTX
                </EZButton>
                <EZButton 
                    variant="ghost" 
                    onClick={onReset} 
                    className="!h-12 !rounded-2xl text-stone-500 hover:text-stone-900"
                    fullWidth
                >
                    Convert Another
                </EZButton>
            </div>
        </motion.div>
    );
};

export const PdfToPptxPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State - Simplified for Single File
  const [fileItem, setFileItem] = useState<PptxFileItem | null>(null);
  const [pptxConfig, setPptxConfig] = useState<PptxConfig>({ layout: 'auto' });
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleUpload = useCallback(async (uploadedFiles: File[]) => {
    if (isProcessing || uploadedFiles.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setStatus('Analyzing document...');

    const file = uploadedFiles[0];
    try {
        const thumbnail = await generatePdfThumbnail(file);
        // Ensure progress is visible
        setProgress(60);
        await new Promise(r => setTimeout(r, 400));
        setProgress(100);
        
        setTimeout(() => {
          setFileItem({
              id: nanoid(),
              file,
              thumbnail,
              status: 'pending',
              progress: 0
          });
          setIsProcessing(false);
          setProgress(0);
          setStatus('');
          addToast("Success", "PDF loaded", "success");
        }, 300);
    } catch (e) {
        setIsProcessing(false);
        addToast("Error", "Could not read PDF", "error");
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isProcessing, addToast]);

  const onDrop = (acceptedFiles: File[]) => handleUpload(acceptedFiles);
  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    noClick: true, 
    noKeyboard: true,
    multiple: false,
    disabled: isProcessing 
  });

  const handleReset = () => {
    setFileItem(null);
    setProgress(0);
    setStatus('');
  };

  const handleConvert = async () => {
    if (!fileItem) return;
    setIsProcessing(true);
    setStatus('Converting to PPTX...');
    
    try {
        const { blob, slideCount } = await convertPdfToPptx(
            fileItem.file, 
            'all', 
            pptxConfig,
            (p) => setProgress(p),
            (s) => setStatus(s)
        );
        
        setFileItem(prev => prev ? { 
            ...prev, 
            status: 'done', 
            resultBlob: blob, 
            slideCount: slideCount
        } : null);
        
        addToast("Success", "Conversion complete", "success");
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
    if (!fileItem?.resultBlob) return;
    const url = URL.createObjectURL(fileItem.resultBlob);
    const link = document.createElement('a');
    link.href = url;
    const namePart = fileItem.file.name.replace(/\.pdf$/i, '');
    link.download = `${namePart}_EZtify.pptx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-[#FAF9F6] text-[#111111]" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Drop PDF" variant="slate" icon={<FilePlus size={64} />} />
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-8 relative">
        <AnimatePresence>
            {isProcessing && fileItem && (
                <ProcessingOverlay progress={progress} status={status} />
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
            {!fileItem ? (
                // --- EMPTY / INITIAL UPLOAD STATE ---
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex items-center justify-center"
                >
                    <UnifiedUploadCard
                        onUpload={() => fileInputRef.current?.click()}
                        isProcessing={isProcessing}
                        progress={progress}
                        status={status}
                        isMobile={isMobile}
                    />
                </motion.div>
            ) : fileItem.status === 'done' ? (
                // --- SUCCESS STATE ---
                <div key="result" className="flex-1 flex items-center justify-center">
                    <ResultView 
                        fileItem={fileItem} 
                        layout={pptxConfig.layout}
                        onDownload={handleDownloadResult} 
                        onReset={handleReset} 
                    />
                </div>
            ) : (
                // --- WORKSPACE STATE ---
                <motion.div 
                    key="workspace"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="h-16 shrink-0 border-b border-stone-100 flex items-center justify-between px-8 bg-white z-20">
                        <div className="flex items-center gap-3">
                            <Presentation size={18} className="text-[#111111]" />
                            <h2 className="text-sm font-bold text-[#111111] tracking-tight uppercase">Conversion Engine</h2>
                        </div>
                        <button 
                            onClick={handleReset} 
                            className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 items-center justify-center bg-stone-50/30">
                        <div className="w-full max-w-sm space-y-8">
                            {/* File Card */}
                            <motion.div 
                                layoutId={WORKSPACE_CARD_LAYOUT_ID}
                                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex items-center p-4 gap-4"
                            >
                                <div className="w-20 h-24 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {fileItem.thumbnail ? (
                                        <img src={fileItem.thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText size={24} className="text-stone-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-[#111111] truncate">{fileItem.file.name}</h3>
                                    <p className="text-xs font-mono font-bold text-stone-400 mt-1">{formatSize(fileItem.file.size)}</p>
                                </div>
                            </motion.div>

                            {/* Config Area */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block text-center">Slide Aspect Ratio</span>
                                    <div className="bg-stone-100/50 p-1.5 rounded-2xl border border-stone-200 flex w-full">
                                        {[
                                            { id: 'auto', label: 'Auto', icon: <LayoutTemplate size={12}/> },
                                            { id: '16x9', label: '16:9', icon: <Monitor size={12}/> },
                                            { id: '4x3', label: '4:3', icon: <Ratio size={12}/> }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setPptxConfig({ layout: opt.id as any })}
                                                className={`
                                                    flex-1 py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5
                                                    ${pptxConfig.layout === opt.id 
                                                        ? 'bg-white shadow-sm text-[#111111] ring-1 ring-black/5' 
                                                        : 'text-stone-400 hover:text-stone-600'
                                                    }
                                                `}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <EZButton 
                                        variant="primary" 
                                        fullWidth 
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className="!h-16 !text-lg !rounded-2xl !bg-[#111111] !text-white shadow-xl"
                                        icon={<RefreshCw className={isProcessing ? 'animate-spin' : ''} size={20} />}
                                    >
                                        Convert to Slides
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
  );
};
