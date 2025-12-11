

import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, SplitMode, PageNumberConfig } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { Download, CheckCircle, Scissors, X, Loader2, LayoutGrid, Hash, ArrowLeftRight, Eye, EyeOff, RefreshCcw, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { useDropzone, FileRejection } from 'react-dropzone';
import { SEO } from '../components/SEO';
import { EZDropdown } from '../components/EZDropdown';
import { DragDropOverlay } from '../components/DragDropOverlay';

// --- Toggle Button ---
interface ModeToggleProps {
  mode: SplitMode;
  current: SplitMode;
  label: string;
  icon: React.ReactNode;
  onClick: (mode: SplitMode) => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, current, label, icon, onClick }) => (
  <button
    onClick={() => onClick(mode)}
    className={`
      flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap
      ${current === mode 
        ? 'bg-white dark:bg-charcoal-700 shadow-sm text-brand-purple ring-1 ring-black/5 dark:ring-white/10' 
        : 'text-charcoal-500 hover:text-charcoal-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800'
      }
    `}
  >
    {icon} {label}
  </button>
);

const fontOptions = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
  { label: 'Helvetica Oblique', value: 'Helvetica-Oblique' },
  { label: 'Helvetica Bold Oblique', value: 'Helvetica-BoldOblique' },
  { label: 'Times New Roman', value: 'Times-Roman' },
  { label: 'Times New Roman Bold', value: 'Times-Roman-Bold' },
  { label: 'Times New Roman Italic', value: 'Times-Roman-Italic' },
  { label: 'Courier', value: 'Courier' },
  { label: 'Courier Bold', value: 'Courier-Bold' },
  { label: 'Courier Oblique', value: 'Courier-Oblique' },
];

