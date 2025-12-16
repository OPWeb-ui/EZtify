
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { Preview } from '../components/Preview';
import { Filmstrip } from '../components/Filmstrip';
import { generatePDF } from '../services/pdfGenerator';
import { UploadedImage, PdfConfig } from '../types';
import { nanoid } from 'nanoid';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { FileStack, Plus, ZoomIn, ZoomOut, Maximize, Settings, Layers, Download, Loader2, RefreshCw, Lock, Cpu, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { IconBox } from '../components/IconBox';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const ImageToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // State
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 0,
    quality: 0.9
  });

  // View State
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'actual'>('fit');
  
  // Mobile State
  const [isMobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pages' | 'settings'>('pages');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleDrop = useCallback(async (files: File[]) => {
    const newImages = files.map(f => ({
        id: nanoid(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        width: 0, height: 0, rotation: 0
    }));
    setImages(prev => [...prev, ...newImages]);
    if (!activeImageId && newImages.length > 0) setActiveImageId(newImages[0].id);
    addToast("Success", `${newImages.length} images added`, "success");
  }, [activeImageId, addToast]);

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
        await generatePDF(images, config, undefined, setStatus);
        addToast("Success", "PDF Generated", "success");
    } catch (e) {
        addToast("Error", "Failed to generate", "error");
    } finally {
        setIsGenerating(false);
        setStatus('');
    }
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setZoom(1);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
        const next = prev.filter(i => i.id !== id);
        if (activeImageId === id) {
            setActiveImageId(next.length > 0 ? next[0].id : null);
        }
        return next;
    });
  };

  const activeImage = images.find(i => i.id === activeImageId) || null;

  // --- Layout Logic ---
  useEffect(() => {
    if (!containerRef.current || fitMode === 'actual' || !activeImageId) return;
    const updateZoom = () => {
        if (!containerRef.current) return;
        const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
        const padding = isMobile ? 32 : 64; 
        const availW = Math.max(0, contW - padding);
        const availH = Math.max(0, contH - padding);
        const baseW = config.orientation === 'portrait' ? 595.28 : 841.89;
        const baseH = config.orientation === 'portrait' ? 841.89 : 595.28;
        const scale = Math.min(availW / baseW, availH / baseH);
        setZoom(scale);
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [fitMode, activeImageId, config.orientation, config.pageSize, isMobile]);


  // --- Render Landing ---
  if (images.length === 0) {
    return (
      <ToolLandingLayout
        title="Image to PDF"
        description="Compile images into a clean PDF document with professional layout controls."
        icon={<FileStack />}
        specs={[
            { label: "Privacy", value: "Local", icon: <Lock /> },
            { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            { label: "Format", value: "JPG/PNG", icon: <Layers /> },
        ]}
        onDrop={handleDrop}
        accept={{ 'image/*': [] }}
        multiple
        accentColor="#FBC02D"
      />
    );
  }

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden relative">
        <PageReadyTracker />
        <DragDropOverlay isDragActive={false} message="Drop Images" variant="amber" />
        <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && handleDrop(Array.from(e.target.files))} />

        {/* Header */}
        <div className="shrink-0 h-14 bg-white dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800 px-4 flex items-center justify-between z-20 shadow-sm relative">
           <div className="flex items-center gap-2">
              <IconBox icon={<FileStack />} size="sm" toolAccentColor="#FBC02D" active />
              <span className="font-mono font-bold text-sm text-charcoal-900 dark:text-white uppercase tracking-tight">Creator</span>
           </div>
           <div className="flex items-center gap-2">
              <motion.button whileTap={buttonTap} onClick={handleReset} className="p-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"><RefreshCw size={18} /></motion.button>
              <motion.button whileTap={buttonTap} onClick={() => fileInputRef.current?.click()} className="p-2 text-brand-purple"><Plus size={20} /></motion.button>
           </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-black/20" ref={containerRef}>
             <div className="absolute inset-0 z-10 pb-20 flex items-center justify-center">
                <Preview 
                    image={activeImage} 
                    config={config} 
                    onReplace={() => {}} 
                    onDropRejected={() => {}}
                    scale={zoom}
                    onAddFiles={handleDrop} 
                />
             </div>
        </div>

        {/* Floating Inspector */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-2xl flex flex-col overflow-hidden"
          initial={false}
          animate={{ height: isMobileInspectorOpen ? 'auto' : '68px' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ maxHeight: '75vh' }}
        >
           {/* Handle / Collapsed View */}
           <div 
              className="flex items-center justify-between px-6 h-[68px] shrink-0 relative bg-white dark:bg-charcoal-900 z-20 cursor-pointer" 
              onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}
           >
              {/* Info Pill */}
              <div className="flex flex-col justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500">Count</span>
                 <span className="text-sm font-bold text-charcoal-900 dark:text-white font-mono">{images.length} Image{images.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Drag Handle Indicator */}
              <div className="absolute left-1/2 top-3 -translate-x-1/2 w-12 h-1 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              
              {/* Actions */}
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                 <button 
                    onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)} 
                    className="p-2.5 bg-slate-50 dark:bg-charcoal-800 rounded-xl text-charcoal-500 dark:text-slate-400 hover:text-charcoal-900 dark:hover:text-white transition-colors"
                 >
                    {isMobileInspectorOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                 </button>
                 
                 <motion.button
                    whileTap={buttonTap}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-10 px-5 bg-brand-purple text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>Convert</span>
                 </motion.button>
              </div>
           </div>

           {/* Expanded Content */}
           <div className="flex flex-col flex-1 bg-slate-50 dark:bg-charcoal-950/50 overflow-hidden">
              {/* Tab Switcher */}
              <div className="px-6 pt-2 pb-4 bg-white dark:bg-charcoal-900 border-b border-slate-100 dark:border-charcoal-800 flex gap-2">
                  <button 
                    onClick={() => setMobileTab('pages')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      mobileTab === 'pages' 
                        ? 'bg-slate-100 dark:bg-charcoal-800 text-brand-purple ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-50 dark:hover:bg-charcoal-800/50'
                    }`}
                  >
                    Manage Pages
                  </button>
                  <button 
                    onClick={() => setMobileTab('settings')} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      mobileTab === 'settings' 
                        ? 'bg-slate-100 dark:bg-charcoal-800 text-brand-purple ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-50 dark:hover:bg-charcoal-800/50'
                    }`}
                  >
                    PDF Settings
                  </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-8">
                  {mobileTab === 'pages' ? (
                      <div className="bg-white/50 dark:bg-charcoal-900/50 rounded-2xl p-2 border border-slate-100 dark:border-charcoal-800/50">
                        <Filmstrip 
                          images={images}
                          activeImageId={activeImageId}
                          onSelect={(id) => setActiveImageId(id)}
                          onReorder={setImages}
                          onRemove={handleRemoveImage}
                          onRotate={() => {}}
                          isMobile={true}
                          direction="vertical"
                          showRemoveButton={true}
                          showRotateButton={false}
                          isReorderable={true}
                       />
                     </div>
                  ) : (
                      <Sidebar 
                        mode="image-to-pdf"
                        config={config}
                        exportConfig={{ format: 'jpeg', quality: 1, scale: 1 }}
                        onConfigChange={setConfig}
                        onExportConfigChange={() => {}}
                        isOpen={true}
                        isMobile={true}
                        variant="embedded"
                      />
                  )}
              </div>
           </div>
        </motion.div>
      </div>
    );
  }

  // --- Render Desktop ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 overflow-hidden font-sans relative">
      <PageReadyTracker />
      
      {/* 1. LEFT PANEL: Filmstrip / Manager */}
      <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
         
         {/* L-Header */}
         <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
             <div className="flex items-center gap-2">
                 <IconBox icon={<Layers />} size="xs" variant="ghost" />
                 <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">
                    Files ({images.length})
                 </span>
             </div>
             <motion.button 
                whileTap={buttonTap}
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-500 transition-colors"
                title="Add Images"
             >
                <Plus size={18} />
             </motion.button>
         </div>

         {/* L-Body */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
             <Filmstrip 
                images={images}
                activeImageId={activeImageId}
                onSelect={(id) => setActiveImageId(id)}
                onReorder={setImages}
                onRemove={handleRemoveImage}
                onRotate={() => {}}
                isMobile={false}
                direction="vertical"
                showRemoveButton={true}
                showRotateButton={false}
                isReorderable={true}
             />
         </div>

         {/* L-Footer */}
         <div className="p-3 border-t border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0">
             <motion.button
                whileTap={buttonTap}
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors border border-transparent"
             >
                <RefreshCw size={14} /> Reset Project
             </motion.button>
         </div>
      </div>

      {/* 2. CENTER PANEL: Preview */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
         
         {/* C-Toolbar */}
         <div className="h-14 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
             {/* Left: Context */}
             <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                 {activeImage ? (
                    <>
                        <span className="font-bold text-charcoal-700 dark:text-charcoal-200 truncate max-w-[200px]">
                            {activeImage.file.name}
                        </span>
                        <div className="w-px h-3 bg-slate-300 dark:bg-charcoal-700" />
                        <span>{(activeImage.file.size / 1024).toFixed(0)} KB</span>
                    </>
                 ) : (
                    <span>Select an image</span>
                 )}
             </div>

             {/* Right: Zoom Controls */}
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <button 
                    onClick={() => { setFitMode('actual'); setZoom(z => Math.max(0.1, z - 0.1)); }}
                    className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-lg text-charcoal-500 transition-colors"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="min-w-[3rem] text-center text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => { setFitMode('actual'); setZoom(z => Math.min(3, z + 0.1)); }}
                    className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded-lg text-charcoal-500 transition-colors"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-charcoal-600 mx-1" />
                  <button 
                    onClick={() => setFitMode('fit')}
                    className={`p-1.5 rounded-lg transition-colors ${fitMode === 'fit' ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm' : 'text-charcoal-500 hover:text-charcoal-800'}`} 
                    title="Fit to View"
                  >
                    <Maximize size={14} />
                  </button>
             </div>
         </div>

         {/* C-Canvas (Fixed Alignment) */}
         <div className="flex-1 relative min-h-0 w-full bg-slate-100/50 dark:bg-black/20" ref={containerRef}>
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0" 
                  style={{ 
                    backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                  }} 
             />
             
             {/* Preview Instance taking full space */}
             <div className="absolute inset-0 z-10">
                <Preview 
                    image={activeImage} 
                    config={config} 
                    onReplace={() => {}} 
                    onDropRejected={() => {}}
                    scale={zoom}
                    onAddFiles={handleDrop} 
                />
             </div>
         </div>
      </div>

      {/* 3. RIGHT PANEL: Inspector */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          
          {/* R-Header */}
          <div className="h-14 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50 gap-3">
              <IconBox icon={<Settings />} size="xs" variant="ghost" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">
                  Configuration
              </span>
          </div>

          {/* R-Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Sidebar 
                mode="image-to-pdf"
                config={config}
                exportConfig={{ format: 'jpeg', quality: 1, scale: 1 }}
                onConfigChange={setConfig}
                onExportConfigChange={() => {}}
                isOpen={true}
                isMobile={false}
                variant="embedded"
              />
          </div>

          {/* R-Footer (Primary Action) */}
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
                          animate={{ width: '100%' }} 
                          transition={{ duration: 1.5, repeat: Infinity }} 
                      />
                  )}
                  <div className="relative flex items-center justify-center gap-2 z-10">
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isGenerating ? status || 'PROCESSING...' : 'EXPORT PDF'}</span>
                  </div>
              </motion.button>
          </div>
      </div>

      {/* Hidden Inputs */}
      <input 
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        onChange={(e) => {
            if (e.target.files) handleDrop(Array.from(e.target.files));
            e.target.value = '';
        }}
      />
    </div>
  );
};
