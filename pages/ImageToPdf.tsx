
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { Preview } from '../components/Preview';
import { Filmstrip } from '../components/Filmstrip';
import { StickyBar } from '../components/StickyBar';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { generatePDF } from '../services/pdfGenerator';
import { UploadedImage, PdfConfig } from '../types';
import { nanoid } from 'nanoid';
import { FileRejection } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { FileStack, Image as ImageIcon, Cpu, Settings, Lock, Sliders, X, LayoutGrid, Maximize, Minimize, Search, ZoomIn, ZoomOut, Monitor, Plus, FilePlus, Loader2, ArrowRight, ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { techEase, modalContentVariants, buttonTap } from '../utils/animations';

type FitMode = 'fit' | 'width' | 'actual';

export const ImageToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  
  // Mobile settings state
  const [showSettings, setShowSettings] = useState(false);
  const [isFilmstripVisible, setIsFilmstripVisible] = useState(false);
  
  // Processing State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Config
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 0,
    quality: 0.9
  });

  // --- PREVIEW ZOOM STATE ---
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate zoom when container resizes or fit mode changes
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual') return;

    const updateZoom = () => {
      if (!containerRef.current || !baseDimensionsRef.current) return;
      const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
      const { width: baseW, height: baseH } = baseDimensionsRef.current;
      
      // Padding for "Air" around the paper
      const padding = 64; 
      const availW = Math.max(0, contW - padding);
      const availH = Math.max(0, contH - padding);

      if (fitMode === 'width') {
        setZoom(availW / baseW);
      } else {
        // Fit Window (Contain)
        const scaleW = availW / baseW;
        const scaleH = availH / baseH;
        setZoom(Math.min(scaleW, scaleH));
      }
    };

    const observer = new ResizeObserver(updateZoom);
    observer.observe(containerRef.current);
    // Initial call
    updateZoom();

    return () => observer.disconnect();
  }, [fitMode, config.pageSize, config.orientation, activeImageId]);

  // Manual Zoom Handlers
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

  const processFiles = useCallback(async (files: File[]) => {
      const validImages: UploadedImage[] = [];
      for (const file of files) {
          if (file.type.startsWith('image/')) {
              const previewUrl = URL.createObjectURL(file);
              const dimensions = await new Promise<{w: number, h: number}>((resolve) => {
                  const img = new Image();
                  img.onload = () => resolve({ w: img.width, h: img.height });
                  img.onerror = () => resolve({ w: 0, h: 0 });
                  img.src = previewUrl;
              });

              validImages.push({
                  id: nanoid(),
                  file,
                  previewUrl,
                  width: dimensions.w, 
                  height: dimensions.h, 
                  rotation: 0
              });
          }
      }
      return validImages;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
        addToast("Invalid File", "Only image files are allowed.", "error");
    }
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    
    try {
        const validImages = await processFiles(acceptedFiles);
        if (validImages.length > 0) {
          setImages(prev => {
            const updated = [...prev, ...validImages];
            if (!activeImageId && validImages.length > 0) setActiveImageId(validImages[0].id);
            return updated;
          });
          setTimeout(() => addToast("Success", `Added ${validImages.length} images.`, "success"), 100);
        }
    } catch (e) {
        addToast("Error", "Failed to process images.", "error");
    } finally {
        setIsProcessingFiles(false);
    }
  }, [addToast, processFiles, activeImageId]);

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  const handleGenerate = async () => {
      if (images.length === 0) return;
      setIsGenerating(true);
      try {
          await generatePDF(images, config, setProgress, setStatus);
          addToast("Success", "PDF Generated successfully!", "success");
      } catch (error) {
          addToast("Error", "Failed to generate PDF.", "error");
      } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
      }
  };
  
  const activeImage = images.find(i => i.id === activeImageId) || null;

  if (images.length === 0) {
    return (
      <ToolLandingLayout
        title="Image to PDF"
        description="Compile photos, screenshots, and graphics into a high-fidelity PDF document."
        icon={<FileStack />}
        onDrop={(files) => onDrop(files, [])}
        accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] }}
        multiple={true}
        isProcessing={isProcessingFiles}
        accentColor="text-yellow-500"
        specs={[
          { label: "Input", value: "JPG/PNG/WEBP", icon: <ImageIcon /> },
          { label: "Engine", value: "jsPDF", icon: <Cpu /> },
          { label: "Privacy", value: "Local", icon: <Lock /> },
          { label: "Config", value: "A4/Letter", icon: <Settings /> },
        ]}
        tip="Drag and drop images into the filmstrip to reorder them before conversion."
      />
    );
  }

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="relative w-full h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden">
        <PageReadyTracker />
        <div className="absolute inset-0 z-0 flex flex-col justify-center items-center px-4 pt-20 pb-28">
           <Preview 
              image={activeImage} 
              config={config} 
              onReplace={() => {}} 
              onDropRejected={() => {}}
              scale={1}
              onAddFiles={(files) => onDrop(files, [])}
           />
        </div>
        <StickyBar 
            mode="image-to-pdf"
            imageCount={images.length}
            totalSize={0}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
            onSecondaryAction={() => setShowSettings(!showSettings)}
            secondaryLabel={showSettings ? "Hide" : "Settings"}
            secondaryIcon={showSettings ? <Settings className="text-brand-purple" /> : <Sliders />}
            showFilmstripToggle={true}
            isFilmstripVisible={isFilmstripVisible}
            onToggleFilmstrip={() => setIsFilmstripVisible(!isFilmstripVisible)}
        />
        {/* Mobile Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
              <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="relative w-full max-w-sm bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-charcoal-800 flex flex-col max-h-[75vh] overflow-hidden">
                <Sidebar mode="image-to-pdf" config={config} exportConfig={{ format: 'jpeg', quality: 0.9, scale: 1 }} onConfigChange={setConfig} onExportConfigChange={() => {}} isOpen={true} isMobile={true} mobileMode="bottom-sheet" variant="embedded" onClose={() => setShowSettings(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Mobile Filmstrip Modal */}
        <AnimatePresence>
          {isFilmstripVisible && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilmstripVisible(false)} />
               <motion.div variants={modalContentVariants} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-sm bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden border border-slate-200 dark:border-charcoal-800">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-850"><div className="flex items-center gap-2"><LayoutGrid size={16} className="text-brand-purple" /><span className="text-xs font-bold font-mono uppercase tracking-widest text-charcoal-700 dark:text-slate-200">Sequence ({images.length})</span></div><button onClick={() => setIsFilmstripVisible(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors"><X size={18} className="text-charcoal-500 dark:text-slate-400" /></button></div>
                  <div className="flex-1 overflow-y-auto p-2 bg-slate-100 dark:bg-black/20 custom-scrollbar"><Filmstrip images={images} activeImageId={activeImageId} onSelect={(id) => setActiveImageId(id)} onReorder={setImages} onRemove={(id) => { setImages(prev => { const next = prev.filter(i => i.id !== id); if (activeImageId === id) setActiveImageId(next.length ? next[0].id : null); return next; }); }} onRotate={(id) => { setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img)); }} isMobile={true} direction="vertical" /></div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- DESKTOP LAYOUT (Developer Dream UI) ---
  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-100 dark:bg-charcoal-950 font-sans">
        <PageReadyTracker />
        
        <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
        />

        {/* LEFT PANE: Filmstrip / Sequence */}
        <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
                <div className="flex items-center gap-2">
                    <List size={16} className="text-charcoal-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({images.length})</span>
                </div>
            </div>
            
            {/* Filmstrip List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
                <Filmstrip 
                    images={images}
                    activeImageId={activeImageId}
                    onSelect={(id) => setActiveImageId(id)}
                    onReorder={setImages}
                    onRemove={(id) => {
                        setImages(prev => {
                            const next = prev.filter(i => i.id !== id);
                            if (activeImageId === id) setActiveImageId(next.length ? next[0].id : null);
                            return next;
                        });
                    }}
                    onRotate={(id) => {
                        setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img));
                    }}
                    isMobile={false}
                    direction="vertical"
                    size="md"
                    isReorderable={true}
                />
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0">
                <motion.button
                    whileTap={buttonTap}
                    onClick={handleAddMore}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-charcoal-700 text-charcoal-500 dark:text-charcoal-400 font-mono text-xs font-bold hover:border-brand-purple hover:text-brand-purple hover:bg-brand-purple/5 transition-all"
                >
                    <Plus size={16} /> ADD IMAGES
                </motion.button>
            </div>
        </div>

        {/* CENTER PANE: Preview Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
            {/* Toolbar */}
            <div className="h-12 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-700 dark:text-charcoal-200">MODE:</span>
                        <span>{config.pageSize.toUpperCase()}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-700" />
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-700 dark:text-charcoal-200">FIT:</span>
                        <span>{config.fitMode.toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                    <button 
                        onClick={() => setFitMode('fit')}
                        className={`p-1.5 rounded transition-colors ${fitMode === 'fit' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm' : 'text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200'}`}
                        title="Fit Window (F)"
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
                    <button onClick={handleZoomOut} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Zoom Out (-)">
                        <ZoomOut size={14} />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors" title="Zoom In (+)">
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
                   config={config} 
                   onReplace={() => {}} 
                   onDropRejected={() => {}}
                   scale={zoom}
                   setScale={handleSetZoom}
                   baseDimensionsRef={baseDimensionsRef}
                   onAddFiles={(files) => onDrop(files, [])}
                />
            </div>
        </div>

        {/* RIGHT PANE: Configuration */}
        <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
                <Sliders size={16} className="text-charcoal-400 mr-2" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Settings</span>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* We use Sidebar component in 'embedded' mode which renders form fields */}
                <Sidebar 
                    mode="image-to-pdf"
                    config={config}
                    exportConfig={{ format: 'jpeg', quality: 0.9, scale: 1 }}
                    onConfigChange={setConfig}
                    onExportConfigChange={() => {}}
                    isOpen={true}
                    isMobile={false}
                    variant="embedded"
                />
            </div>

            {/* Primary Action Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0">
                <motion.button 
                    onClick={handleGenerate} 
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
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                        <span>{isGenerating ? status || 'PROCESSING...' : 'EXPORT PDF'}</span>
                    </div>
                </motion.button>
            </div>
        </div>
    </div>
  );
};
