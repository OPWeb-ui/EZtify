import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { Sidebar } from '../components/Sidebar';
import { Filmstrip } from '../components/Filmstrip';
import { Preview } from '../components/Preview';
import { StickyBar } from '../components/StickyBar';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { nanoid } from 'nanoid';
import { Plus, X } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../utils/animations';

export const ImageToPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scale, setScale] = useState(1);
  const [isFilmstripDrawerOpen, setIsFilmstripDrawerOpen] = useState(false);

  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });
  
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.9,
    scale: 2
  });

  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_RESOLUTION_PX = 10000;
  const MAX_IMAGE_COUNT = 50;

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

  const processFiles = useCallback(async (files: File[], maxSlots: number) => {
    const validSizeFiles: File[] = [];
    let sizeErrorCount = 0;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) sizeErrorCount++;
      else validSizeFiles.push(file);
    });

    if (sizeErrorCount > 0) {
      addToast("File Too Large", `Max ${MAX_FILE_SIZE_MB}MB per file.`, "error");
    }

    if (validSizeFiles.length === 0) return [];

    let filesToProcess = validSizeFiles;
    if (validSizeFiles.length > maxSlots) {
      filesToProcess = validSizeFiles.slice(0, maxSlots);
      addToast("Limit Reached", `Uploading first ${maxSlots} images to fit limit.`, "warning");
    }

    const results = await Promise.all(filesToProcess.map(async (file) => {
      return new Promise<UploadedImage | null>((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          if (img.width > MAX_RESOLUTION_PX || img.height > MAX_RESOLUTION_PX) {
            URL.revokeObjectURL(url);
            resolve(null);
          } else {
            resolve({
              id: nanoid(),
              file,
              previewUrl: url,
              width: img.width,
              height: img.height,
              rotation: 0
            });
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
      });
    }));

    return results.filter((img): img is UploadedImage => img !== null);
  }, [addToast]);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload supported image formats only.", "error");
      return;
    }
    
    if (images.length >= MAX_IMAGE_COUNT) {
      addToast("Limit Reached", `Maximum of ${MAX_IMAGE_COUNT} images reached.`, "warning");
      return;
    }

    const remainingSlots = MAX_IMAGE_COUNT - images.length;
    const validImages = await processFiles(acceptedFiles, remainingSlots);
    
    if (validImages.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...validImages];
        const newId = validImages[0].id;
        setActiveImageId(newId);
        setSelectedImageIds(new Set([newId]));
        return updated;
      });
    }
  }, [images.length, addToast, processFiles]);

  const { getRootProps: getAddRoot, getInputProps: getAddInput, open: openAdd } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleSelection = (id: string, e: React.MouseEvent) => {
    setActiveImageId(id);
    if (e.ctrlKey || e.metaKey) {
      setSelectedImageIds(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; });
      return;
    }
    if (e.shiftKey && activeImageId) {
      const start = images.findIndex(img => img.id === activeImageId);
      const end = images.findIndex(img => img.id === id);
      if (start !== -1 && end !== -1) {
        const range = images.slice(Math.min(start, end), Math.max(start, end) + 1).map(img => img.id);
        setSelectedImageIds(new Set(range));
      }
    } else {
      setSelectedImageIds(new Set([id]));
    }
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
    setSelectedImageIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
  };

  const handleRotate = (id: string) => {
    const idsToRotate = selectedImageIds.has(id) ? selectedImageIds : new Set([id]);
    if (!selectedImageIds.has(id)) {
      setSelectedImageIds(new Set([id]));
      setActiveImageId(id);
    }
    setImages(prev => prev.map(img => idsToRotate.has(img.id) ? { ...img, rotation: (img.rotation + 90) % 360 } : img));
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting...');
    setTimeout(async () => {
      try {
        await generatePDF(images, config, setProgress, setStatus);
      } catch (e) {
        addToast("Error", "Generation failed.", "error");
      } finally {
        setIsGenerating(false);
        setProgress(0);
        setStatus('');
      }
    }, 50);
  };
  
  const handleReplace = (file: File) => {
    if (!activeImageId) return;
    if (!file.type.startsWith('image/')) {
       addToast("Invalid File", "Please upload an image file.", "error");
       return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
        setImages(prev => prev.map(p => {
          if (p.id === activeImageId) {
              URL.revokeObjectURL(p.previewUrl);
              return { ...p, file, previewUrl: objectUrl, width: img.width, height: img.height, rotation: 0 };
          }
          return p;
        }));
    };
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setSelectedImageIds(new Set());
    setScale(1);
    setIsFilmstripDrawerOpen(false);
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {images.length === 0 ? (
          <motion.div 
            key="hero"
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-purple/5" />
               <motion.div 
                 variants={staggerContainer} initial="hidden" animate="show"
                 className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
               >
                 <motion.h2 variants={fadeInUp} className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                   Turn Your Images Into <br/> a PDF in One Click
                 </motion.h2>
                 <motion.div variants={fadeInUp}>
                   <HeroPill>
                      <span className="font-bold text-brand-purple">Image to PDF</span> converts your photos into a single, high-quality document instantly. 100% private processing in your browser—no uploads, no waiting.
                   </HeroPill>
                 </motion.div>
                 <motion.div variants={fadeInUp} className="w-full max-w-xl mb-8 relative z-20">
                   <UploadArea onDrop={onDrop} mode="image-to-pdf" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}>
                   <RotatingText />
                 </motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="image-to-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="workspace"
            className="flex-1 flex flex-col md:flex-row relative h-full overflow-hidden"
          >
            <div {...getAddRoot({ className: 'hidden' })}><input {...getAddInput()} /></div>
            <Sidebar 
              mode="image-to-pdf" 
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
              <div className={`flex-1 relative min-h-0 w-full flex flex-col ${isMobile ? 'pb-24' : ''}`}>
                <Preview image={activeImage} config={config} onReplace={handleReplace} onAddFiles={onDrop} onDropRejected={(msg) => addToast("Error", msg, "error")} onClose={handleReset} scale={scale}/>
              </div>

              {!isMobile ? (
                <div className="flex-none z-10 border-l border-pastel-border dark:border-charcoal-800 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur w-36">
                  <Filmstrip direction="vertical" images={images} activeImageId={activeImageId} selectedImageIds={selectedImageIds} onReorder={setImages} onSelect={handleSelection} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} />
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
                      <Filmstrip direction="horizontal" images={images} activeImageId={activeImageId} selectedImageIds={selectedImageIds} onReorder={setImages} onSelect={handleSelection} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            
            {isMobile && images.length > 0 && (
              <StickyBar 
                imageCount={images.length} 
                totalSize={totalSize} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                progress={progress}
                status={status}
                mode="image-to-pdf"
                onSecondaryAction={openAdd}
                secondaryLabel="Add Images"
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