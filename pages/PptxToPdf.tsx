
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPptxToPdf, detectPptxOrientation } from '../services/pptxConverter';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Presentation, Lock, Cpu, Zap, FilePlus, RefreshCw, Loader2, ArrowRight, HardDrive, Settings } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';
import { PdfConfig } from '../types';

export const PptxToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Config
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'landscape', // PPTX default
    fitMode: 'contain',
    margin: 20,
    quality: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid .pptx file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Checking file...');
    
    try {
        const detected = await detectPptxOrientation(f);
        setConfig(prev => ({ ...prev, orientation: detected }));
        
        // Simulate check
        setTimeout(() => {
            setFile(f);
            addToast("Success", "PPTX file loaded.", "success");
            setIsProcessingFiles(false);
            setStatus('');
        }, 500);
    } catch(e) {
        setIsProcessingFiles(false);
        addToast("Error", "Failed to analyze PPTX", "error");
    }
  }, [addToast]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessingFiles || isGenerating
  });

  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setStatus('');
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const blob = await convertPptxToPdf(file, config, setProgress, setStatus);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDF created successfully!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error", "Conversion failed. File may be encrypted or complex.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const ConfigPanel = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">Page Size</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                {(['a4', 'letter'] as const).map(size => {
                    const isActive = config.pageSize === size;
                    return (
                        <button 
                            key={size}
                            onClick={() => setConfig({...config, pageSize: size})} 
                            className={`relative py-2 rounded-lg text-xs font-bold font-mono transition-colors z-10 ${isActive ? 'text-orange-600' : 'text-charcoal-500 hover:text-charcoal-700 dark:text-slate-400'}`}
                        >
                            {size.toUpperCase()}
                            {isActive && <motion.div layoutId="size-bg" className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                        </button>
                    )
                })}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">Orientation</label>
            <div className="flex bg-slate-100 dark:bg-charcoal-800 p-1 rounded-xl relative isolate border border-slate-200 dark:border-charcoal-700">
                {(['landscape', 'portrait'] as const).map(ori => {
                    const isActive = config.orientation === ori;
                    return (
                        <button 
                            key={ori}
                            onClick={() => setConfig({...config, orientation: ori})} 
                            className={`flex-1 relative py-2 rounded-lg text-xs font-bold font-mono transition-colors z-10 capitalize ${isActive ? 'text-charcoal-900 dark:text-white' : 'text-charcoal-500 hover:text-charcoal-700 dark:text-slate-400'}`}
                        >
                            {ori}
                            {isActive && <motion.div layoutId="ori-bg" className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                        </button>
                    )
                })}
            </div>
        </div>
    </div>
  );

  if (!file) {
    return (
      <ToolLandingLayout
          title="PPTX to PDF"
          description="Convert PowerPoint presentations to PDF documents. Slides are rendered as high-fidelity pages."
          icon={<Presentation />}
          onDrop={(files, rejections) => onDrop(files, rejections)}
          accept={{ 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }}
          multiple={false}
          isProcessing={isProcessingFiles}
          accentColor="text-orange-500"
          specs={[
            { label: "Format", value: "PPTX", icon: <Presentation /> },
            { label: "Privacy", value: "Client-Side", icon: <Lock /> },
            { label: "Engine", value: "JSZip/PDF", icon: <Cpu /> },
            { label: "Output", value: "PDF", icon: <Zap /> },
          ]}
          tip="Animations and transitions are not preserved. Each slide becomes a static PDF page."
      />
    );
  }

  // MOBILE: Vertical
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-900 font-sans" {...getRootProps()}>
            <PageReadyTracker />
            <input ref={fileInputRef} type="file" className="hidden" accept=".pptx" onChange={handleFileChange} />
            <div className="shrink-0 h-14 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between bg-white dark:bg-charcoal-900">
               <span className="font-bold text-charcoal-900 dark:text-white">Convert PPTX</span>
               <button onClick={handleReset}><RefreshCw size={18} /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
               <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600"><Presentation size={40} /></div>
                  <h3 className="font-bold text-lg">{file.name}</h3>
                  <p className="text-sm text-charcoal-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
               <div className="w-full max-w-xs">
                   <ConfigPanel />
               </div>
            </div>
            <div className="p-4 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-700">
               <button onClick={handleConvert} disabled={isGenerating} className="w-full h-12 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  {isGenerating ? <Loader2 className="animate-spin" /> : <ArrowRight />} Convert
               </button>
            </div>
        </div>
      );
  }

  // DESKTOP: 2-Pane
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <input ref={fileInputRef} type="file" className="hidden" accept=".pptx" onChange={handleFileChange} />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace File" variant="pptOrange" />

      {/* 1. Main Content: File Info */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 relative z-10">
          <div className="h-16 border-b border-slate-200 dark:border-charcoal-800 px-6 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                   <Presentation size={20} />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">PPTX Converter</h3>
                   <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">Ready to process</p>
                </div>
             </div>
             <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors">
                <FilePlus size={14} /> Replace
             </motion.button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-charcoal-900">
              <div className="max-w-md w-full bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-slate-200 dark:border-charcoal-700 p-8 text-center">
                  <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-orange-900/20">
                      <Presentation size={48} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2 truncate" title={file.name}>{file.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-charcoal-500 dark:text-charcoal-400 mb-8">
                      <HardDrive size={14} />
                      <span className="text-sm font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  <div className="text-xs text-charcoal-400 dark:text-charcoal-500 bg-slate-50 dark:bg-charcoal-900/50 p-4 rounded-xl border border-slate-100 dark:border-charcoal-700/50">
                      Files are processed locally. Large presentations with many images may take a moment to render.
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Sidebar: Actions */}
      <div className="w-80 bg-slate-50 dark:bg-charcoal-950 flex flex-col shrink-0 z-20">
          <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                  <Settings size={14} /> Config
              </span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <ConfigPanel />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleConvert} 
                  disabled={isGenerating} 
                  whileTap={buttonTap} 
                  className="w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs uppercase tracking-wide rounded-xl shadow-lg hover:shadow-xl hover:bg-orange-600 dark:hover:bg-amber-100 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 relative overflow-hidden"
              >
                  {isGenerating && (
                      <motion.div 
                          className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" 
                          initial={{ width: '0%' }} 
                          animate={{ width: `${progress}%` }} 
                          transition={{ duration: 0.1, ease: "linear" }} 
                      />
                  )}
                  <div className="relative flex items-center justify-center gap-2 z-10">
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      <span>{isGenerating ? status || 'CONVERTING...' : 'CONVERT TO PDF'}</span>
                  </div>
              </motion.button>
              
              <motion.button whileTap={buttonTap} onClick={handleReset} className="w-full py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors flex items-center justify-center gap-2">
                  <RefreshCw size={12} /> Start Over
              </motion.button>
          </div>
      </div>
    </div>
  );
};
