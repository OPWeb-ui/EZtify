
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile, CompressionResult, CompressionLevel } from '../types';
import { compressPDF } from '../services/pdfCompressor';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Download, FileText, Settings, RefreshCw, Loader2, Minimize2, FilePlus, Cpu, Lock, Zap, Info, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const CompressPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [results, setResults] = useState<Map<string, CompressionResult>>(new Map());
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>('normal');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
    }
    
    const newFiles: PdfFile[] = acceptedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (newFiles.length > 0) {
      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${newFiles.length} files.`, "success");
      }, 500);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    multiple: true
  });

  const handleCompress = async () => {
    for (const pdf of files) {
      if (results.has(pdf.id)) continue;
      
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
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <ToolLandingLayout
            title="Compress PDF"
            description="Reduce the file size of your PDF documents while maintaining optimal visual quality."
            icon={<Minimize2 />}
            onDrop={onDrop}
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
            tip="Compression re-encodes images. 'Strong' mode significantly reduces size but may affect image clarity."
          />
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            
            <div className="w-full max-w-5xl mx-auto bg-white dark:bg-charcoal-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-charcoal-700 flex flex-col md:flex-row h-full md:h-[600px] ring-1 ring-black/5">
                
                {/* Drag Overlay */}
                <AnimatePresence>
                    {isDragActive && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-brand-purple/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                        >
                            <FilePlus className="w-16 h-16 mb-4 animate-bounce" />
                            <h3 className="text-2xl font-bold font-mono">DROP_TO_ADD</h3>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Panel: List */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="p-6 pb-2 shrink-0 flex items-center justify-between z-10 border-b border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
                        <div>
                            <h3 className="text-lg font-mono font-bold text-charcoal-900 dark:text-white uppercase tracking-tight">Queue</h3>
                            <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono mt-0.5">{files.length} document(s)</p>
                        </div>
                        <motion.button 
                            whileTap={buttonTap}
                            onClick={open} 
                            className="p-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors text-brand-purple border border-slate-200 dark:border-charcoal-700"
                            title="Add more files"
                        >
                            <FilePlus size={18} />
                        </motion.button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 bg-slate-50/50 dark:bg-black/20">
                       <AnimatePresence initial={false}>
                        {files.map(file => {
                          const result = results.get(file.id);
                          const isProcessing = processingId === file.id;
                          
                          return (
                            <motion.div 
                              key={file.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              className="bg-white dark:bg-charcoal-850 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 flex items-center gap-4 group hover:border-brand-purple/30 dark:hover:border-charcoal-600 transition-colors shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                                <FileText size={20} strokeWidth={1.5} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-charcoal-800 dark:text-white truncate font-mono">{file.file.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-charcoal-500 dark:text-slate-400 font-mono mt-1">
                                   <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                   {result && (
                                     <>
                                       <span className="opacity-50">➜</span>
                                       <span className="font-bold text-green-600 dark:text-green-400">{(result.newSize / 1024 / 1024).toFixed(2)} MB</span>
                                       <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 rounded border border-green-200 dark:border-green-800">
                                         -{Math.round((1 - result.newSize / result.originalSize) * 100)}%
                                       </span>
                                     </>
                                   )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isProcessing ? (
                                  <Loader2 className="animate-spin text-brand-purple" size={18} />
                                ) : result ? (
                                  <motion.button
                                    whileTap={buttonTap}
                                    onClick={() => handleDownload(result)}
                                    className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800"
                                    title="Download"
                                  >
                                    <Download size={18} />
                                  </motion.button>
                                ) : (
                                  <motion.button 
                                     whileTap={buttonTap}
                                     onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                     className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                                  >
                                     <X size={18} />
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                       </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Settings */}
                <div className="w-full md:w-80 bg-white dark:bg-charcoal-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-charcoal-700 p-6 flex flex-col gap-6 shrink-0 relative z-20">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings size={14} className="text-charcoal-400" />
                            <h4 className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-widest font-mono">Configuration</h4>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setLevel('normal')}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${level === 'normal' ? 'border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple/20' : 'border-slate-200 dark:border-charcoal-700 bg-slate-50 dark:bg-charcoal-800 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-charcoal-800 dark:text-white font-mono">Standard</span>
                                    {level === 'normal' && <CheckCircle2 size={14} className="text-brand-purple" />}
                                </div>
                                <div className="text-[10px] text-charcoal-500 dark:text-slate-400 leading-tight">Balanced quality & size.</div>
                            </button>
                            
                            <button 
                                onClick={() => setLevel('strong')}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${level === 'strong' ? 'border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple/20' : 'border-slate-200 dark:border-charcoal-700 bg-slate-50 dark:bg-charcoal-800 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-charcoal-800 dark:text-white font-mono">Strong</span>
                                    {level === 'strong' && <CheckCircle2 size={14} className="text-brand-purple" />}
                                </div>
                                <div className="text-[10px] text-charcoal-500 dark:text-slate-400 leading-tight">Max reduction, lower quality.</div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-charcoal-700 md:border-none md:pt-0">
                        <motion.button
                            onClick={handleCompress}
                            disabled={!!processingId || files.length === 0}
                            whileTap={buttonTap}
                            className="relative overflow-hidden w-full h-12 rounded-lg font-bold font-mono text-xs text-white bg-charcoal-900 dark:bg-white dark:text-charcoal-900 shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group hover:bg-brand-purple dark:hover:bg-slate-200 border border-transparent"
                        >
                            {!!processingId && (
                                <Loader2 size={16} className="animate-spin" />
                            )}
                            <div className="relative flex items-center justify-center gap-2 z-10 uppercase tracking-wide">
                                {!processingId && <Minimize2 size={16} />}
                                <span>
                                    {!!processingId 
                                        ? 'COMPRESSING...'
                                        : 'EXECUTE_COMPRESS'
                                    }
                                </span>
                            </div>
                        </motion.button>
                        
                        <motion.button
                            onClick={reset}
                            whileTap={buttonTap}
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg font-bold font-mono text-[10px] uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                            <RefreshCw size={14} /> RESET_SYSTEM
                        </motion.button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
