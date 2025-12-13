
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, PageNumberConfig } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { FileRejection, useDropzone } from 'react-dropzone';
import { 
  ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, 
  Type, Hash, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings, RefreshCw, Download, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const AddPageNumbersPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [config, setConfig] = useState<PageNumberConfig>({
    position: 'bottom',
    alignment: 'center',
    startFrom: 1,
    fontSize: 12,
    fontFamily: 'Helvetica',
    offsetX: 0,
    offsetY: 0
  });

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Loading preview...');
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       const blob = await savePdfWithModifications(file, pages, config, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `numbered_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "Numbers added!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
    } finally {
       setIsGenerating(false);
       setProgress(0);
       setStatus('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setConfig({
        position: 'bottom',
        alignment: 'center',
        startFrom: 1,
        fontSize: 12,
        fontFamily: 'Helvetica',
        offsetX: 0,
        offsetY: 0
    });
  };

  const nudge = (axis: 'x' | 'y', dir: 1 | -1) => {
    setConfig(prev => {
        if (axis === 'x') {
            return { ...prev, offsetX: prev.offsetX + (dir * 2) };
        } else {
            return { ...prev, offsetY: prev.offsetY + (dir * 2) };
        }
    });
  };

  const ControlGroup = ({ label, children, className = "" }: { label: string, children?: React.ReactNode, className?: string }) => (
    <div className={`space-y-2 ${className}`}>
      <span className="text-[10px] uppercase font-bold text-charcoal-400 dark:text-slate-500 tracking-wider whitespace-nowrap font-mono">{label}</span>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );

  const ToggleButton = ({ active, onClick, icon: Icon, label, compact = false }: any) => (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold font-mono transition-all border
        ${compact ? 'p-2 w-9 h-9' : 'flex-1 px-2 py-2'}
        ${active 
          ? 'bg-brand-purple text-white border-brand-purple' 
          : 'bg-white dark:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 border-slate-200 dark:border-charcoal-600 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
      `}
      title={label}
    >
      <Icon size={14} />
      {!compact && <span className="truncate">{label}</span>}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <ToolLandingLayout
            title="Add Page Numbers"
            description="Insert customizable page numbers into your PDF document instantly."
            icon={<Hash />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-indigo-500"
            specs={[
              { label: "Position", value: "Custom", icon: <ArrowUp /> },
              { label: "Font", value: "Standard", icon: <Type /> },
              { label: "Privacy", value: "Client-Side", icon: <Settings /> },
              { label: "Engine", value: "PDF-Lib", icon: <Hash /> },
            ]}
            tip="Adjust position, alignment, and starting number. Use the arrow controls for fine-tuning."
          />
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* MOBILE: Horizontal Top Toolbar */}
            <div className="md:hidden bg-white dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar shrink-0 shadow-sm z-30 h-16">
                <div className="flex gap-1 shrink-0">
                    <ToggleButton compact active={config.position === 'top'} onClick={() => setConfig({...config, position: 'top'})} icon={ArrowUp} />
                    <ToggleButton compact active={config.position === 'bottom'} onClick={() => setConfig({...config, position: 'bottom'})} icon={ArrowDown} />
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-charcoal-700 shrink-0" />
                <div className="flex gap-1 shrink-0">
                    <ToggleButton compact active={config.alignment === 'left'} onClick={() => setConfig({...config, alignment: 'left'})} icon={AlignLeft} />
                    <ToggleButton compact active={config.alignment === 'center'} onClick={() => setConfig({...config, alignment: 'center'})} icon={AlignCenter} />
                    <ToggleButton compact active={config.alignment === 'right'} onClick={() => setConfig({...config, alignment: 'right'})} icon={AlignRight} />
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
                
                {/* Preview Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-black/20 p-4 md:p-6 pb-24 md:pb-6 relative">
                    <div className="max-w-3xl mx-auto min-h-full">
                        <SplitPageGrid 
                            pages={pages}
                            onTogglePage={() => {}}
                            onSelectAll={() => {}}
                            onDeselectAll={() => {}}
                            onInvertSelection={() => {}}
                            onRemovePage={() => {}}
                            onRemoveSelected={() => {}}
                            onReorder={() => {}}
                            isReorderDisabled={true}
                            numberingConfig={config} 
                            showBadges={true}
                        />
                    </div>
                </div>

                {/* DESKTOP: Sidebar (Hidden on mobile) */}
                <div className="hidden md:flex w-80 p-6 flex-col gap-6 shrink-0 z-20 overflow-y-auto custom-scrollbar h-full bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800">
                    
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={16} className="text-charcoal-400" />
                        <h4 className="text-xs font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider font-mono">Number Settings</h4>
                    </div>

                    <ControlGroup label="Position">
                        <div className="flex w-full gap-2">
                            <ToggleButton active={config.position === 'top'} onClick={() => setConfig({...config, position: 'top'})} icon={ArrowUp} label="Top" />
                            <ToggleButton active={config.position === 'bottom'} onClick={() => setConfig({...config, position: 'bottom'})} icon={ArrowDown} label="Bottom" />
                        </div>
                    </ControlGroup>

                    <ControlGroup label="Alignment">
                        <div className="flex w-full gap-2">
                            <ToggleButton active={config.alignment === 'left'} onClick={() => setConfig({...config, alignment: 'left'})} icon={AlignLeft} label="Left" />
                            <ToggleButton active={config.alignment === 'center'} onClick={() => setConfig({...config, alignment: 'center'})} icon={AlignCenter} label="Center" />
                            <ToggleButton active={config.alignment === 'right'} onClick={() => setConfig({...config, alignment: 'right'})} icon={AlignRight} label="Right" />
                        </div>
                    </ControlGroup>

                    <div className="grid grid-cols-2 gap-4">
                        <ControlGroup label="Start #">
                            <div className="bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg px-3 py-2 flex items-center gap-2 h-10">
                                <Hash size={16} className="text-charcoal-400 shrink-0" />
                                <input 
                                    type="number" min="1"
                                    value={config.startFrom} onChange={(e) => setConfig({...config, startFrom: parseInt(e.target.value) || 1})}
                                    className="w-full bg-transparent text-sm font-bold text-charcoal-800 dark:text-white outline-none min-w-0 font-mono"
                                />
                            </div>
                        </ControlGroup>
                        <ControlGroup label="Size">
                            <div className="bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg px-3 py-2 flex items-center gap-2 h-10">
                                <Type size={16} className="text-charcoal-400 shrink-0" />
                                <input 
                                    type="number" min="8" max="48"
                                    value={config.fontSize} onChange={(e) => setConfig({...config, fontSize: parseInt(e.target.value) || 12})}
                                    className="w-full bg-transparent text-sm font-bold text-charcoal-800 dark:text-white outline-none min-w-0 font-mono"
                                />
                            </div>
                        </ControlGroup>
                    </div>

                    <ControlGroup label="Fine Tune Position">
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-charcoal-800 p-2 rounded-lg border border-slate-200 dark:border-charcoal-700">
                            <div className="col-start-2"><button onClick={() => nudge('y', 1)} className="w-full h-8 flex items-center justify-center bg-white dark:bg-charcoal-700 rounded shadow-sm hover:text-brand-purple border border-slate-200 dark:border-charcoal-600"><ChevronUp size={16} /></button></div>
                            <div className="col-start-1 row-start-2"><button onClick={() => nudge('x', -1)} className="w-full h-8 flex items-center justify-center bg-white dark:bg-charcoal-700 rounded shadow-sm hover:text-brand-purple border border-slate-200 dark:border-charcoal-600"><ChevronLeft size={16} /></button></div>
                            <div className="col-start-2 row-start-2 flex items-center justify-center"><button onClick={() => setConfig(p => ({...p, offsetX: 0, offsetY: 0}))} className="text-[10px] font-bold text-charcoal-400 hover:text-brand-purple font-mono" title="Reset Nudge">RESET</button></div>
                            <div className="col-start-3 row-start-2"><button onClick={() => nudge('x', 1)} className="w-full h-8 flex items-center justify-center bg-white dark:bg-charcoal-700 rounded shadow-sm hover:text-brand-purple border border-slate-200 dark:border-charcoal-600"><ChevronRight size={16} /></button></div>
                            <div className="col-start-2 row-start-3"><button onClick={() => nudge('y', -1)} className="w-full h-8 flex items-center justify-center bg-white dark:bg-charcoal-700 rounded shadow-sm hover:text-brand-purple border border-slate-200 dark:border-charcoal-600"><ChevronDown size={16} /></button></div>
                        </div>
                    </ControlGroup>

                    <div className="space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-charcoal-800">
                        <motion.button onClick={handleGenerate} disabled={isGenerating} whileTap={buttonTap} className="relative overflow-hidden w-full h-12 rounded-lg font-bold font-mono text-xs text-white bg-charcoal-900 dark:bg-white dark:text-charcoal-900 shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group hover:bg-brand-purple dark:hover:bg-slate-200">
                            {isGenerating && <motion.div className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />}
                            <div className="relative flex items-center justify-center gap-2 z-10">{isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}<span className="uppercase tracking-wide">{isGenerating ? 'PROCESSING...' : 'DOWNLOAD_PDF'}</span></div>
                        </motion.button>
                        <motion.button onClick={handleReset} whileTap={buttonTap} className="w-full flex items-center justify-center gap-2 h-10 rounded-lg font-bold font-mono text-xs uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><RefreshCw size={14} /> RESET_MODULE</motion.button>
                    </div>
                </div>
            </div>

            {/* MOBILE: Bottom Action Bar */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 flex gap-3 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <motion.button onClick={handleReset} whileTap={buttonTap} className="px-4 py-3 bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-charcoal-700"><RefreshCw size={20} /></motion.button>
                <motion.button onClick={handleGenerate} disabled={isGenerating} whileTap={buttonTap} className="flex-1 relative overflow-hidden h-12 rounded-lg font-bold font-mono text-xs text-white bg-charcoal-900 dark:bg-white dark:text-charcoal-900 shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide">
                    {isGenerating && <motion.div className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />}
                    <div className="relative flex items-center justify-center gap-2 z-10">{isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}<span>Download</span></div>
                </motion.button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
