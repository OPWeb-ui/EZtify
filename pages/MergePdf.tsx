
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile } from '../types';
import { mergePdfs } from '../services/pdfMerger';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { MergeFileList } from '../components/MergeFileList';
import { generatePdfThumbnail } from '../services/pdfThumbnail';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus, GitMerge, Layers, Zap, Lock, Cpu, Info, Download, RefreshCw, Loader2, X } from 'lucide-react';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const MergePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processDroppedFiles = useCallback((acceptedFiles: File[]) => {
    if (isProcessingFiles || isGenerating) return;

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
        generateThumbnails(newFiles);
      }, 500);
    }
  }, [addToast, isProcessingFiles, isGenerating]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
    }
    processDroppedFiles(acceptedFiles);
  }, [addToast, processDroppedFiles]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessingFiles || isGenerating,
  });

  const handleAddFilesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessingFiles || isGenerating) return;
    if (e.target.files) {
      processDroppedFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

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

  if (files.length === 0) {
    return (
      <ToolLandingLayout
        title="Merge PDF"
        description="Concatenate multiple PDF documents into a single unified file sequence."
        icon={<GitMerge />}
        onDrop={(files) => onDrop(files, [])}
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
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-charcoal-900" {...getRootProps()}>
      <input 
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        disabled={isProcessingFiles || isGenerating}
      />
      <PageReadyTracker />
      
      {/* 1. Editor Header */}
      <div className="shrink-0 h-16 bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 px-4 md:px-6 flex items-center justify-between z-20 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
               <GitMerge size={20} />
            </div>
            <div>
               <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Merge Sequence</h3>
               <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">
                  {files.length} Document{files.length !== 1 ? 's' : ''} Loaded
               </p>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <motion.button 
               whileTap={buttonTap}
               onClick={handleAddFilesClick}
               className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent"
            >
               <FilePlus size={16} /> <span className="hidden sm:inline">Add Files</span>
            </motion.button>
            <motion.button 
               whileTap={buttonTap}
               onClick={reset}
               className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
               title="Reset"
            >
               <RefreshCw size={18} />
            </motion.button>
         </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-100 dark:bg-black/20 relative">
          <div className="max-w-2xl mx-auto min-h-full">
             <AnimatePresence>
                {isDragActive && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-brand-purple/90 backdrop-blur-md flex flex-col items-center justify-center text-white rounded-xl m-4"
                    >
                        <FilePlus className="w-16 h-16 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-mono font-bold">ADD_TO_QUEUE</h3>
                    </motion.div>
                )}
             </AnimatePresence>
             
             <MergeFileList 
                 files={files} 
                 onReorder={setFiles} 
                 onRemove={removeFile} 
             />
          </div>
      </div>

      {/* 3. Command Bar */}
      <div className="shrink-0 h-20 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 px-6 flex items-center justify-between z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="hidden sm:flex flex-col">
             <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest">Total Size</span>
             <span className="text-xs font-mono font-bold text-charcoal-800 dark:text-white">
                {(files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024).toFixed(2)} MB
             </span>
          </div>

          <motion.button
              onClick={handleMerge}
              disabled={isGenerating || files.length < 2}
              whileTap={buttonTap}
              className="flex-1 sm:flex-none sm:min-w-[200px] relative overflow-hidden h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-mono font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all hover:bg-brand-purple dark:hover:bg-slate-200"
          >
              {isGenerating && (
                  <motion.div 
                      className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                  />
              )}
              <div className="relative flex items-center justify-center gap-2 z-10">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
                  <span>
                      {isGenerating ? (status || 'PROCESSING...') : 'MERGE PDF'}
                  </span>
              </div>
          </motion.button>
      </div>
    </div>
  );
};
