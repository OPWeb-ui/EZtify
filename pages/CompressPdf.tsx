
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile, CompressionResult, CompressionLevel } from '../types';
import { compressPDF } from '../services/pdfCompressor';
import { nanoid } from 'nanoid';
import { FileRejection } from 'react-dropzone';
import { Download, FileText, Settings, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { StickyBar } from '../components/StickyBar';

export const CompressPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {files.length === 0 ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="compress-pdf" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Settings Card */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-charcoal-700">
               <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-charcoal-900 dark:text-white">
                 <Settings size={20} /> Compression Settings
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setLevel('normal')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${level === 'normal' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-200 dark:border-charcoal-600 hover:border-slate-300'}`}
                  >
                    <div className="font-bold text-charcoal-800 dark:text-white mb-1">Standard</div>
                    <div className="text-xs text-charcoal-500 dark:text-slate-400">Good quality, reasonable size reduction.</div>
                  </button>
                  <button 
                    onClick={() => setLevel('strong')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${level === 'strong' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-200 dark:border-charcoal-600 hover:border-slate-300'}`}
                  >
                    <div className="font-bold text-charcoal-800 dark:text-white mb-1">Strong</div>
                    <div className="text-xs text-charcoal-500 dark:text-slate-400">Maximum reduction, lower quality.</div>
                  </button>
               </div>
            </div>

            {/* File List */}
            <div className="space-y-3">
              <AnimatePresence>
                {files.map(file => {
                  const result = results.get(file.id);
                  const isProcessing = processingId === file.id;
                  
                  return (
                    <motion.div 
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-charcoal-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-charcoal-700 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-charcoal-800 dark:text-white truncate">{file.file.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
                           <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                           {result && (
                             <>
                               <span>→</span>
                               <span className="font-bold text-green-600 dark:text-green-400">{(result.newSize / 1024 / 1024).toFixed(2)} MB</span>
                               <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                 -{Math.round((1 - result.newSize / result.originalSize) * 100)}%
                               </span>
                             </>
                           )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isProcessing ? (
                          <Loader2 className="animate-spin text-brand-purple" />
                        ) : result ? (
                          <motion.button
                            whileTap={buttonTap}
                            onClick={() => handleDownload(result)}
                            className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-bold flex items-center gap-2"
                          >
                            <Download size={16} /> Save
                          </motion.button>
                        ) : (
                          <button 
                             onClick={() => removeFile(file.id)}
                             className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                          >
                             Remove
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && (
         <StickyBar 
            mode="compress-pdf"
            imageCount={files.length}
            totalSize={0}
            onGenerate={handleCompress}
            isGenerating={!!processingId}
            status={processingId ? "Compressing..." : "Compress All"}
         />
      )}
    </div>
  );
};
