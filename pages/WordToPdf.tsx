
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertWordToPdf } from '../services/wordConverter';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { PdfPage, UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { FileRejection } from 'react-dropzone';
import { 
  FileText, RefreshCw, Lock, Cpu, Settings, Loader2, 
  Download, Layers, Trash2, CheckSquare, XSquare, ZoomIn, ZoomOut, Maximize, LayoutGrid, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FilmstripModal } from '../components/FilmstripModal';

export const WordToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [intermediatePdf, setIntermediatePdf] = useState<Blob | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile State
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid DOCX file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    
    try {
      // 1. Convert Word to PDF Buffer immediately
      setStatus('Converting DOCX to PDF...');
      const pdfBlob = await convertWordToPdf(f, { pageSize: 'a4', orientation: 'portrait' }, setProgress, setStatus);
      
      const pdfFile = new File([pdfBlob], "temp.pdf", { type: "application/pdf" });
      setIntermediatePdf(pdfBlob);
      setFile(f);

      // 2. Load Pages from the generated PDF
      setStatus('Analyzing pages...');
      const loadedPages = await loadPdfPages(pdfFile, setProgress, setStatus);
      
      if (loadedPages.length > 0) {
        setPages(loadedPages);
        setActivePageId(loadedPages[0].id);
        setSelectedPageIds(new Set([loadedPages[0].id]));
      } else {
        addToast("Error", "No pages generated.", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to process document.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);
  
  const handleReset = () => {
    setFile(null);
    setIntermediatePdf(null);
    setPages([]);
    setActivePageId(null);
    setSelectedPageIds(new Set());
    setProgress(0);
    setStatus('');
    setIsFilmstripOpen(false);
  };

  const handleDownload = async () => {
    if (!intermediatePdf || !file) return;
    
    setIsGenerating(true);
    try {
      setStatus('Finalizing PDF...');
      const tempFile = new File([intermediatePdf], "source.pdf");
      const blob = await savePdfWithModifications(tempFile, pages, undefined, setProgress, setStatus);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast("Success", "PDF Saved!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error", "Save failed.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  // --- Page Selection & Deletion Logic ---

  const handlePageSelect = (id: string, event?: React.MouseEvent) => {
    setActivePageId(id);
    if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
        setSelectedPageIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    } else {
        setSelectedPageIds(new Set([id]));
    }
  };

  const handleRemovePage = (id: string) => {
    setPages(prev => {
        const next = prev.filter(p => p.id !== id);
        if (activePageId === id) setActivePageId(next.length ? next[0].id : null);
        return next;
    });
    setSelectedPageIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const handleRemoveSelected = () => {
    setPages(prev => {
        const next = prev.filter(p => !selectedPageIds.has(p.id));
        if (activePageId && selectedPageIds.has(activePageId)) setActivePageId(next.length ? next[0].id : null);
        return next;
    });
    setSelectedPageIds(new Set());
  };

  const handleSelectAll = () => setSelectedPageIds(new Set(pages.map(p => p.id)));
  const handleDeselectAll = () => setSelectedPageIds(new Set());

  // --- View Logic ---
  
  const activePage = pages.find(p => p.id === activePageId) || null;
  const filmstripImages: UploadedImage[] = useMemo(() => pages.map(p => ({
      id: p.id,
      file: file!, 
      previewUrl: p.previewUrl,
      width: p.width || 0,
      height: p.height || 0,
      rotation: p.rotation || 0
  })), [pages, file]);

  if (!file) {
    return (
      <ToolLandingLayout
        title="Word to PDF"
        description="Convert DOCX files to PDF. Review and delete unwanted pages before saving."
        icon={<FileText />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-blue-500"
        specs={[
          { label: "Format", value: "DOCX", icon: <FileText /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Engine", value: "JS/PDF", icon: <Cpu /> },
          { label: "Edit", value: "Delete Pages", icon: <Settings /> },
        ]}
        tip="EZtify renders your Word doc to PDF immediately, allowing you to check the layout and remove blank or unwanted pages."
      />
    );
  }

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
            <PageReadyTracker />
            
            {/* Header */}
            <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText size={18} />
                    </div>
                    <span className="font-mono font-bold text-sm text-charcoal-800 dark:text-white truncate">
                        {file.name}
                    </span>
                </div>
                <motion.button 
                    whileTap={buttonTap} 
                    onClick={handleReset} 
                    className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
                >
                    <RefreshCw size={18} />
                </motion.button>
            </div>

            {/* Main Preview */}
            <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20 flex items-center justify-center p-4">
                <div className="w-full h-full flex items-center justify-center relative shadow-sm">
                    {activePage ? (
                        <motion.img
                            key={activePage.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={techEase}
                            src={activePage.previewUrl}
                            alt="Active Page"
                            className="max-w-full max-h-full object-contain rounded-lg bg-white"
                            draggable={false}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-charcoal-400 gap-2">
                            <FileText size={48} className="opacity-20" />
                            <span className="text-xs font-mono font-bold uppercase tracking-widest">No Page Selected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
                <div className="text-xs font-mono font-bold text-charcoal-500 dark:text-charcoal-400 bg-slate-100 dark:bg-charcoal-800 px-3 py-1.5 rounded-lg">
                    {activePage ? `${(pages.indexOf(activePage) + 1)} / ${pages.length}` : '- / -'}
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={buttonTap}
                        onClick={() => setIsFilmstripOpen(true)}
                        className="w-12 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors"
                        title="Pages"
                    >
                        <LayoutGrid size={20} />
                    </motion.button>

                    <motion.button
                        whileTap={buttonTap}
                        onClick={handleDownload}
                        disabled={isGenerating || pages.length === 0}
                        className="w-14 h-10 flex items-center justify-center rounded-xl bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 shadow-lg shadow-brand-purple/20 disabled:opacity-50 transition-all relative overflow-hidden"
                        title="Export"
                    >
                        {isGenerating && (
                            <motion.div 
                                className="absolute inset-0 bg-white/20 dark:bg-black/10"
                                initial={{ width: '0%' }} 
                                animate={{ width: `${progress}%` }} 
                            />
                        )}
                        <div className="relative z-10">
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </div>
                    </motion.button>
                </div>
            </div>

            {/* Filmstrip Sheet */}
            <FilmstripModal
                isOpen={isFilmstripOpen}
                onClose={() => setIsFilmstripOpen(false)}
                title={`Document Pages (${pages.length})`}
            >
                <Filmstrip 
                    images={filmstripImages}
                    activeImageId={activePageId}
                    selectedImageIds={selectedPageIds}
                    onSelect={(id) => handlePageSelect(id)}
                    onReorder={() => {}} 
                    onRemove={handleRemovePage}
                    onRotate={() => {}} 
                    isMobile={true}
                    direction="vertical"
                    size="md"
                    isReorderable={false}
                    showRemoveButton={true}
                    showRotateButton={false}
                />
            </FilmstripModal>
        </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden">
      <PageReadyTracker />
      
      {/* LEFT PANE: Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <div className="flex items-center gap-2">
                  <Layers size={16} className="text-charcoal-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={handleSelectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Select All"><CheckSquare size={14} /></button>
                 <button onClick={handleDeselectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Deselect All"><XSquare size={14} /></button>
              </div>
          </div>
          
          {/* Filmstrip List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={filmstripImages}
                  activeImageId={activePageId}
                  selectedImageIds={selectedPageIds}
                  onSelect={handlePageSelect}
                  onReorder={() => {}} 
                  onRemove={handleRemovePage}
                  onRotate={() => {}} 
                  isMobile={false}
                  direction="vertical"
                  size="md"
                  isReorderable={false}
                  showRemoveButton={true}
                  showRotateButton={false}
              />
          </div>
          
          {/* Selection Actions */}
          <div className="p-3 border-t border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0">
             <motion.button
                whileTap={buttonTap}
                onClick={handleRemoveSelected}
                disabled={selectedPageIds.size === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Trash2 size={14} /> DELETE SELECTED ({selectedPageIds.size})
             </motion.button>
          </div>
      </div>

      {/* CENTER PANE: Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
          {/* Toolbar */}
          <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal-700 dark:text-charcoal-200">SOURCE:</span>
                      <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Reset Zoom"><Maximize size={14} /></button>
              </div>
          </div>

          {/* Canvas Area */}
          <div 
              ref={containerRef}
              className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar"
          >
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                   style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />
              
              {activePage ? (
                 <motion.div
                    layoutId={`preview-${activePage.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={techEase}
                    className="relative shadow-2xl ring-1 ring-black/5"
                    style={{ width: (activePage.width || 600) * zoom, height: (activePage.height || 800) * zoom }}
                 >
                    <img 
                       src={activePage.previewUrl} 
                       alt="Active Page" 
                       className="w-full h-full object-contain bg-white"
                       draggable={false}
                    />
                 </motion.div>
              ) : (
                 <div className="text-charcoal-400 font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="opacity-50" />
                    <span>No Page Selected</span>
                 </div>
              )}
          </div>
      </div>

      {/* RIGHT PANE: Settings */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Conversion</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Input</span>
                      <span className="font-bold text-charcoal-900 dark:text-white font-mono">DOCX</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Output</span>
                      <span className="font-bold text-charcoal-900 dark:text-white font-mono">PDF</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-charcoal-500 dark:text-charcoal-400 font-mono">Pages Generated</span>
                      <span className="font-bold text-charcoal-900 dark:text-white font-mono">{pages.length}</span>
                  </div>
              </div>
              
              <div className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed font-medium bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                 <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Preview Mode:</span>
                 The document has been rendered to PDF. You can now delete any pages you don't want before saving the final file.
              </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleDownload} 
                  disabled={isGenerating || pages.length === 0} 
                  whileTap={buttonTap} 
                  className="
                      relative overflow-hidden w-full h-12
                      bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                      font-bold font-mono text-xs tracking-wider uppercase
                      rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200
                      transition-all disabled:opacity-50 disabled:shadow-none
                      flex items-center justify-center gap-2 group
                  "
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
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isGenerating ? status || 'SAVING...' : 'DOWNLOAD PDF'}</span>
                  </div>
              </motion.button>
              
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={handleReset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset All
              </motion.button>
          </div>
      </div>
    </div>
  );
};
