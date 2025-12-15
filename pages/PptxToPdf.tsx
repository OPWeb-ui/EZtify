
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPptxToPdf } from '../services/pptxConverter';
import { loadPdfPages } from '../services/pdfSplitter';
import { generatePDF } from '../services/pdfGenerator';
import { FileRejection } from 'react-dropzone';
import { 
  Presentation, RefreshCw, Lock, Cpu, Settings, Loader2, 
  Download, Layers, Maximize, Minimize, ZoomIn, ZoomOut, CheckSquare, XSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { UploadedImage, PdfConfig } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { Sidebar } from '../components/Sidebar';
import { FilmstripModal } from '../components/FilmstripModal';

export const PptxToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // --- State ---
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<UploadedImage[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [selectedSlideIds, setSelectedSlideIds] = useState<Set<string>>(new Set());
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Configuration
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'landscape', // Default for PPTX
    fitMode: 'contain',
    margin: 0,
    quality: 1.0
  });

  // UI State
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'width' | 'actual'>('fit');
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(false); // Mobile
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  // --- Handlers ---

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PPTX file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    if (!f.name.toLowerCase().endsWith('.pptx')) {
       addToast("Unsupported Format", "Only .pptx files are supported.", "error");
       return;
    }

    setIsProcessing(true);
    setFile(f);
    setProgress(0);
    
    try {
       // 1. Convert PPTX to Intermediate PDF
       setStatus('Parsing presentation...');
       const pdfBlob = await convertPptxToPdf(f, (p) => setProgress(p * 0.5), setStatus);
       
       // 2. Render PDF pages to Images (Slides)
       setStatus('Extracting slides...');
       const tempPdfFile = new File([pdfBlob], "temp.pdf", { type: 'application/pdf' });
       const pdfPages = await loadPdfPages(tempPdfFile, (p) => setProgress(50 + (p * 0.5)), setStatus, { scale: 1.5 }); // High quality preview
       
       // 3. Map to UploadedImage format for compatibility with existing components
       const extractedSlides: UploadedImage[] = pdfPages.map(p => ({
           id: p.id,
           file: f, // Reference original file
           previewUrl: p.previewUrl,
           width: p.width || 1920,
           height: p.height || 1080,
           rotation: 0
       }));

       setSlides(extractedSlides);
       if (extractedSlides.length > 0) {
           setActiveSlideId(extractedSlides[0].id);
           setSelectedSlideIds(new Set(extractedSlides.map(s => s.id))); // Select all by default
       }
       
       addToast("Success", `Loaded ${extractedSlides.length} slides`, "success");

    } catch (e) {
       console.error(e);
       addToast("Conversion Failed", "Could not process presentation.", "error");
       setFile(null);
    } finally {
       setIsProcessing(false);
       setProgress(0);
       setStatus('');
    }
  }, [addToast]);

  const handleReset = () => {
    setFile(null);
    setSlides([]);
    setActiveSlideId(null);
    setSelectedSlideIds(new Set());
    setProgress(0);
    setStatus('');
  };

  const handleExport = async () => {
      if (slides.length === 0) return;
      
      const slidesToExport = slides.filter(s => selectedSlideIds.has(s.id));
      if (slidesToExport.length === 0) {
          addToast("Warning", "No slides selected for export", "warning");
          return;
      }

      setIsGenerating(true);
      try {
          // Use the Image-to-PDF generator to create the final PDF with precise layout control
          await generatePDF(slidesToExport, config, setProgress, setStatus);
          addToast("Success", "PDF exported successfully!", "success");
      } catch (e) {
          console.error(e);
          addToast("Error", "Export failed.", "error");
      } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
      }
  };

  // --- Zoom Logic ---
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual' || !activeSlideId) return;

    const updateZoom = () => {
      if (!containerRef.current || !baseDimensionsRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const { width: baseW, height: baseH } = baseDimensionsRef.current;
      
      const padding = 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);

      if (fitMode === 'width') {
        setZoom(availW / baseW);
      } else {
        const scaleW = availW / baseW;
        const scaleH = availH / baseH;
        setZoom(Math.min(scaleW, scaleH));
      }
    };

    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    updateZoom();
    return () => observer.disconnect();
  }, [fitMode, activeSlideId]);

  // --- Helpers ---
  const activeSlide = slides.find(s => s.id === activeSlideId) || null;
  
  const handleSlideSelect = (id: string, event?: React.MouseEvent) => {
      setActiveSlideId(id);
      if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
          setSelectedSlideIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
          });
      } else if (!selectedSlideIds.has(id)) {
          // If simply clicking, don't change selection unless multi-select keys are used
          // or we can allow simple click to select single.
          // Let's keep selection separate from viewing.
      }
  };

  // Delete Slide Logic: Removes from the export list
  const handleRemoveSlide = (id: string) => {
      setSlides(prev => prev.filter(s => s.id !== id));
      setSelectedSlideIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
      if (activeSlideId === id) {
          setActiveSlideId(null);
      }
  };

  const selectAll = () => setSelectedSlideIds(new Set(slides.map(s => s.id)));
  const deselectAll = () => setSelectedSlideIds(new Set());

  // --- Render ---

  if (!file) {
    return (
      <ToolLandingLayout
        title="PPTX to PDF"
        description="Convert PowerPoint presentations to PDF. Review slides and customize layout before exporting."
        icon={<Presentation />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }}
        multiple={false}
        isProcessing={isProcessing}
        accentColor="text-orange-500"
        specs={[
          { label: "Input", value: "PPTX", icon: <Presentation /> },
          { label: "Engine", value: "Hybrid", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Layout", value: "Custom", icon: <Settings /> },
        ]}
        tip="You can choose to export specific slides and adjust page margins for handouts."
      />
    );
  }

  // Mobile Layout
  if (isMobile) {
      return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
            <PageReadyTracker />
            
            {/* Header */}
            <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between px-4 z-20 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                        <Presentation size={18} />
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

            {/* Preview */}
            <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20 flex items-center justify-center p-4">
                <Preview 
                    image={activeSlide} 
                    config={{...config, pageSize: 'auto'}} 
                    onReplace={()=>{}} 
                    onDropRejected={()=>{}}
                    scale={1}
                />
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 h-16 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-30 pb-[env(safe-area-inset-bottom)]">
                <motion.button
                    whileTap={buttonTap}
                    onClick={() => setIsFilmstripOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-charcoal-800 rounded-xl text-charcoal-700 dark:text-slate-300 font-bold text-xs"
                >
                    <Layers size={16} /> Slides ({slides.length})
                </motion.button>

                <motion.button
                    whileTap={buttonTap}
                    onClick={handleExport}
                    disabled={isGenerating || selectedSlideIds.size === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-brand-purple/20 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Export PDF</span>
                </motion.button>
            </div>

            <FilmstripModal
                isOpen={isFilmstripOpen}
                onClose={() => setIsFilmstripOpen(false)}
                title={`Slides (${slides.length})`}
            >
                <Filmstrip 
                    images={slides}
                    activeImageId={activeSlideId}
                    selectedImageIds={selectedSlideIds}
                    onSelect={(id) => { handleSlideSelect(id); setIsFilmstripOpen(false); }}
                    onReorder={()=>{}} onRemove={handleRemoveSlide} onRotate={()=>{}}
                    isMobile={true} direction="vertical" size="md" isReorderable={false} showRemoveButton={true} showRotateButton={false}
                />
            </FilmstripModal>
        </div>
      );
  }

  // Desktop 3-Panel Layout
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden">
      <PageReadyTracker />
      
      {/* 1. LEFT PANE: Filmstrip */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <div className="flex items-center gap-2">
                  <Layers size={16} className="text-charcoal-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Slides ({slides.length})</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={selectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Select All"><CheckSquare size={14} /></button>
                 <button onClick={deselectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Deselect All"><XSquare size={14} /></button>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={slides}
                  activeImageId={activeSlideId}
                  selectedImageIds={selectedSlideIds}
                  onSelect={handleSlideSelect}
                  onReorder={()=>{}} onRemove={handleRemoveSlide} onRotate={()=>{}}
                  isMobile={false} direction="vertical" size="md" isReorderable={false} showRemoveButton={true} showRotateButton={false}
              />
          </div>
          
          <div className="p-2 border-t border-slate-100 dark:border-charcoal-800 text-[10px] text-center font-mono text-charcoal-400 bg-white dark:bg-charcoal-900">
             {selectedSlideIds.size} slides selected for export
          </div>
      </div>

      {/* 2. CENTER PANE: Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
          <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">{file.name}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button onClick={() => setFitMode(fitMode === 'fit' ? 'width' : 'fit')} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Toggle Fit">{fitMode === 'fit' ? <Maximize size={14} /> : <Minimize size={14} />}</button>
              </div>
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto relative grid place-items-center p-8 custom-scrollbar">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                   style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />
              
              {activeSlide ? (
                 <Preview 
                    image={activeSlide}
                    config={config} // Use current config to preview layout!
                    onReplace={()=>{}} 
                    onDropRejected={()=>{}}
                    scale={zoom}
                    baseDimensionsRef={baseDimensionsRef}
                 />
              ) : (
                 <div className="text-charcoal-400 font-mono text-sm uppercase tracking-widest flex flex-col items-center gap-2">
                    <Presentation size={24} className="opacity-50" />
                    <span>No Slide Selected</span>
                 </div>
              )}
          </div>
      </div>

      {/* 3. RIGHT PANE: Configuration */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
              <Settings size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Export Settings</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Reuse Sidebar for consistent form fields */}
              <Sidebar 
                  mode="image-to-pdf" // Reuse logic
                  config={config}
                  exportConfig={{ format: 'jpeg', quality: 1, scale: 1 }}
                  onConfigChange={setConfig}
                  onExportConfigChange={()=>{}}
                  isOpen={true}
                  isMobile={false}
                  variant="embedded"
              />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleExport} 
                  disabled={isGenerating || selectedSlideIds.size === 0} 
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
                      <span>{isGenerating ? status || 'EXPORTING...' : 'EXPORT PDF'}</span>
                  </div>
              </motion.button>
              
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={handleReset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset Project
              </motion.button>
          </div>
      </div>
    </div>
  );
};
