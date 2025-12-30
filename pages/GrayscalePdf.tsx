
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { loadPdfPages } from '../services/pdfSplitter';
import { convertPdfVisual, VisualFilterMode } from '../services/pdfGrayscale';
import { PdfFile, PdfPage } from '../types';
import { useDropzone } from 'react-dropzone';
import { 
  Palette, Download, RefreshCw, Monitor, Sun, Moon, 
  FileText, Plus, Play, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';
import { EZButton } from '../components/EZButton';
import { EZSegmentedControl } from '../components/EZSegmentedControl';
import { UploadArea } from '../components/UploadArea';

const ACCENT_COLOR = "#7C3AED";

export const GrayscalePdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<PdfFile | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<VisualFilterMode>('grayscale');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    try {
      const loaded = await loadPdfPages(acceptedFiles[0], undefined, undefined, { scale: 1.0 });
      if (loaded.length > 0) {
        setFile({ id: Date.now().toString(), file: acceptedFiles[0] });
        setPages(loaded); setActivePageId(loaded[0].id);
        addToast("Success", "Document mounted.", "success");
      }
    } catch (e) { addToast("Error", "Buffer failure.", "error"); }
  }, [addToast]);

  // Fix: useDropzone is now imported
  const { getRootProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, noClick: true, noKeyboard: true });

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const result = await convertPdfVisual(file, visualMode);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url; link.download = result.fileName; link.click();
      URL.revokeObjectURL(url);
      addToast("Success", "File reprocessed.", "success");
    } catch (e) { addToast("Error", "Export failure.", "error"); }
    finally { setIsGenerating(false); }
  };

  const activeIndex = pages.findIndex(p => p.id === activePageId);
  const activePage = pages[activeIndex];

  const getFilterStyle = (mode: VisualFilterMode) => {
    switch (mode) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'night': return 'invert(100%) brightness(0.8)';
      default: return 'none';
    }
  };

  return (
    <div className="flex flex-col w-full h-full font-sans overflow-hidden relative bg-nd-base" {...getRootProps()}>
      <PageReadyTracker />
      <DragDropOverlay isDragActive={isDragActive} message="Replace PDF" variant="violet" />
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files && onDrop(Array.from(e.target.files))} />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className={`w-72 flex-shrink-0 border-r border-nd-border bg-nd-surface flex-col h-full z-20 ${isMobile ? 'hidden' : 'flex'}`}>
           <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b border-nd-border bg-nd-surface">
              <div className="flex items-center gap-2"><IconBox icon={<Palette />} size="xs" active toolAccentColor={ACCENT_COLOR} /><span className="text-[10px] font-bold text-nd-muted uppercase tracking-wider">{pages.length} Pages</span></div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="grid grid-cols-1 gap-3">
                 {['original', 'grayscale', 'sepia', 'night'].map(m => (
                   <button key={m} onClick={()=>setVisualMode(m as any)} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all ${visualMode===m ? 'bg-violet-600 text-white border-violet-600' : 'bg-nd-subtle border-nd-border hover:bg-white'}`}>
                      <span className="capitalize">{m}</span>
                   </button>
                 ))}
              </div>
           </div>
           <div className="p-4 border-t border-nd-border bg-nd-surface">
              <EZButton variant="primary" fullWidth onClick={handleGenerate} disabled={!file} icon={<Play size={16} />}>Export PDF</EZButton>
           </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 bg-nd-base relative flex flex-col h-full overflow-hidden">
           {!file ? (
             <div className="h-full flex items-center justify-center p-8 w-full"><UploadArea onDrop={onDrop} mode="grayscale-pdf" accept={{'application/pdf': ['.pdf']}} multiple={false} isProcessing={false} /></div>
           ) : activePage && (
             <>
               <div className="hidden md:flex h-14 border-b border-nd-border bg-nd-surface items-center justify-between px-4 shrink-0 z-30">
                  <EZButton variant="ghost" size="sm" onClick={() => setFile(null)} icon={<RefreshCw size={14} />}>Reset</EZButton>
                  <div className="flex items-center gap-2"><button onClick={() => activeIndex > 0 && setActivePageId(pages[activeIndex-1].id)} disabled={activeIndex===0} className="p-1 disabled:opacity-30"><ChevronLeft size={16}/></button><span className="text-xs font-mono">{activeIndex+1}/{pages.length}</span><button onClick={() => activeIndex < pages.length-1 && setActivePageId(pages[activeIndex+1].id)} disabled={activeIndex===pages.length-1} className="p-1 disabled:opacity-30"><ChevronRight size={16}/></button></div>
                  <EZButton variant="primary" size="sm" onClick={handleGenerate} icon={<Download size={14} />}>Save</EZButton>
               </div>
               <div className="flex-1 flex items-center justify-center p-8 relative">
                  <motion.div key={activePage.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white shadow-2xl rounded p-4 max-w-full max-h-full aspect-[3/4] flex items-center justify-center">
                     <img src={activePage.previewUrl} className="max-w-full max-h-full object-contain" style={{ filter: getFilterStyle(visualMode) }} />
                  </motion.div>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};
