
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile } from '../types';
import { mergePdfs } from '../services/pdfMerger';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { MergeFileList } from '../components/MergeFileList';
import { generatePdfThumbnail } from '../services/pdfThumbnail';
import { AnimatePresence, motion } from 'framer-motion';
import { FilePlus, GitMerge, Layers, Zap, Lock, Cpu, Info, Download, RefreshCw, Loader2 } from 'lucide-react';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const MergePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const generateThumbnails = async (newFiles: PdfFile[]) => {
    for (const f of newFiles) {
      try {
        const url = await generatePdfThumbnail(f.file);
        setFiles(prev => prev.map(p => p.id === f.id ? { ...p, previewUrl: url } : p));
      } catch (e) {
        console.warn("No thumbnail for", f.file.name);
      }
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
    }

    if (acceptedFiles.length > 0) {
      const newFiles: PdfFile[] = acceptedFiles.map(f => ({
        id: nanoid(),
        file: f
      }));

      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${newFiles.length} files.`, "success");
        generateThumbnails(newFiles);
      }, 500);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessingFiles || isGenerating,
  });

  const handleMerge = async () => {
    if (files.length < 2) {
      addToast("Warning", "Need at least 2 files to merge.", "warning");
      return;
    }
    
    setIsGenerating(true);
    try {
      const mergedBlob = await mergePdfs(files, setProgress, setStatus);
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_${files.length}_files_EZtify.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDFs merged successfully!", "success");
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to merge PDFs.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const reset = () => { setFiles([]); setProgress(0); setStatus(''); };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <ToolLandingLayout
            title="Merge PDF"
            description="Concatenate multiple PDF documents into a single unified file sequence."
            icon={<GitMerge />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={true}
            isProcessing={isProcessingFiles}
            accentColor="text-purple-500"
            specs={[
              { label: "Sequence", value: "Custom", icon: <Layers /> },
              { label: "Limit", value: "None", icon: <Zap /> },
              { label: "Privacy", value: "Local", icon: <Lock /> },
              { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            ]}
            tip="Large files (100MB+) might require more device memory. Merging happens entirely in RAM."
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
                            <h3 className="text-2xl font-mono font-bold">ADD_TO_QUEUE</h3>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Panel: File List */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="p-6 pb-2 shrink-0 flex items-center justify-between z-10 border-b border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
                        <div>
                            <h3 className="text-lg font-mono font-bold text-charcoal-900 dark:text-white uppercase tracking-tight">Merge Sequence</h3>
                            <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono mt-0.5">{files.length} document(s) ready</p>
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
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 bg-slate-50/50 dark:bg-black/20">
                        <MergeFileList 
                            files={files} 
                            onReorder={setFiles} 
                            onRemove={removeFile} 
                        />
                    </div>
                </div>

                {/* Right Panel: Actions */}
                <div className="w-full md:w-80 bg-white dark:bg-charcoal-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-charcoal-700 p-6 flex flex-col gap-6 shrink-0 relative z-20">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={14} className="text-charcoal-400" />
                            <h4 className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-widest font-mono">Overview</h4>
                        </div>
                        <div className="bg-slate-50 dark:bg-charcoal-800 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm">
                            <div className="flex justify-between items-center text-xs mb-2">
                                <span className="text-charcoal-600 dark:text-charcoal-400 font-mono">Count</span>
                                <span className="font-bold text-charcoal-900 dark:text-white font-mono">{files.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-charcoal-600 dark:text-charcoal-400 font-mono">Total Size</span>
                                <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                                    {(files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-charcoal-700 md:border-none md:pt-0">
                        <motion.button
                            onClick={handleMerge}
                            disabled={isGenerating || files.length < 2}
                            whileTap={buttonTap}
                            className="relative overflow-hidden w-full h-12 rounded-lg font-bold font-mono text-xs text-white bg-charcoal-900 dark:bg-white dark:text-charcoal-900 shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group hover:bg-brand-purple dark:hover:bg-slate-200 border border-transparent"
                        >
                            {isGenerating && (
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                            <div className="relative flex items-center justify-center gap-2 z-10 uppercase tracking-wide">
                                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <GitMerge size={16} />}
                                <span>
                                    {isGenerating 
                                        ? (status || `MERGING... ${progress.toFixed(0)}%`)
                                        : 'EXECUTE_MERGE'
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
