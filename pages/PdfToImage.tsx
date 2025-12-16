
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { generateZip } from '../services/zipGenerator';
import { UploadedImage, ExportConfig, ImageFormat } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { Sidebar } from '../components/Sidebar';
import { FileRejection } from 'react-dropzone';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Image as ImageIcon, Cpu, Settings, Lock, Sliders, LayoutGrid, X, Minimize, Maximize, ZoomOut, ZoomIn, Download, Loader2, List, CheckSquare, Square, MousePointer2, ChevronUp, ChevronDown } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { techEase, modalContentVariants, buttonTap } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

type FitMode = 'fit' | 'width' | 'actual';
type ExportMode = 'all' | 'selected' | 'current';

export const PdfToImagePage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Mobile UI state
  const [isMobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pages' | 'settings'>('settings');
  
  // Config
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'jpeg',
    quality: 0.9,
    scale: 1 // Default to 72 DPI approx
  });
  
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- PREVIEW ZOOM STATE ---
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive Zoom Calculation
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual') return;

    const updateZoom = () => {
      if (!containerRef.current || !baseDimensionsRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const { width: baseW, height: baseH } = baseDimensionsRef.current;
      
      // On mobile, the containerRef is already inside the padded area, so we need less internal padding.
      // On desktop, we want more breathing room.
      const padding = isMobile ? 16 : 64; 
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
  }, [fitMode, activeImageId, isMobile]);

  const handleZoomIn = () => {
    setFitMode('actual');
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setFitMode('actual');
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleSetZoom = (newZoom: number) => {
      setFitMode('actual');
      setZoom(newZoom);
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Error", "Please select a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    const startTime = Date.now();
    setStatus('Parsing PDF structure...');
    
    try {
      const file = acceptedFiles[0];
      const extracted = await extractImagesFromPdf(file, setProgress, setStatus);
      
      // Enforce 1s minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      if (extracted.length > 0) {
        setImages(extracted);
        setActiveImageId(extracted[0].id);
        setSelectedPageIds(new Set());
        addToast("Success", `Extracted ${extracted.length} images.`, "success");
      } else {
        addToast("No Images", "No images found in this PDF.", "warning");
      }
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to process PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  const handlePageSelect = useCallback((id: string, event?: React.MouseEvent) => {
    setActiveImageId(id);
    
    if (event) {
      if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        setSelectedPageIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        return;
      }
      
      if (event.shiftKey && activeImageId) {
        // Range select
        const lastIndex = images.findIndex(img => img.id === activeImageId);
        const currentIndex = images.findIndex(img => img.id === id);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          
          setSelectedPageIds(prev => {
            const next = new Set(prev);
            for (let i = start; i <= end; i++) {
              next.add(images[i].id);
            }
            return next;
          });
          return;
        }
      }
    }
    
    // Simple click: If not holding modifiers, we usually just activate. 
    if (!event?.shiftKey && !event?.metaKey && !event?.ctrlKey) {
       setSelectedPageIds(new Set([id]));
    }
  }, [images, activeImageId]);

  const handleSelectAll = () => setSelectedPageIds(new Set(images.map(i => i.id)));
  const handleDeselectAll = () => setSelectedPageIds(new Set());

  const handleDownload = async () => {
    let imagesToExport = images;
    
    if (exportMode === 'selected') {
      imagesToExport = images.filter(img => selectedPageIds.has(img.id));
      if (imagesToExport.length === 0) {
        addToast("Warning", "No pages selected.", "warning");
        return;
      }
    } else if (exportMode === 'current') {
      imagesToExport = images.filter(img => img.id === activeImageId);
      if (imagesToExport.length === 0) return;
    }

    setIsGenerating(true);
    try {
      await generateZip(imagesToExport, exportConfig, setProgress);
      addToast("Success", "Images downloaded successfully.", "success");
    } catch (error) {
      addToast("Error", "Failed to create ZIP.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleExportChange = <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
    setExportConfig(prev => ({ ...prev, [key]: value }));
  };

  const activeImage = images.find(i => i.id === activeImageId) || null;

  // Derive pixel info for display
  const pixelInfo = activeImage ? {
      w: Math.round(activeImage.width * exportConfig.scale),
      h: Math.round(activeImage.height * exportConfig.scale)
  } : { w: 0, h: 0 };

  if (images.length === 0) {
    return (
      <ToolLandingLayout
        title="PDF to Image"
        description="Extract every page of your PDF as a high-resolution image."
        icon={<ImageIcon />}
        onDrop={(files) => onDrop(files, [])}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-yellow-500"
        specs={[
          { label: "Output", value: "JPG/PNG", icon: <ImageIcon /> },
          { label: "Engine", value: "PDF.js", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Quality", value: "High", icon: <Settings /> },
        ]}
        tip="Use the 'Extract' button to download all pages as a convenient ZIP archive."
      />
    );
  }

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="relative w-full h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
        <PageReadyTracker />
        <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
        />
        
        {/* Header */}
        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-20 shadow-sm relative">
           <div className="flex items-center gap-2">
              <IconBox icon={<ImageIcon />} size="sm" toolAccentColor="#EAB308" active />
              <span className="font-mono font-bold text-sm text-charcoal-900 dark:text-white uppercase tracking-tight">Extractor</span>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => { setImages([]); setProgress(0); }} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"><X size={18} /></button>
           </div>
        </div>

        {/* Main Canvas - Wrapper for measurement */}
        <div className="absolute inset-0 z-0 flex flex-col justify-center items-center px-4 pt-20 pb-28 bg-slate-100/50 dark:bg-black/20">
           <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
              <Preview 
                  image={activeImage} 
                  config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }}
                  onReplace={(file) => onDrop([file], [])} 
                  onDropRejected={() => {}}
                  scale={zoom}
                  baseDimensionsRef={baseDimensionsRef}
                  onAddFiles={undefined}
              />
           </div>
        </div>

        {/* Floating Inspector (Floaty File Manager Style) */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-2xl flex flex-col overflow-hidden"
          initial={false}
          animate={{ height: isMobileInspectorOpen ? 'auto' : '68px' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ maxHeight: '75vh' }}
        >
           {/* Handle */}
           <div 
              className="flex items-center justify-between px-6 h-[68px] shrink-0 relative bg-white dark:bg-charcoal-900 z-20 cursor-pointer" 
              onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}
           >
              <div className="flex flex-col justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500">Selected</span>
                 <span className="text-sm font-bold text-charcoal-900 dark:text-white font-mono">{selectedPageIds.size > 0 ? selectedPageIds.size : 'All'} Pages</span>
              </div>

              <div className="absolute left-1/2 top-3 -translate-x-1/2 w-12 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                 <button 
                    onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)} 
                    className="p-2.5 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-500 dark:text-slate-400 hover:text-charcoal-900 dark:hover:text-white transition-colors"
                 >
                    {isMobileInspectorOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                 </button>
                 <motion.button
                    whileTap={buttonTap}
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="h-10 px-5 bg-brand-purple text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Save</span>
                 </motion.button>
              </div>
           </div>

           {/* Expanded Content */}
           <div className="flex flex-col flex-1 bg-slate-50 dark:bg-charcoal-950/50 overflow-hidden">
              <div className="px-6 pt-2 pb-4 bg-white dark:bg-charcoal-900 border-b border-slate-100 dark:border-charcoal-800 flex gap-2">
                  <button 
                    onClick={() => setMobileTab('settings')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      mobileTab === 'settings' 
                        ? 'bg-slate-100 dark:bg-charcoal-800 text-brand-purple ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-50 dark:hover:bg-charcoal-800/50'
                    }`}
                  >
                    Export Options
                  </button>
                  <button 
                    onClick={() => setMobileTab('pages')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      mobileTab === 'pages' 
                        ? 'bg-slate-100 dark:bg-charcoal-800 text-brand-purple ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-50 dark:hover:bg-charcoal-800/50'
                    }`}
                  >
                    Select Pages
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-8">
                  {mobileTab === 'settings' ? (
                      <Sidebar mode="pdf-to-image" config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }} exportConfig={exportConfig} onConfigChange={() => {}} onExportConfigChange={setExportConfig} isOpen={true} isMobile={true} variant="embedded" />
                  ) : (
                      <div className="bg-white/50 dark:bg-charcoal-900/50 rounded-2xl p-2 border border-slate-100 dark:border-charcoal-800/50">
                        <Filmstrip 
                          images={images} 
                          activeImageId={activeImageId} 
                          selectedImageIds={selectedPageIds}
                          onSelect={(id, e) => handlePageSelect(id, e)} 
                          onReorder={setImages} 
                          onRemove={() => {}} 
                          onRotate={() => {}} 
                          isMobile={true} 
                          direction="vertical" 
                          isReorderable={false}
                          showRemoveButton={false} 
                          showRotateButton={false}
                        />
                      </div>
                  )}
              </div>
           </div>
        </motion.div>
      </div>
    );
  }

  // --- DESKTOP LAYOUT (Developer Dream UI) ---
  const segmentedButtonClass = (isActive: boolean) => `
    flex-1 px-3 py-1.5 text-[11px] font-bold font-mono rounded-md transition-all duration-200 tracking-wide
    ${isActive
      ? 'bg-white dark:bg-charcoal-600 text-charcoal-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
      : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-white/50 dark:hover:bg-charcoal-700/50 hover:text-charcoal-700'
    }
  `;

  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-100 dark:bg-charcoal-950 font-sans">
      <PageReadyTracker />
      <input 
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
      />
      
      {/* LEFT PANE: Filmstrip / Pages */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <div className="flex items-center gap-2">
                  <List size={16} className="text-charcoal-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({images.length})</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={handleSelectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Select All"><CheckSquare size={14} /></button>
                 <button onClick={handleDeselectAll} className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded transition-colors" title="Deselect All"><Square size={14} /></button>
              </div>
          </div>
          
          {/* Filmstrip List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
              <Filmstrip 
                  images={images}
                  activeImageId={activeImageId}
                  selectedImageIds={selectedPageIds}
                  onSelect={handlePageSelect}
                  onReorder={setImages}
                  onRemove={(id) => {
                      setImages(prev => {
                          const next = prev.filter(i => i.id !== id);
                          if (activeImageId === id) setActiveImageId(next.length ? next[0].id : null);
                          return next;
                      });
                  }}
                  onRotate={() => {}}
                  isMobile={false}
                  direction="vertical"
                  isReorderable={true}
                  showRemoveButton={true}
                  showRotateButton={false}
              />
          </div>
          
          {/* Status Bar */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-charcoal-800 text-[10px] font-mono text-charcoal-400 flex justify-between bg-white dark:bg-charcoal-900">
             <span>{selectedPageIds.size} Selected</span>
             <span className="flex items-center gap-1"><MousePointer2 size={10} /> Shift/Cmd to Multi-select</span>
          </div>
      </div>

      {/* CENTER PANE: Preview Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
          {/* Toolbar */}
          <div className="h-12 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal-700 dark:text-charcoal-200">RES:</span>
                      <span>{pixelInfo.w} x {pixelInfo.h} px</span>
                  </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                  <button 
                      onClick={() => setFitMode('fit')}
                      className={`p-1.5 rounded transition-colors ${fitMode === 'fit' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm' : 'text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200'}`}
                      title="Fit Window"
                  >
                      <Minimize size={14} />
                  </button>
                  <button 
                      onClick={() => setFitMode('width')}
                      className={`p-1.5 rounded transition-colors ${fitMode === 'width' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm' : 'text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200'}`}
                      title="Fit Width"
                  >
                      <Maximize size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button onClick={handleZoomOut} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors">
                      <ZoomOut size={14} />
                  </button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">
                      {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={handleZoomIn} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors">
                      <ZoomIn size={14} />
                  </button>
              </div>
          </div>

          {/* Canvas Area */}
          <div 
              ref={containerRef}
              className="flex-1 overflow-hidden relative grid place-items-center"
          >
              {/* Background Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                   style={{ 
                     backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                   }} 
              />
              
              <Preview 
                 image={activeImage} 
                 config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }} 
                 onReplace={(file) => onDrop([file], [])} 
                 onDropRejected={() => {}}
                 scale={zoom}
                 setScale={handleSetZoom}
                 baseDimensionsRef={baseDimensionsRef}
                 onAddFiles={undefined} // Single file mode in editor
              />
          </div>
      </div>

      {/* RIGHT PANE: Configuration */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
              <Sliders size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Settings</span>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                  Format
                </label>
                <div className="flex bg-slate-200/60 dark:bg-charcoal-800/60 p-1 rounded-lg">
                  {(['png', 'jpeg'] as ImageFormat[]).map((fmt) => (
                    <button 
                      key={fmt} 
                      onClick={() => handleExportChange('format', fmt)} 
                      className={segmentedButtonClass(exportConfig.format === fmt)}
                    >
                      {fmt === 'jpeg' ? 'JPG' : 'PNG'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                  Resolution (DPI)
                </label>
                <div className="flex bg-slate-200/60 dark:bg-charcoal-800/60 p-1 rounded-lg">
                  {[1, 2, 4].map((scale) => (
                    <button 
                      key={scale} 
                      onClick={() => handleExportChange('scale', scale)} 
                      className={segmentedButtonClass(exportConfig.scale === scale)}
                    >
                      {scale === 1 ? '72' : scale === 2 ? '150' : '300'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 group">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
                    Quality
                  </label>
                  <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-charcoal-300">
                    {Math.round(exportConfig.quality * 100)}%
                  </span>
                </div>
                <div className="relative h-6 flex items-center">
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1"
                      value={exportConfig.quality} 
                      onChange={(e) => handleExportChange('quality', parseFloat(e.target.value))} 
                      className="
                        absolute w-full h-1 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-purple 
                        [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none
                      " 
                    />
                </div>
                {exportConfig.format === 'png' && (
                   <p className="text-[10px] text-charcoal-400 italic">Quality setting applies to JPEG only.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-charcoal-800">
                 <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1 mb-2 block">
                    Export Range
                 </label>
                 <div className="space-y-2">
                    {[
                      { id: 'all', label: `All Pages (${images.length})` },
                      { id: 'selected', label: `Selected (${selectedPageIds.size})`, disabled: selectedPageIds.size === 0 },
                      { id: 'current', label: 'Current Page' }
                    ].map((mode) => (
                       <button
                         key={mode.id}
                         onClick={() => setExportMode(mode.id as ExportMode)}
                         disabled={mode.disabled}
                         className={`
                           w-full flex items-center justify-between p-3 rounded-lg border text-xs font-mono font-medium transition-all
                           ${exportMode === mode.id 
                             ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                             : 'border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                           }
                           ${mode.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                         `}
                       >
                          {mode.label}
                          {exportMode === mode.id && <div className="w-2 h-2 rounded-full bg-brand-purple" />}
                       </button>
                    ))}
                 </div>
              </div>

          </div>

          {/* Primary Action Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0">
              <motion.button 
                  onClick={handleDownload} 
                  disabled={isGenerating || images.length === 0} 
                  whileTap={buttonTap} 
                  className="
                      relative overflow-hidden w-full h-12
                      bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                      font-bold font-mono text-sm tracking-wider uppercase
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
                      <span>{isGenerating ? status || 'ZIPPING...' : 'DOWNLOAD IMAGES'}</span>
                  </div>
              </motion.button>
          </div>
      </div>
    </div>
  );
};
