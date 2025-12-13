
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToWord } from '../services/pdfToWordConverter';
import { FileRejection } from 'react-dropzone';
import { FileText, CheckCircle, RefreshCw, ArrowLeftRight, Lock, Cpu, Settings, Info, Loader2, Download, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const PdfToWordPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setTimeout(() => {
      setFile(f);
      setIsProcessingFiles(false);
      setResult(null);
    }, 600);
  }, []);
  
  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const blob = await convertPdfToWord(file, setProgress, setStatus);
      setResult(blob);
      addToast("Success", "Converted to Word!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error", "Conversion failed.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <ToolLandingLayout
            title="PDF to Word"
            description="Convert your PDF documents into editable Word (DOCX) files."
            icon={<ArrowLeftRight />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-blue-500"
            specs={[
              { label: "Format", value: "DOCX", icon: <FileText /> },
              { label: "Privacy", value: "Local", icon: <Lock /> },
              { label: "Engine", value: "PDF.js", icon: <Cpu /> },
              { label: "Mode", value: "Text Flow", icon: <Settings /> },
            ]}
            tip="This tool extracts text content. Layouts and complex formatting may not be perfectly preserved."
          />
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6"
          >
             <div className="w-full max-w-2xl bg-white dark:bg-charcoal-900 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-2xl overflow-hidden relative ring-1 ring-black/5">
                
                {/* Tech Header */}
                <div className="h-10 bg-slate-50 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between px-4 select-none">
                   <div className="flex gap-3 items-center">
                      <div className="flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400 font-bold">PDF_TO_DOCX</span>
                   </div>
                   <button onClick={reset} className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors">
                      <X size={16} />
                   </button>
                </div>

                <div className="p-12 flex flex-col items-center text-center">
                    <motion.div 
                      layout
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-colors ${result ? 'bg-green-50 dark:bg-green-900/20 text-green-500 border-green-100 dark:border-green-900/30' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-blue-100 dark:border-blue-900/30'}`}
                    >
                       {result ? <CheckCircle size={40} strokeWidth={1.5} /> : <FileText size={40} strokeWidth={1.5} />}
                    </motion.div>
                    
                    <h3 className="text-xl font-bold font-mono text-charcoal-900 dark:text-white mb-2 tracking-tight truncate max-w-md">{file.name}</h3>
                    <p className="text-xs font-mono text-charcoal-500 dark:text-slate-400 mb-8 uppercase tracking-wide">
                       {(file.size / 1024).toFixed(1)} KB • {result ? "DOCX READY" : "PDF LOADED"}
                    </p>
                    
                    <div className="w-full max-w-sm space-y-3">
                        {!result ? (
                           <motion.button 
                             onClick={handleConvert} 
                             disabled={isGenerating}
                             whileTap={buttonTap}
                             className="w-full py-4 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group border border-transparent hover:bg-blue-600 dark:hover:bg-slate-200"
                           >
                              {isGenerating ? (
                                 <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>EXTRACTING... {progress}%</span>
                                 </>
                              ) : (
                                 <>
                                   <Zap size={16} className="group-hover:text-yellow-400 transition-colors" /> 
                                   EXECUTE_CONVERSION
                                 </>
                              )}
                           </motion.button>
                        ) : (
                           <>
                              <motion.button 
                                 whileTap={buttonTap}
                                 onClick={downloadResult}
                                 className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                 <Download size={16} /> DOWNLOAD_DOCX
                              </motion.button>
                              <motion.button
                                onClick={reset}
                                whileTap={buttonTap}
                                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors"
                              >
                                <RefreshCw size={12} /> START_OVER
                              </motion.button>
                           </>
                        )}
                    </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