export const SplitPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [mode, setMode] = useState<SplitMode>('organize');
  
  // Page Numbers State
  const [numberingConfig, setNumberingConfig] = useState<PageNumberConfig>({
    position: 'bottom',
    alignment: 'center',
    startFrom: 1,
    fontSize: 12,
    fontFamily: 'Helvetica',
    offsetX: 0,
    offsetY: 0,
  });
  
  // Visibility State for Badges/Numbers
  const [showBadges, setShowBadges] = useState(true);

  const [result, setResult] = useState<{ blob: Blob, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    if (f.type !== 'application/pdf') {
      addToast("Invalid File", "Please upload a PDF.", "error");
      return;
    }
    
    setIsProcessingFiles(true);
    const startTime = Date.now();
    
    try {
      // The loadPdfPages has its own progress/status which we can ignore for this loader
      const loadedPages = await loadPdfPages(f, () => {}, () => {});
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
      }

      if (loadedPages.length === 0) {
        addToast("Error", "No pages found in PDF.", "error");
        setFile(null);
      } else {
        setFile(f);
        setPages(loadedPages);
        addToast("Success", `Loaded ${loadedPages.length} pages.`, "success");
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to load PDF.", "error");
      setFile(null);
    } finally {
      setIsProcessingFiles(false);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  // --- PAGE ACTIONS ---
  const handleReorder = (newPages: PdfPage[]) => {
    setPages(newPages);
  };

  const handleRemovePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleRemoveSelected = () => {
    setPages(prev => prev.filter(p => !p.selected));
  };

  const handleTogglePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // --- EXPORT ---
  const handleExport = async (action: 'download' | 'split' | 'numbers') => {
    if (!file) return;
    
    if (action === 'split') {
      const selected = pages.filter(p => p.selected);
      if (selected.length === 0) {
        addToast("No Selection", "Select pages to extract.", "warning");
        return;
      }
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Processing...');

    try {
      setTimeout(async () => {
        try {
          const pagesToProcess = action === 'split' ? pages.filter(p => p.selected) : pages;
          const configToUse = action === 'numbers' ? numberingConfig : undefined;
          
          const blob = await savePdfWithModifications(file, pagesToProcess, configToUse, setProgress, setStatus);
          
          const originalName = file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
          const suffix = action === 'split' ? '_split' : action === 'numbers' ? '_numbered' : '_organized';
          
          setResult({ blob, name: `${safeName}${suffix}_EZtify.pdf` });
        } catch (e) {
          console.error(e);
          addToast("Error", "Processing failed.", "error");
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
    setPages([]);
    setResult(null);
    setStatus('');
    setMode('organize');
    setShowBadges(true);
  };

  return (
    <>
      <SEO 
        title="Split PDF Online – EZtify"
        description="Split, organize, and number PDF pages online. 100% private, secure, and client-side."
        canonical="https://eztify.pages.dev/#/split-pdf"
      />
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-blue/10" />
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                  <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                    <HeroPill>Split, extract, reorder, or number PDF pages instantly in your browser.</HeroPill>
                    <UploadArea onDrop={onDrop} mode="split-pdf" disabled={isGenerating} isProcessing={isProcessingFiles} />
                  </motion.div>
                  <motion.div variants={fadeInUp}><RotatingText /></motion.div>
                </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="split-pdf" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" className="flex-1 flex flex-col items-center relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none" {...getRootProps({ onClick: (e) => e.stopPropagation() })}>
            <input {...getInputProps()} />
            
            <DragDropOverlay 
              isDragActive={isDragActive} 
              message="Drop new PDF to replace" 
              variant="blue"
            />

            {/* --- TOP TOOLBAR --- */}
            <div className="w-full bg-slate-100/80 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-slate-200 dark:border-charcoal-700 sticky top-0 z-40">
               <div className="max-w-xl mx-auto p-2 flex items-center gap-2">
                  {/* Mode Toggles */}
                  <div className="bg-slate-200/50 dark:bg-charcoal-800 p-1 rounded-xl flex flex-1 min-w-0">
                    <ModeToggle mode="organize" current={mode} label="Organize" icon={<LayoutGrid size={16} />} onClick={setMode} />
                    <ModeToggle mode="numbers" current={mode} label="Page Numbers" icon={<Hash size={16} />} onClick={setMode} />
                  </div>
                  
                  {/* Show/Hide Badges Toggle */}
                  <button 
                    onClick={() => setShowBadges(!showBadges)} 
                    className={`
                      p-2.5 rounded-xl transition-colors flex-shrink-0
                      ${showBadges 
                        ? 'text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20' 
                        : 'text-charcoal-400 hover:bg-slate-200 dark:hover:bg-charcoal-800 hover:text-charcoal-700 dark:hover:text-white'
                      }
                    `}
                    title={showBadges ? "Hide Page Numbers" : "Show Page Numbers"}
                  >
                    {showBadges ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>

                  {/* Close Button */}
                  <button 
                    onClick={reset}
                    className="p-2.5 rounded-xl transition-colors flex-shrink-0 text-charcoal-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>

            {/* --- SETTINGS BAR (Numbers Mode) --- */}
            {mode === 'numbers' && (
               <div className="w-full bg-white dark:bg-charcoal-800 border-b border-slate-200 dark:border-charcoal-700 p-4 animate-in slide-in-from-top-2">
                  <div className="max-w-xl mx-auto space-y-4">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <EZDropdown label="Position" value={numberingConfig.position} options={[{ label: 'Bottom', value: 'bottom' },{ label: 'Top', value: 'top' }]} onChange={(val) => setNumberingConfig({...numberingConfig, position: val})} fullWidth />
                        <EZDropdown label="Align" value={numberingConfig.alignment} options={[{ label: 'Left', value: 'left' },{ label: 'Center', value: 'center' },{ label: 'Right', value: 'right' }]} onChange={(val) => setNumberingConfig({...numberingConfig, alignment: val})} fullWidth />
                        <EZDropdown label="Font" value={numberingConfig.fontFamily} options={fontOptions} onChange={(val) => setNumberingConfig({...numberingConfig, fontFamily: val})} fullWidth />
                        <div className="relative w-full h-10 flex items-center bg-slate-100 dark:bg-charcoal-700 rounded-xl border border-slate-200 dark:border-charcoal-600 overflow-hidden">
                           <button onClick={() => setNumberingConfig(c => ({...c, startFrom: Math.max(1, c.startFrom - 1)}))} className="w-10 h-full flex items-center justify-center text-charcoal-500 hover:bg-slate-200 dark:hover:bg-charcoal-600 active:scale-95 transition-all border-r border-slate-200 dark:border-charcoal-600"><Minus size={14} /></button>
                           <div className="flex-1 flex items-center justify-center px-1"><span className="text-[10px] font-bold text-charcoal-400 dark:text-slate-500 uppercase tracking-wider mr-1">Start</span><input type="number" value={numberingConfig.startFrom} onChange={(e) => setNumberingConfig({...numberingConfig, startFrom: Math.max(1, parseInt(e.target.value) || 1)})} className="bg-transparent outline-none text-center font-bold text-charcoal-800 dark:text-white w-8 p-0 text-sm" min="1"/></div>
                           <button onClick={() => setNumberingConfig(c => ({...c, startFrom: c.startFrom + 1}))} className="w-10 h-full flex items-center justify-center text-charcoal-500 hover:bg-slate-200 dark:hover:bg-charcoal-600 active:scale-95 transition-all border-l border-slate-200 dark:border-charcoal-600"><Plus size={14} /></button>
                        </div>
                     </div>
                     <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center gap-4"><label className="text-xs font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide flex-shrink-0">Font Size</label><input type="range" min="8" max="48" step="1" value={numberingConfig.fontSize} onChange={(e) => setNumberingConfig({...numberingConfig, fontSize: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md" /><span className="text-xs bg-slate-100 dark:bg-charcoal-950 px-2 py-0.5 rounded text-slate-600 dark:text-charcoal-400 font-mono font-bold w-12 text-center">{numberingConfig.fontSize}pt</span></div>
                        <div className="flex justify-between items-center gap-4"><label className="text-xs font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide flex-shrink-0">X Offset</label><input type="range" min="-100" max="100" step="1" value={numberingConfig.offsetX} onChange={(e) => setNumberingConfig({...numberingConfig, offsetX: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md" /><span className="text-xs bg-slate-100 dark:bg-charcoal-950 px-2 py-0.5 rounded text-slate-600 dark:text-charcoal-400 font-mono font-bold w-12 text-center">{numberingConfig.offsetX}pt</span></div>
                        <div className="flex justify-between items-center gap-4"><label className="text-xs font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide flex-shrink-0">Y Offset</label><input type="range" min="-100" max="100" step="1" value={numberingConfig.offsetY} onChange={(e) => setNumberingConfig({...numberingConfig, offsetY: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md" /><span className="text-xs bg-slate-100 dark:bg-charcoal-950 px-2 py-0.5 rounded text-slate-600 dark:text-charcoal-400 font-mono font-bold w-12 text-center">{numberingConfig.offsetY}pt</span></div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- MAIN GRID --- */}
            <div className="w-full max-w-7xl p-4 pb-32 flex-1">
                 <AnimatePresence mode="wait">
                    {!result ? (
                       <SplitPageGrid 
                          pages={pages}
                          onTogglePage={handleTogglePage}
                          onSelectAll={() => setPages(p => p.map(x => ({ ...x, selected: true })))}
                          onDeselectAll={() => setPages(p => p.map(x => ({ ...x, selected: false })))}
                          onInvertSelection={() => setPages(p => p.map(x => ({ ...x, selected: !x.selected })))}
                          onRemovePage={handleRemovePage}
                          onRemoveSelected={handleRemoveSelected}
                          onReorder={handleReorder}
                          useVisualIndexing={true}
                          numberingConfig={mode === 'numbers' ? numberingConfig : undefined}
                          isReorderDisabled={mode === 'numbers'}
                          showBadges={showBadges}
                       />
                    ) : (
                       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[50vh]">
                          <div className="bg-brand-mint/10 border border-brand-mint/20 rounded-3xl p-8 text-center max-w-md w-full shadow-lg">
                             <CheckCircle size={64} className="text-brand-mint mx-auto mb-4" />
                             <h3 className="text-2xl font-bold text-charcoal-800 dark:text-white mb-2">Ready!</h3>
                             <p className="text-charcoal-500 dark:text-slate-400 mb-6 truncate max-w-xs mx-auto">{result.name}</p>
                             <button onClick={downloadResult} className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Download size={20} /> Download PDF
                             </button>
                             <button onClick={() => setResult(null)} className="w-full mt-4 py-3 text-charcoal-500 hover:text-brand-purple font-medium flex items-center justify-center gap-2">
                                <RefreshCcw size={16} /> Continue Editing
                             </button>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
            </div>

            {/* --- BOTTOM ACTION BAR --- */}
            {!result && (
               <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 p-4 z-50">
                  <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="hidden md:block text-xs font-medium text-charcoal-400 dark:text-slate-500">
                        {pages.length} Pages • Drag to reorder
                     </div>

                     <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {mode === 'organize' ? (
                           <>
                             <button
                                onClick={() => handleExport('split')}
                                disabled={isGenerating || pages.filter(p => p.selected).length === 0}
                                className="px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-charcoal-600 font-bold text-charcoal-600 dark:text-slate-300 hover:border-brand-purple/50 hover:text-brand-purple transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                             >
                                <Scissors size={18} /> Split Selected
                             </button>
                             <button
                                onClick={() => handleExport('download')}
                                disabled={isGenerating || pages.length === 0}
                                className="flex-1 md:flex-none px-8 py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px] text-sm"
                             >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <ArrowLeftRight size={18} />}
                                {isGenerating ? 'Processing...' : 'Download Organized PDF'}
                             </button>
                           </>
                        ) : (
                           <button
                              onClick={() => handleExport('numbers')}
                              disabled={isGenerating || pages.length === 0}
                              className="flex-1 md:flex-none px-8 py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px] text-sm"
                           >
                              {isGenerating ? <Loader2 className="animate-spin" /> : <Hash size={18} />}
                              {isGenerating ? 'Processing...' : 'Apply Numbers & Download'}
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};