
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile, CompressionResult } from '../types';
import { convertPdfToGrayscale } from '../services/pdfGrayscale';
import { nanoid } from 'nanoid';
import { FileRejection } from 'react-dropzone';
import { Download, FileText, Palette, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyBar } from '../components/StickyBar';
import { buttonTap } from '../utils/animations';

export const GrayscalePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [results, setResults] = useState<Map<string, CompressionResult>>(new Map());
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const generateThumbnails = async (newFiles: PdfFile[]) => {
      // No-op for grayscale currently
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    const newPdfFiles: PdfFile[] = acceptedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (newPdfFiles.length > 0) {
      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...newPdfFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${newPdfFiles.length} files.`, "success");
        generateThumbnails(newPdfFiles);
      }, 500);
    }
  }, [addToast]);

  const handleConvert = async () => {
    for (const pdf of files) {
      if (results.has(pdf.id)) continue;
      
      setProcessingId(pdf.id);
      try {
        const result = await convertPdfToGrayscale(pdf, undefined, undefined);
        setResults(prev => new Map(prev).set(pdf.id, result));
      } catch (error) {
        console.error(error);
        addToast("Error", `Failed to convert ${pdf.file.name}`, "error");
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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {files.length === 0 ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="grayscale-pdf" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
          <div className="max-w-3xl mx-auto space-y-3">
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
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-charcoal-700 text-slate-500 flex items-center justify-center shrink-0">
                        <Palette size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-charcoal-800 dark:text-white truncate">{file.file.name}</h4>
                        <div className="text-xs text-charcoal-500 dark:text-slate-400">
                           {(file.file.size / 1024 / 1024).toFixed(2)} MB
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
                             onClick={() => {
                                setFiles(prev => prev.filter(f => f.id !== file.id));
                             }}
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
      )}

      {files.length > 0 && (
         <StickyBar 
            mode="grayscale-pdf"
            imageCount={files.length}
            totalSize={0}
            onGenerate={handleConvert}
            isGenerating={!!processingId}
            status={processingId ? "Converting..." : "Convert All"}
         />
      )}
    </div>
  );
};
