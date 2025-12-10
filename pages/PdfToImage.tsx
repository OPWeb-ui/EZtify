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
import { Skeleton } from '../components/Skeleton';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { staggerContainer, fadeInUp } from '../utils/animations';

const WorkspaceSkeleton: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <div className="flex-1 flex flex-col md:flex-row relative h-full overflow-hidden">
    <div className="flex-1 p-10 flex items-center justify-center">
      <Skeleton className="w-full h-full max-w-lg aspect-auto" />
    </div>
    {!isMobile ? (
      <div className="w-72 border-l border-pastel-border dark:border-charcoal-800 p-4">
        <div className="flex flex-col gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-32 rounded-lg" />)}
        </div>
      </div>
    ) : (
      <div className="flex-none z-10 p-6 border-t border-pastel-border bg-white/80 dark:bg-charcoal-900/80 backdrop-blur">
        <div className="flex gap-4 items-center">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="w-20 h-24 rounded-xl" />)}
        </div>
      </div>
    )}
  </div>
);

export const PdfToImagePage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scale, setScale] = useState(1);
  const [isFilmstripDrawerOpen, setIsFilmstripDrawerOpen] = useState(false);

  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'auto',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.9,
    scale: 1
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setScale(1);
  }, [activeImageId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

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
        addToast("Success", `Added ${extracted.length} pages.`, "warning");
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

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    setHasStarted(true);
    for (const file of acceptedFiles) {
        await processPdf(file);
    }
  }, [addToast]);

  const { getRootProps: getAddRoot, getInputProps: getAddInput, open: openAdd } = useDropzone({
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
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-mint/10" />
               <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                 <motion.h2 variants={fadeInUp} className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                   Turn Your PDF Pages <br/> Into Images in Seconds
                 </motion.h2>
                 <motion.div variants={fadeInUp}>
                   <HeroPill>
                      <span className="font-bold text-brand-mint">PDF to Image</span> extracts pages from your document and saves them as high-resolution JPG or PNG files. Secure, local extraction with no server uploads.
                   </HeroPill>
                 </motion.div>
                 <motion.div variants={fadeInUp} className="w-full max-w-xl mb-8 relative z-20">
                   <UploadArea onDrop={onDrop} mode="pdf-to-image" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}><RotatingText /></motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="pdf-to-image" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" className="flex-1 flex flex-col md:flex-row relative h-full overflow-hidden">
            <div {...getAddRoot({ className: 'hidden' })}><input {...getAddInput()} /></div>
            <Sidebar 
              mode="pdf-to-image" 
              config={config} 
              onConfigChange={setConfig} 
              exportConfig={exportConfig} 
              onExportConfigChange={setExportConfig} 
              isOpen={isSidebarOpen} 
              isMobile={isMobile}
              imageCount={images.length}
              totalSize={totalSize}
              zoomLevel={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onAddFiles={openAdd}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              progress={progress}
              status={status}
            />

            <div className="flex-1 flex flex-col md:flex-row relative h-full bg-slate-50/30 dark:bg-charcoal-900/30 overflow-hidden">
              <AnimatePresence mode="wait">
                {isGenerating && images.length === 0 ? (
                  <motion.div key="skeleton" className="flex-1 flex flex-col min-h-0">
                    <WorkspaceSkeleton isMobile={isMobile} />
                  </motion.div>
                ) : (
                  <motion.div key="content" className="flex-1 flex flex-col md:flex-row min-h-0">
                    <div className={`flex-1 relative min-h-0 w-full flex flex-col ${isMobile ? 'pb-24' : ''}`}>
                       <Preview image={activeImage} config={config} onReplace={() => {}} onAddFiles={onDrop} onDropRejected={() => {}} onClose={handleReset} scale={scale} />
                    </div>
                    {!isMobile ? (
                      <div className="flex-none z-10 border-l border-pastel-border dark:border-charcoal-800 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur w-36">
                        <Filmstrip direction="vertical" images={images} activeImageId={activeImageId} onReorder={setImages} onSelect={setActiveImageId} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} />
                      </div>
                    ) : (
                      <AnimatePresence>
                        {isFilmstripDrawerOpen && (
                          <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            className="fixed bottom-0 left-0 right-0 z-50 h-48 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 shadow-2xl"
                          >
                            <button onClick={() => setIsFilmstripDrawerOpen(false)} className="absolute top-2 right-2 z-50 p-2 text-charcoal-500 rounded-full hover:bg-slate-100 dark:hover:bg-charcoal-800" aria-label="Close filmstrip">
                              <X size={18} />
                            </button>
                            <Filmstrip direction="horizontal" images={images} activeImageId={activeImageId} onReorder={setImages} onSelect={setActiveImageId} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {isMobile && hasStarted && (
              <StickyBar 
                imageCount={images.length} 
                totalSize={totalSize} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                progress={progress}
                status={status}
                mode="pdf-to-image"
                onSecondaryAction={openAdd}
                secondaryLabel="Add PDF"
                secondaryIcon={<Plus className="w-4 h-4" />}
                zoomLevel={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                showFilmstripToggle={isMobile && images.length > 0}
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