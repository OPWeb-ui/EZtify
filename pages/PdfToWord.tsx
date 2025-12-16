
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { extractHtmlFromPdf, generateDocxFromHtml } from '../services/pdfToWordConverter';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  FileType2, Lock, Cpu, Zap, Loader2, RefreshCw, 
  Download, FileText, Info, CheckCircle2, ArrowRight,
  Maximize, ZoomIn, ZoomOut, FileCheck, ChevronDown, ChevronUp, Sliders
} from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

// --- CONSTANTS ---
const PAPER_WIDTH_BASE = 800; // Visual base width for the preview paper

export const PdfToWordPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Store full detected metadata
  const [detectedMetadata, setDetectedMetadata] = useState<{ orientation: 'portrait' | 'landscape', widthTwips: number, heightTwips: number } | null>(null);

  // Processing
  const [isProcessing, setIsProcessing] = useState(false); // Initial load
  const [isConverting, setIsConverting] = useState(false); // Conversion
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Viewport
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | '100%'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = { w: PAPER_WIDTH_BASE, h: 1100 };

  // Mobile
  const [isMobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  // --- HANDLERS ---

  const loadFile = useCallback(async (f: File) => {
    setIsProcessing(true);
    // Simulate analysis delay for "Software feel"
    setTimeout(() => {
        setFile(f);
        setPreviewHtml(null); // Reset preview
        setDownloadUrl(null);
        setFitMode('fit');
        setIsProcessing(false);
        addToast("File Loaded", "Ready to convert.", "success");
    }, 600);
  }, [addToast]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF.", "error");
      return;
    }
    if (acceptedFiles.length > 0) loadFile(acceptedFiles[0]);
  }, [loadFile, addToast]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing || isConverting
  });

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    setStatus('Initializing converter...');
    
    try {
      // 1. Extract HTML (simulated preview content) AND metadata
      const { html, metadata } = await extractHtmlFromPdf(file, (p) => {
          if (p < 50) setProgress(p); 
      }, setStatus);

      setPreviewHtml(html);
      setDetectedMetadata(metadata);

      // 2. Generate DOCX Blob using detected metadata
      const docxBlob = await generateDocxFromHtml(html, metadata, (p) => {
          setProgress(50 + (p * 0.5)); 
      }, setStatus);
      
      const url = URL.createObjectURL(docxBlob);
      setDownloadUrl(url);
      
      addToast("Conversion Complete", `Detected ${metadata.orientation} layout.`, "success");
      setMobileInspectorOpen(false);
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to convert document.", "error");
    } finally {
      setIsConverting(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !file) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewHtml(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setZoom(1);
    setMobileInspectorOpen(false);
  };

  // --- ZOOM / FIT LOGIC ---
  useEffect(() => {
    if (!containerRef.current || fitMode !== 'fit' || !previewHtml) return;

    const updateFit = () => {
      if (!containerRef.current) return;
      const { width: cw } = containerRef.current.getBoundingClientRect();
      const padding = isMobile ? 32 : 64;
      const scaleW = (cw - padding) / PAPER_WIDTH_BASE;
      let s = Math.min(scaleW, 1.2); 
      s = Math.max(s, 0.3);
      setZoom(s);
    };

    updateFit();
    const observer = new ResizeObserver(updateFit);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [previewHtml, fitMode, isMobile]);


  // --- RENDER ---

  if (!file) {
    return (
      <ToolLandingLayout
        title="PDF to Word"
        description="Convert PDF documents to editable Word (DOCX) files. Preserves text and paragraphs."
        icon={<FileType2 />}
        onDrop={onDrop}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessing}
        accentColor="#3B82F6" 
        specs={[
          { label: "Engine", value: "PDF.js", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Format", value: "DOCX", icon: <FileText /> },
          { label: "Output", value: "Editable", icon: <Zap /> },
        ]}
        tip="EZtify preserves the original page size and orientation automatically."
      />
    );
  }

  // DESKTOP LAYOUT (2-Panel)
  if (!isMobile) {
    return (
        <div className="flex w-full h-full bg-slate-50 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
          <PageReadyTracker />
          <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace File" variant="blue" />
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files && loadFile(e.target.files[0])} />
    
          {/* LEFT PANEL: WORKSPACE (70%) */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-black/20 relative z-10">
             {/* Toolbar */}
             <div className={`h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-20 transition-opacity ${previewHtml ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                       <FileText size={18} />
                    </div>
                    <div className="h-4 w-px bg-slate-200 dark:bg-charcoal-700 mx-1" />
                    <span className="font-mono text-xs font-bold text-charcoal-600 dark:text-slate-300">
                       {file.name.replace('.pdf', '.docx')}
                    </span>
                 </div>
    
                 <div className="flex items-center gap-2 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                    <button onClick={() => { setFitMode('100%'); setZoom(z => Math.max(0.2, z - 0.1)); }} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                    <span className="w-12 text-center text-xs font-mono font-bold text-charcoal-600 dark:text-slate-300 select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => { setFitMode('100%'); setZoom(z => Math.min(2, z + 0.1)); }} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                    <button onClick={() => setFitMode('fit')} className={`p-1.5 rounded transition-colors ${fitMode === 'fit' ? 'bg-white dark:bg-charcoal-700 text-blue-600 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-900'}`} title="Fit to Screen"><Maximize size={14} /></button>
                 </div>
             </div>
    
             {/* Canvas */}
             <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-12 custom-scrollbar relative">
                 
                 {!previewHtml && !isConverting && (
                     <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-charcoal-900 p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-charcoal-700 flex flex-col items-center text-center max-w-sm">
                        <IconBox icon={<FileText />} size="xl" variant="brand" className="mb-6" />
                        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">{file.name}</h2>
                        <div className="flex items-center gap-2 text-xs font-mono text-charcoal-500 dark:text-charcoal-400 mb-8 bg-slate-100 dark:bg-charcoal-800 px-3 py-1 rounded-full">
                           <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                           <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                           <span>PDF</span>
                        </div>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                            Ready to extract text and layout. <br/> Click <strong className="text-charcoal-900 dark:text-white">Convert</strong> to begin.
                        </p>
                     </motion.div>
                 )}
    
                 {isConverting && (
                     <div className="flex flex-col items-center gap-6">
                         <div className="relative w-20 h-20">
                             <motion.div className="absolute inset-0 border-4 border-slate-200 dark:border-charcoal-700 rounded-full" />
                             <motion.div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                         </div>
                         <div className="text-center space-y-1">
                             <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">{status}</h3>
                             <p className="text-sm font-mono text-charcoal-500">{Math.round(progress)}% Complete</p>
                         </div>
                     </div>
                 )}
    
                 {previewHtml && (
                     <div className="relative shadow-2xl transition-transform duration-200 ease-out origin-center overflow-visible" style={{ width: dims.w, minHeight: dims.h, transform: `scale(${zoom})` }}>
                         <div className="bg-white text-black w-full min-h-full ring-1 ring-black/5" style={{ height: 'auto' }}>
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="prose max-w-none p-[60px] font-serif text-sm leading-relaxed" style={{ color: '#000000' }} />
                         </div>
                     </div>
                 )}
             </div>
          </div>
    
          {/* RIGHT PANEL: INSPECTOR (30%) */}
          <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
              <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400 flex items-center gap-2">
                      <Sliders size={14} /> Processor
                  </span>
              </div>
    
              <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Source</span>
                          <span className="font-bold text-charcoal-900 dark:text-white font-mono">PDF</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Output</span>
                          <span className="font-bold text-charcoal-900 dark:text-white font-mono">DOCX</span>
                      </div>
                      <div className="w-full h-px bg-slate-100 dark:bg-charcoal-700 my-2" />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          Replace File
                      </button>
                  </div>
    
                  {detectedMetadata && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Smart Detection</h4>
                              <p className="text-[10px] text-blue-600/80 dark:text-blue-300/80 leading-relaxed">
                                  Detected {detectedMetadata.orientation} layout ({Math.round(detectedMetadata.widthTwips/20)}x{Math.round(detectedMetadata.heightTwips/20)}pt).
                              </p>
                          </div>
                      </div>
                  )}
              </div>
    
              <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
                  {!previewHtml ? (
                      <motion.button onClick={handleConvert} disabled={isConverting} whileTap={buttonTap} className="relative overflow-hidden w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs uppercase tracking-wide rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 dark:hover:bg-slate-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group">
                          {isConverting && <motion.div className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1, ease: "linear" }} />}
                          <div className="relative flex items-center justify-center gap-2 z-10">
                              {isConverting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                              <span>{isConverting ? status || 'PROCESSING...' : 'CONVERT TO WORD'}</span>
                          </div>
                      </motion.button>
                  ) : (
                      <motion.button onClick={handleDownload} whileTap={buttonTap} className="w-full h-12 bg-blue-600 text-white font-bold font-mono text-xs uppercase tracking-wide rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                          <Download size={16} /> <span>DOWNLOAD DOCX</span>
                      </motion.button>
                  )}
                  <motion.button whileTap={buttonTap} onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors">
                      <RefreshCw size={12} /> Start Over
                  </motion.button>
              </div>
          </div>
        </div>
    );
  }

  // MOBILE LAYOUT (Keep it simplified)
  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
        <PageReadyTracker />
        <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace" variant="blue" />
        <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={(e) => e.target.files && loadFile(e.target.files[0])} />

        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-20 shadow-sm relative">
           <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><FileText size={18} /></div>
              <span className="font-mono font-bold text-sm text-charcoal-900 dark:text-white uppercase tracking-tight">Convert</span>
           </div>
           <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"><RefreshCw size={18} /></motion.button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-slate-200/50 dark:bg-black/30" ref={containerRef}>
           <div className="w-full h-full overflow-auto flex items-center justify-center p-4 custom-scrollbar">
              {!previewHtml && !isConverting && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-xs border border-slate-100 dark:border-charcoal-700">
                      <IconBox icon={<FileText />} size="xl" variant="brand" className="mb-6" />
                      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">Ready to Convert</h3>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-6">Convert <span className="font-mono bg-slate-100 dark:bg-charcoal-700 px-1 rounded">{file.name}</span> to Word.</p>
                  </motion.div>
              )}
              {isConverting && <div className="flex flex-col items-center gap-4 p-8 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur rounded-2xl"><Loader2 size={40} className="animate-spin text-blue-600" /><p className="text-sm font-bold text-charcoal-800 dark:text-white">{status || "Processing..."}</p></div>}
              {previewHtml && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white shadow-2xl ring-1 ring-black/5 origin-top-center overflow-auto" style={{ width: PAPER_WIDTH_BASE, height: 'auto', minHeight: 1000, transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                     <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="prose max-w-none p-[50px] font-serif text-black leading-relaxed [&_*]:text-black" style={{ color: '#000000' }} />
                  </motion.div>
              )}
           </div>
        </div>

        <motion.div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl flex flex-col overflow-hidden" initial={false} animate={{ height: isMobileInspectorOpen ? 'auto' : '68px' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
           <div className="flex items-center justify-between px-6 h-[68px] shrink-0 relative" onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}>
              <div className="flex flex-col justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500">{previewHtml ? 'Target' : 'Target'}</span>
                 <span className="text-sm font-bold text-charcoal-900 dark:text-white font-mono">{previewHtml ? 'DOCX Ready' : 'DOCX'}</span>
              </div>
              <div className="absolute left-1/2 top-3 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                 <button onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)} className="p-2 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-600 dark:text-slate-300">{isMobileInspectorOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>
                 {!previewHtml ? (
                    <motion.button whileTap={buttonTap} onClick={handleConvert} disabled={isConverting} className="h-10 px-6 bg-blue-600 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                        {isConverting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} <span>Start</span>
                    </motion.button>
                 ) : (
                    <motion.button whileTap={buttonTap} onClick={handleDownload} className="h-10 px-6 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg flex items-center justify-center gap-2">
                        <Download size={16} /> <span>Save</span>
                    </motion.button>
                 )}
              </div>
           </div>
           <div className="bg-slate-50 dark:bg-charcoal-850 border-t border-slate-100 dark:border-charcoal-800 p-6 space-y-6 pb-[env(safe-area-inset-bottom)]">
               <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-slate-200 dark:border-charcoal-700 rounded-xl text-charcoal-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 bg-white dark:bg-charcoal-800">Replace Source File</button>
           </div>
        </motion.div>
    </div>
    );
};
