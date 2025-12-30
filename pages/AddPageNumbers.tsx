
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, PageNumberConfig } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { useDropzone } from 'react-dropzone';
import { 
  Hash, ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, 
  Type, Move, RefreshCw, Download, Settings, ChevronLeft, ChevronRight, 
  Plus, Play, X, Minus, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { standardLayoutTransition } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';
import { EZButton } from '../components/EZButton';
import { EZSlider } from '../components/EZSlider';
import { EZDropdown } from '../components/EZDropdown';
import { UploadArea } from '../components/UploadArea';

const ACCENT_COLOR = "#7B1FA2";
const FONTS = [{ label: 'Helvetica', value: 'Helvetica' }, { label: 'Times Roman', value: 'Times-Roman' }, { label: 'Courier', value: 'Courier' }];

export const AddPageNumbersPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [config, setConfig] = useState<PageNumberConfig>({ position: 'bottom', alignment: 'center', startFrom: 1, fontSize: 12, fontFamily: 'Helvetica', offsetX: 0, offsetY: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    try {
      const loaded = await loadPdfPages(f, setProgress, undefined, { scale: 1.0 });
      if (loaded.length > 0) {
        setFile(f); setPages(loaded); setActivePageId(loaded[0].id);
        addToast("Success", "Document mounted.", "success");
      }
    } catch (e) { addToast("Error", "Buffer failure.", "error"); }
  }, [addToast]);

  const { getRootProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, noClick: true, noKeyboard: true });

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const blob = await savePdfWithModifications(file, pages, config, setProgress);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `numbered_${file.name}`; link.click();
      URL.revokeObjectURL(url);
      addToast("Success", "Document exported.", "success");
    } catch (e) { addToast("Error", "Export failure.", "error"); }
    finally { setIsGenerating(true); setIsGenerating(false); }
  };

  const activeIndex = pages.findIndex(p => p.id === activePageId);
  const activePage = pages[activeIndex] || null;

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-nd-base" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Replace PDF" variant="purple" />
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className={`w-72 flex-shrink-0 border-r border-nd-border bg-nd-surface flex-col h-full z-20 ${isMobile ? 'hidden' : 'flex'}`}>
           <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b border-nd-border bg-nd-surface">
              <div className="flex items-center gap-2"><IconBox icon={<Hash />} size="xs" active toolAccentColor={ACCENT_COLOR} /><span className="text-[10px] font-bold text-nd-muted uppercase tracking-wider">{pages.length} Pages</span></div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
              <div className="grid grid-cols-3 gap-1 p-1 bg-nd-subtle rounded-xl border border-nd-border">
                  {[{p:'top',a:'left'},{p:'top',a:'center'},{p:'top',a:'right'},{p:'bottom',a:'left'},{p:'bottom',a:'center'},{p:'bottom',a:'right'}].map((b,i)=>(<button key={i} onClick={()=>setConfig({...config, position:b.p as any, alignment:b.a as any})} className={`h-8 rounded-lg flex items-center justify-center ${config.position===b.p && config.alignment===b.a ? 'bg-purple-600 text-white' : 'text-nd-muted hover:bg-white'}`}><div className={`w-2 h-2 border-2 border-current ${b.p==='top'?'mb-auto':'mt-auto'} ${b.a==='left'?'mr-auto':b.a==='right'?'ml-auto':''}`} /></button>))}
              </div>
              <EZSlider label="Font Size" value={config.fontSize} min={8} max={48} onChange={v => setConfig({...config, fontSize:v})} />
              <EZDropdown label="Font Family" value={config.fontFamily} options={FONTS} onChange={v => setConfig({...config, fontFamily:v})} fullWidth />
           </div>
           <div className="p-4 border-t border-nd-border bg-nd-surface">
              <EZButton variant="primary" fullWidth onClick={handleGenerate} disabled={!file} icon={<Play size={16} />}>Save PDF</EZButton>
           </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 bg-nd-base relative flex flex-col h-full overflow-hidden">
           <div className="hidden md:flex h-14 border-b border-nd-border bg-nd-surface items-center justify-between px-4 shrink-0 z-30">
              <EZButton variant="ghost" size="sm" onClick={() => { setFile(null); setPages([]); }} icon={<RefreshCw size={14} />}>Reset</EZButton>
              <EZButton variant="primary" size="sm" onClick={handleGenerate} disabled={!file} icon={<Download size={14} />}>Export</EZButton>
           </div>

           <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
              {!file ? (
                <div className="h-full flex items-center justify-center p-8 w-full"><UploadArea onDrop={onDrop} mode="add-page-numbers" accept={{'application/pdf': ['.pdf']}} multiple={false} isProcessing={false} /></div>
              ) : activePage && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white shadow-2xl rounded border border-nd-border max-w-full max-h-full aspect-[3/4] p-4 flex items-center justify-center">
                   <img src={activePage.previewUrl} className="max-w-full max-h-full object-contain opacity-40" />
                   <div className="absolute font-bold text-black" style={{ ...(config.position==='top'?{top:'4%'}:{bottom:'4%'}), ...(config.alignment==='left'?{left:'4%'}:config.alignment==='right'?{right:'4%'}:{left:'50%',transform:'translateX(-50%)'}), fontSize: `${config.fontSize*1.5}px` }}>{config.startFrom + activeIndex}</div>
                </motion.div>
              )}
           </div>

           {isMobile && file && (
             <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center">
                <div className="bg-nd-surface border border-nd-border rounded-2xl shadow-2xl p-2 flex items-center gap-4">
                   <EZButton variant="primary" size="md" onClick={handleGenerate} icon={<Download size={18} />}>Download</EZButton>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
