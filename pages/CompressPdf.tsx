
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile, CompressionResult, CompressionLevel } from '../types';
import { compressPDF } from '../services/pdfCompressor';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  Minimize2, FileText, Settings, RefreshCw, Loader2, 
  FilePlus, Cpu, Lock, Zap, X, Trash2, CheckCircle2, 
  ArrowRight, Download, BarChart3, HardDrive, Play, Sliders,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { StickyBar } from '../components/StickyBar';
import { IconBox } from '../components/IconBox';

export const CompressPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // State
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [results, setResults] = useState<Map<string, CompressionResult>>(new Map());
  
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Configuration
  const [level, setLevel] = useState<CompressionLevel>('normal');
  const [isMobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const processDroppedFiles = useCallback(async (acceptedFiles: File[]) => {
    if (processingId) return;

    const newFiles: PdfFile[] = acceptedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (newFiles.length > 0) {
      setIsProcessingFiles(true);
      const startTime = Date.now();
      
      // Enforce 1s minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      setFiles(prev => [...prev, ...newFiles]);
      setIsProcessingFiles(false);
      addToast("Success", `Added ${newFiles.length} files.`, "success");
    }
  }, [addToast, processingId]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
    }
    if (acceptedFiles.length > 0) {
      processDroppedFiles(acceptedFiles);
    }
  }, [addToast, processDroppedFiles]);
  
  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    multiple: true,
    disabled: isProcessingFiles || !!processingId
  });
  
  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!!processingId) return;
    if (e.target.files && e.target.files.length > 0) {
      processDroppedFiles(Array.from(e.target.files));
    }
    if(e.target) e.target.value = '';
  };

  const handleCompress = async () => {
    // Filter files that are not yet compressed
    const queue = files.filter(f => !results.has(f.id));
    
    if (queue.length === 0) {
        addToast("Info", "All files already compressed.", "warning");
        return;
    }

    for (const pdf of queue) {
      setProcessingId(pdf.id);
      try {
        const result = await compressPDF(pdf, level, undefined, undefined);
        setResults(prev => new Map(prev).set(pdf.id, result));
      } catch (error) {
        console.error(error);
        addToast("Error", `Failed to compress ${pdf.file.name}`, "error");
      }
    }
    setProcessingId(null);
    addToast("Completed", "Batch compression finished.", "success");
  };

  const handleDownload = (result: CompressionResult) => {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResults(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const reset = () => {
      setFiles([]);
      setResults(new Map());
      setLevel('normal');
      setProcessingId(null);
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
      const processed: CompressionResult[] = Array.from(results.values());
      const originalTotal = processed.reduce((acc: number, r: CompressionResult) => acc + r.originalSize, 0);
      const newTotal = processed.reduce((acc: number, r: CompressionResult) => acc + r.newSize, 0);
      const savedBytes = Math.max(0, originalTotal - newTotal);
      const percentage = originalTotal > 0 ? Math.round((savedBytes / originalTotal) * 100) : 0;
      
      return { originalTotal, newTotal, savedBytes, percentage };
  }, [results]);

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  const renderFileList = () => (
    <AnimatePresence mode="popLayout" initial={false}>
      {files.map(file => {
        const result = results.get(file.id);
        const isProcessing = processingId === file.id;
        const isDone = !!result;
        
        return (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              group relative flex items-center gap-4 p-4 rounded-xl border transition-all
              bg-white dark:bg-charcoal-800
              ${isProcessing 
                  ? 'border-brand-purple ring-1 ring-brand-purple/20' 
                  : 'border-slate-200 dark:border-charcoal-700 hover:border-slate-300 dark:hover:border-charcoal-600 shadow-sm'
              }
            `}
          >
            <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border
                ${isDone 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900/30'}
            `}>
              {isDone ? <CheckCircle2 size={20} /> : <FileText size={20} />}
            </div>

            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center">
              <div>
                <h4 className="text-xs font-bold text-charcoal-900 dark:text-white font-mono truncate mb-1" title={file.file.name}>
                    {file.file.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-charcoal-500 dark:text-slate-400">
                    <HardDrive size={10} />
                    <span>{formatSize(file.file.size)} MB</span>
                </div>
              </div>

              <div className="flex items-center justify-start sm:justify-end">
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-brand-purple text-xs font-bold font-mono animate-pulse">
                      <Loader2 size={14} className="animate-spin" /> PROCESSING...
                  </div>
                ) : result ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-charcoal-900 dark:text-white font-mono">
                          {formatSize(result.newSize)} MB
                      </span>
                      <span className="block text-[10px] font-bold text-green-500 font-mono">
                          -{Math.round((1 - result.newSize / result.originalSize) * 100)}%
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-charcoal-300 dark:text-charcoal-600" />
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-charcoal-700 text-charcoal-500 dark:text-slate-400 text-[10px] font-bold font-mono uppercase tracking-wide">
                      Queued
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-slate-100 dark:border-charcoal-700 shrink-0">
              {result && (
                <motion.button whileTap={buttonTap} onClick={() => handleDownload(result)} className="p-2 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-lg shadow-md hover:scale-105 transition-transform" title="Download">
                  <Download size={16} />
                </motion.button>
              )}
              <motion.button whileTap={buttonTap} onClick={() => removeFile(file.id)} className="p-2 text-charcoal-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Remove" disabled={!!processingId}>
                <Trash2 size={16} />
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );

  const renderSettings = () => (
    <>
      <div className="bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 p-4 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3 text-charcoal-500 dark:text-slate-400">
            <BarChart3 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Performance</span>
        </div>
        <div className="flex items-end justify-between mb-2">
            <div>
                <span className="text-xs font-medium text-charcoal-500 dark:text-slate-400 block">Saved Space</span>
                <span className="text-xl font-bold font-mono text-brand-purple">{formatSize(stats.savedBytes)} MB</span>
            </div>
            <div className="text-right">
                <span className="text-xs font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded font-mono">
                    -{stats.percentage}%
                </span>
            </div>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-brand-purple"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentage}%` }}
                transition={{ duration: 0.5, ease: techEase }}
            />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
            Compression Level
        </label>
        <div className="space-y-2">
            {['normal', 'strong'].map((l) => {
                const isActive = level === l;
                return (
                    <button 
                        key={l}
                        onClick={() => setLevel(l as CompressionLevel)}
                        className={`
                            w-full p-3 rounded-xl border text-left transition-colors group relative z-10
                            ${isActive 
                                ? 'border-brand-purple text-brand-purple' 
                                : 'border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-slate-300 dark:hover:border-charcoal-600 text-charcoal-700 dark:text-slate-200'}
                        `}
                    >
                        {isActive && <motion.div layoutId="level-bg" className="absolute inset-0 bg-brand-purple/5 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                        
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs font-mono capitalize">{l === 'normal' ? 'Standard' : 'Strong'}</span>
                            {isActive && <div className="w-2 h-2 rounded-full bg-brand-purple" />}
                        </div>
                        <p className={`text-[10px] leading-tight ${isActive ? 'text-brand-purple/70' : 'text-charcoal-500 dark:text-slate-400'}`}>
                            {l === 'normal' ? 'Balanced quality. Good for documents & reading.' : 'Max reduction. Lowers image dpi (72dpi).'}
                        </p>
                    </button>
                )
            })}
        </div>
      </div>
    </>
  );

  // --- Render ---

  if (files.length === 0) {
    return (
      <ToolLandingLayout
        title="Compress PDF"
        description="Reduce the file size of your PDF documents while maintaining optimal visual quality."
        icon={<Minimize2 />}
        onDrop={(files) => processDroppedFiles(files)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={true}
        isProcessing={isProcessingFiles}
        accentColor="text-red-500"
        specs={[
          { label: "Method", value: "Downsample", icon: <Zap /> },
          { label: "Mode", value: "Lossy", icon: <Settings /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
        ]}
        tip="Compression happens locally. 'Strong' mode drastically reduces size but may lower image resolution."
      />
    );
  }

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 font-sans relative" {...getRootProps()}>
        <PageReadyTracker />
        <input ref={fileInputRef} type="file" className="hidden" multiple accept="application/pdf,.pdf" onChange={handleFileChange} disabled={!!processingId} />
        <DragDropOverlay isDragActive={isDragActive} message="Drop More PDFs" variant="red" />

        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
              <IconBox icon={<Minimize2 />} size="sm" toolAccentColor="#388E3C" active />
              <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Compressor</h3>
                  <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">{files.length} File{files.length !== 1 ? 's' : ''}</p>
              </div>
          </div>
          <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} disabled={!!processingId} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">
              <FilePlus size={16} /> Add
          </motion.button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-28">
          {renderFileList()}
        </div>

        {/* Floating Inspector */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl flex flex-col overflow-hidden"
          initial={false}
          animate={{ height: isMobileInspectorOpen ? 'auto' : '80px' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
           {/* Handle */}
           <div className="flex items-center justify-between px-6 h-20 shrink-0 relative" onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}>
              <div className="flex flex-col justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500">Savings</span>
                 <span className="text-sm font-bold text-charcoal-900 dark:text-white font-mono">{stats.percentage}% Reduced</span>
              </div>

              <div className="absolute left-1/2 top-3 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                 <button 
                    onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)} 
                    className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300"
                 >
                    {isMobileInspectorOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                 </button>
                 <motion.button
                    whileTap={buttonTap}
                    onClick={handleCompress} 
                    disabled={!!processingId}
                    className="h-12 px-6 bg-brand-purple text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {!!processingId ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                    <span>Run</span>
                 </motion.button>
              </div>
           </div>

           {/* Expanded Content */}
           <div className="bg-slate-50 dark:bg-charcoal-850 border-t border-slate-100 dark:border-charcoal-800 p-6 overflow-y-auto">
              {renderSettings()}
           </div>
        </motion.div>
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <input ref={fileInputRef} type="file" className="hidden" multiple accept="application/pdf,.pdf" onChange={handleFileChange} disabled={!!processingId} />
      <DragDropOverlay isDragActive={isDragActive} message="Drop More PDFs" variant="red" />
      
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-black/20 relative z-10">
          <div className="h-16 border-b border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-3">
                  <IconBox icon={<Minimize2 />} size="sm" toolAccentColor="#388E3C" active />
                  <div>
                      <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Compressor</h3>
                      <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">{files.length} Document{files.length !== 1 ? 's' : ''} Loaded</p>
                  </div>
              </div>
              <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} disabled={!!processingId} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent disabled:opacity-50">
                  <FilePlus size={16} /> <span className="hidden sm:inline">Add Files</span>
              </motion.button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">{renderFileList()}</div>
      </div>

      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Configuration</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">{renderSettings()}</div>
          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleCompress} 
                  disabled={!!processingId || files.length === 0} 
                  whileTap={buttonTap} 
                  className="relative overflow-hidden w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs tracking-wider uppercase rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                  <div className="relative flex items-center justify-center gap-2 z-10">
                      {!!processingId ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                      <span>{!!processingId ? 'COMPRESSING...' : 'RUN COMPRESSION'}</span>
                  </div>
              </motion.button>
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={reset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset Project
              </motion.button>
          </div>
      </div>
    </div>
  );
};
