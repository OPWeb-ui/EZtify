import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { HeroPill } from '../components/HeroPill';
import { RotatingText } from '../components/RotatingText';
import { DocxViewer } from '../components/viewers/DocxViewer';
import { ExcelViewer } from '../components/viewers/ExcelViewer';
import { PptxViewer } from '../components/viewers/PptxViewer';
import { FileText, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { staggerContainer, fadeInUp } from '../utils/animations';

type ViewerType = 'docx' | 'xlsx' | 'pptx' | null;

export const FileViewerPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [viewerType, setViewerType] = useState<ViewerType>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const getViewerType = (file: File): ViewerType => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx';
    if (name.endsWith('.pptx')) return 'pptx';
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
       addToast("Unsupported File", "Please upload DOCX, XLSX, or PPTX files.", "error");
       return;
    }

    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    const type = getViewerType(f);
    
    if (!type) {
       addToast("Unsupported Format", "File type not supported for preview.", "error");
       return;
    }

    setIsProcessingFiles(true);
    // Simulate loading delay for better UX transition
    setTimeout(() => {
        setFile(f);
        setViewerType(type);
        setIsProcessingFiles(false);
    }, 600);
  }, [addToast]);

  // Dropzone for the active viewer overlay
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    noClick: true,
    noKeyboard: true,
    multiple: false
  });

  const closeViewer = () => {
    setFile(null);
    setViewerType(null);
  };

  return (
    <>
      <SEO 
        title="File Viewer Online – DOCX, XLSX, PPTX – EZtify"
        description="Preview Word documents, Excel spreadsheets, and PowerPoint presentations directly in your browser. Private, secure, no uploads."
        canonical="https://eztify.pages.dev/#/viewer-test"
      />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-teal-500/10" />
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
                >
                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                    <HeroPill>Securely preview documents, spreadsheets, and presentations in your browser.</HeroPill>
                    <UploadArea onDrop={onDrop} mode="file-viewer" disabled={false} isProcessing={isProcessingFiles} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <RotatingText />
                  </motion.div>
                </motion.div>
            </section>

            <AdSlot zone="hero" />

            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="file-viewer" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-slate-50 dark:bg-charcoal-950 relative min-h-[calc(100vh-4rem)]"
            {...getRootProps({ onClick: (e) => e.stopPropagation() })}
          >
             <input {...getInputProps()} />
             <DragDropOverlay isDragActive={isDragActive} message="Drop to switch file" variant="green" />

             {/* Toolbar */}
             <div className="bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 p-4 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="p-2 bg-slate-100 dark:bg-charcoal-800 rounded-lg text-charcoal-500">
                      <FileText size={20} />
                   </div>
                   <div className="truncate">
                      <h3 className="font-bold text-sm text-charcoal-800 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</h3>
                      <p className="text-xs text-charcoal-500">{(file.size/1024).toFixed(1)} KB • Local Preview</p>
                   </div>
                </div>
                <button onClick={closeViewer} className="p-2 hover:bg-rose-50 hover:text-rose-500 text-charcoal-400 rounded-lg transition-colors">
                   <X size={20} />
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="max-w-5xl mx-auto shadow-xl rounded-xl overflow-hidden bg-white dark:bg-charcoal-900 min-h-[600px] border border-slate-200 dark:border-charcoal-800 relative">
                   {viewerType === 'docx' && <DocxViewer file={file} />}
                   {viewerType === 'xlsx' && <ExcelViewer file={file} />}
                   {viewerType === 'pptx' && <PptxViewer file={file} />}
                </div>
             </div>
             
             {/* Privacy Footer */}
             <div className="p-2 text-center text-[10px] text-charcoal-400 bg-white/50 dark:bg-charcoal-900/50">
                <p className="flex items-center justify-center gap-1"><AlertCircle size={10} /> This file is rendered locally. No data is sent to any server.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};