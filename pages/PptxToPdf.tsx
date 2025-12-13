
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPptxToPdf } from '../services/pptxConverter';
import { Download, RefreshCw, CheckCircle, Presentation, Loader2, Zap, Lock, Cpu, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const PptxToPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
       addToast("Invalid File", "Please upload a .pptx file.", "error");
       return;
    }

    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    if (!f.name.toLowerCase().endsWith('.pptx')) {
       addToast("Unsupported Format", "Only .pptx files are supported.", "error");
       return;
    }

    setIsProcessingFiles(true);
    setTimeout(() => {
      setFile(f);
      setIsProcessingFiles(false);
    }, 600);
  }, [addToast]);

  const handleConvert = async () => {
    if (!file) return;

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting conversion...');

    try {
       setTimeout(async () => {
          try {
             const blob = await convertPptxToPdf(file, setProgress, setStatus);
             
             const originalName = file.name;
             const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
             const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
             const name = `${safeName}_EZtify.pdf`;

             setResult({ blob, name });
          } catch (e) {
             console.error(e);
             addToast("Conversion Failed", "Could not convert this presentation.", "error");
          } finally {
             setIsGenerating(false);
             setProgress(0);
             setStatus('');
          }
       }, 50);
    } catch (e) {
       setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('');
    setProgress(0);
  };

  return (
    <>
      <SEO 
        title="PPTX to PDF Online – EZtify"
        description="Convert PowerPoint (PPTX) slides to PDF in your browser. 100% private and client-side conversion."
        canonical="https://eztify.pages.dev/#/pptx-to-pdf"
      />
      <PageReadyTracker />
      <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-900">
        <AnimatePresence mode="wait">
          {!file ? (
            <ToolLandingLayout
                title="PPTX to PDF"
                description="Convert PowerPoint presentations to PDF documents instantly in your browser."
                icon={<Presentation />}
                onDrop={onDrop}
                accept={{ 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }}
                multiple={false}
                isProcessing={isProcessingFiles}
                accentColor="text-orange-500"
                specs={[
                  { label: "Format", value: "PPTX", icon: <Presentation /> },
                  { label: "Privacy", value: "Client-Side", icon: <Lock /> },
                  { label: "Engine", value: "JSZip", icon: <Cpu /> },
                  { label: "Type", value: "Slides", icon: <Settings /> },
                ]}
                tip="Conversion focuses on static slide content. Complex animations are not preserved."
            />
          ) : (
            <motion.div
              key="studio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 relative"
            >
               <div className="w-full max-w-2xl bg-white dark:bg-charcoal-900 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-2xl overflow-hidden relative ring-1 ring-black/5">
                  
                  {/* Tech Header */}
                  <div className="h-10 bg-slate-50 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between px-4 select-none">
                     <div className="flex gap-3 items-center">
                        <div className="flex gap-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400 font-bold">PPTX_TO_PDF</span>
                     </div>
                     <button onClick={reset} className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors">
                        <X size={16} />
                     </button>
                  </div>

                  <div className="p-12 flex flex-col items-center text-center">
                      <motion.div 
                        layout
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-colors ${result ? 'bg-green-50 dark:bg-green-900/20 text-green-500 border-green-100 dark:border-green-900/30' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 border-orange-100 dark:border-orange-900/30'}`}
                      >
                         {result ? <CheckCircle size={40} strokeWidth={1.5} /> : <Presentation size={40} strokeWidth={1.5} />}
                      </motion.div>
                      
                      <h3 className="text-xl font-bold font-mono text-charcoal-900 dark:text-white mb-2 tracking-tight truncate max-w-md">{file.name}</h3>
                      <p className="text-xs font-mono text-charcoal-500 dark:text-slate-400 mb-8 uppercase tracking-wide">
                         {(file.size / 1024).toFixed(1)} KB • {result ? "PDF READY" : "SLIDES DETECTED"}
                      </p>
                      
                      <div className="w-full max-w-sm space-y-3">
                          {!result ? (
                             <motion.button 
                               onClick={handleConvert} 
                               disabled={isGenerating}
                               whileTap={buttonTap}
                               className="w-full py-4 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group border border-transparent hover:bg-orange-600 dark:hover:bg-slate-200"
                             >
                                {isGenerating ? (
                                   <>
                                      <Loader2 className="animate-spin" size={16} />
                                      <span>CONVERTING... {progress}%</span>
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
                                   <Download size={16} /> DOWNLOAD_PDF
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
    </>
  );
};
