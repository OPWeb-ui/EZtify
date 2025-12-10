import React, { useState, useCallback, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { Sidebar } from '../components/Sidebar';
import { StickyBar } from '../components/StickyBar';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, Settings } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { staggerContainer, fadeInUp } from '../utils/animations';

export const PdfToImagePage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  // Responsive State
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = windowWidth < 768;
  const showRightSidebar = windowWidth >= 1024; // Only show vertical filmstrip on large screens
  const showBottomFilmstrip = !isMobile && !showRightSidebar; // Tablet mode: horizontal filmstrip

  const [scale, setScale] = useState(0.85); 
  const [isFilmstripDrawerOpen, setIsFilmstripDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'auto',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 1.0,
    scale: 1
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setScale(0.85);
  }, [activeImageId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setScale(0.85);

  const processPdf = async (file: File) => {
    setIsGenerating(true);
    setProgress(0);
    setStatus('Preparing PDF...');
    try {
      const extracted = await extractImagesFromPdf(file, setProgress, setStatus);
      if (extracted.length === 0) {
        addToast("Error", "No images found or PDF is empty.", "error");
      } else {
        setImages(prev => {
           const updated = [...prev, ...extracted];
           if (extracted.length > 0) setActiveImageId(extracted[0].id);
           return updated;
        });
        addToast("Success", `Extracted ${extracted.length} pages.`, "success");
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to process PDF.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[] = []) => {
    if (fileRejections && fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    setHasStarted(true);
    for (const file of acceptedFiles) {
        await processPdf(file);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, open: openAdd, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleRotate = (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img));
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      if (filtered.length === 0) setHasStarted(false);
      return filtered;
    });
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setStatus('Exporting...');
    setTimeout(async () => {
      try {
        for (let i = 0; i < images.length; i++) {
          setStatus(`Exporting page ${i + 1}/${images.length}...`);
          setProgress(Math.round(((i + 1) / images.length) * 100));
          
          const imgData = images[i];
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
              const img = new Image();
              img.src = imgData.previewUrl;
              await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
              
              const isRotatedSideways = imgData.rotation === 90 || imgData.rotation === 270;
              canvas.width = isRotatedSideways ? img.height : img.width;
              canvas.height = isRotatedSideways ? img.width : img.height;
              
              if (exportConfig.format === 'jpeg') {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((imgData.rotation * Math.PI) / 180);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
              
              const mimeType = exportConfig.format === 'png' ? 'image/png' : 'image/jpeg';
              const extension = exportConfig.format === 'png' ? 'png' : 'jpg';
              
              const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, exportConfig.quality));
              
              if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `Page-${i + 1}-EZtify.${extension}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
              }
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (e) {
        addToast("Error", "Export failed.", "error");
      } finally {
        setIsGenerating(false);
        setProgress(0);
        setStatus('');
      }
    }, 50);
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setScale(1);
    setHasStarted(false);
    setIsFilmstripDrawerOpen(false);
    setIsSidebarOpen(false);
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-mint/10" />
               <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                 <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                   <HeroPill>Extract pages from your PDF and save them as separate high-res images.</HeroPill>
                   <UploadArea onDrop={onDrop} mode="pdf-to-image" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}><RotatingText /></motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="pdf-to-image" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-charcoal-950">
            
            {/* 1. LEFT SIDEBAR (Settings) */}
            <div className={`flex-none md:w-80 bg-white dark:bg-charcoal-900 z-30 h-full flex flex-col shadow-xl md:shadow-none border-r border-slate-200 dark:border-white/5 ${isMobile && !isSidebarOpen ? 'hidden' : 'w-full'}`}>
                <Sidebar 
                  mode="pdf-to-image" 
                  config={config} 
                  onConfigChange={setConfig} 
                  exportConfig={exportConfig} 
                  onExportConfigChange={setExportConfig} 
                  isOpen={true} 
                  isMobile={isMobile}
                  imageCount={images.length}
                  zoomLevel={scale}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onAddFiles={openAdd}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  progress={progress}
                  status={status}
                />
                
                {/* Mobile Sidebar Close Button */}
                {isMobile && isSidebarOpen && (
                   <button 
                     onClick={() => setIsSidebarOpen(false)}
                     className="fixed top-20 right-4 z-[60] w-10 h-10 flex items-center justify-center bg-white dark:bg-charcoal-800 rounded-full shadow-xl border border-slate-200 dark:border-charcoal-600 text-charcoal-500 dark:text-slate-400 hover:text-brand-purple"
                   >
                     <X size={20} />
                   </button>
                )}
            </div>

            {/* 2. CENTER CANVAS (The Desk) */}
            {(!isMobile || !isSidebarOpen) && (
              <div 
                className="flex-1 relative h-full bg-slate-100 dark:bg-black/20 overflow-hidden flex flex-col"
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                
                {/* Mobile Settings Toggle */}
                {isMobile && (
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-40 p-2.5 bg-white dark:bg-charcoal-800 rounded-xl shadow-md border border-slate-200 dark:border-charcoal-700 text-charcoal-600 dark:text-slate-300"
                  >
                    <Settings size={20} />
                  </button>
                )}

                {/* Dot Grid Pattern */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]" 
                  style={{
                    backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} 
                />

                {/* Drag Overlay */}
                <AnimatePresence>
                  {isDragActive && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-brand-mint/10 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-brand-mint rounded-3xl pointer-events-none m-8"
                    >
                        <div className="text-center text-brand-mint">
                            <Plus size={64} className="mx-auto mb-4 animate-pulse" />
                            <p className="text-2xl font-bold">Drop more PDFs to add</p>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading State */}
                {isGenerating && images.length === 0 && (
                  <div className="absolute inset-0 z-40 bg-white/50 dark:bg-charcoal-900/50 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-brand-purple mb-4" />
                      {status && (
                        <div className="bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-lg">
                          <p className="text-sm font-bold text-charcoal-600 dark:text-slate-200 animate-pulse">
                            {status} {progress > 0 && `(${Math.round(progress)}%)`}
                          </p>
                        </div>
                      )}
                  </div>
                )}

                {/* Main Preview Container - Centered */}
                <div className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-10 relative z-10 overflow-auto">
                  <motion.div 
                      animate={{ scale }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="relative origin-center"
                  >
                      <Preview 
                          image={activeImage} 
                          config={config} 
                          onReplace={() => {}} 
                          onAddFiles={onDrop} 
                          onDropRejected={() => {}} 
                          onClose={handleReset} 
                          scale={1} // Internal scale handled by parent
                      />
                  </motion.div>
                </div>

                {/* Floating Action (Add PDF) - Desktop & Tablet Only */}
                {!isMobile && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                    <motion.button 
                      onClick={openAdd}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-charcoal-800 text-white dark:bg-white dark:text-charcoal-900 px-5 py-3 rounded-full shadow-2xl hover:shadow-xl transition-all font-bold text-sm border border-white/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add PDF</span>
                    </motion.button>
                  </div>
                )}

                {/* Tablet Horizontal Filmstrip (Bottom) */}
                {showBottomFilmstrip && (
                  <div className="flex-none h-40 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-t border-slate-200 dark:border-charcoal-800 z-30">
                      <Filmstrip 
                        direction="horizontal"
                        images={images}
                        activeImageId={activeImageId}
                        onReorder={setImages}
                        onSelect={setActiveImageId}
                        onRemove={handleRemove}
                        onRotate={handleRotate}
                        isMobile={false}
                        className="h-full"
                      />
                  </div>
                )}

                {/* Mobile Filmstrip Drawer */}
                {isMobile && (
                  <AnimatePresence>
                    {isFilmstripDrawerOpen && (
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 z-[60] h-64 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-700 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col"
                      >
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-charcoal-800">
                          <span className="text-xs font-bold uppercase text-charcoal-500">Pages ({images.length})</span>
                          <button onClick={() => setIsFilmstripDrawerOpen(false)} className="p-2 text-charcoal-500 hover:bg-slate-100 rounded-full">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-2">
                          <Filmstrip direction="vertical" images={images} activeImageId={activeImageId} onReorder={setImages} onSelect={setActiveImageId} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} className="h-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )}
            
            {/* 3. RIGHT SIDEBAR (Filmstrip - Large Desktop Only) */}
            {showRightSidebar && (
              <div className="flex-none w-72 h-full bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-white/5 z-20 flex flex-col">
                <div className="h-14 flex items-center px-5 border-b border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pages ({images.length})</h3>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-50/50 dark:bg-charcoal-900/50">
                  <Filmstrip 
                    direction="vertical" 
                    images={images} 
                    activeImageId={activeImageId} 
                    onReorder={setImages} 
                    onSelect={setActiveImageId} 
                    onRemove={handleRemove} 
                    onRotate={handleRotate} 
                    isMobile={isMobile} 
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {/* Mobile Bottom Bar */}
            {isMobile && hasStarted && !isSidebarOpen && (
              <StickyBar 
                imageCount={images.length} 
                totalSize={totalSize} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                progress={progress}
                status={status}
                mode="pdf-to-image"
                onSecondaryAction={openAdd}
                secondaryLabel="Add"
                secondaryIcon={<Plus className="w-4 h-4" />}
                zoomLevel={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                showFilmstripToggle={true}
                onToggleFilmstrip={() => setIsFilmstripDrawerOpen(p => !p)}
                isFilmstripVisible={isFilmstripDrawerOpen}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};