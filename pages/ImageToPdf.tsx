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
import { Plus, X, Settings } from 'lucide-react';
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
  
  // Responsive State
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = windowWidth < 768;
  const showRightSidebar = windowWidth >= 1024; // Only show vertical filmstrip on large screens
  const showBottomFilmstrip = !isMobile && !showRightSidebar; // Tablet mode: horizontal filmstrip

  const [scale, setScale] = useState(0.85); 
  const [isFilmstripDrawerOpen, setIsFilmstripDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 1.0
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
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Reset zoom when image changes to ensure it fits nicely
    setScale(0.85);
  }, [activeImageId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setScale(0.85);

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

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[] = []) => {
    // Handle File Rejections (Invalid Type or Size)
    if (fileRejections && fileRejections.length > 0) {
      const invalidType = fileRejections.find(r => r.errors.some(e => e.code === 'file-invalid-type'));
      const tooLarge = fileRejections.find(r => r.errors.some(e => e.code === 'file-too-large'));

      if (invalidType) {
        addToast("Unsupported Format", "Please upload JPG, PNG, WEBP, GIF, or BMP images.", "error");
      } else if (tooLarge) {
        addToast("File Too Large", `Max ${MAX_FILE_SIZE_MB}MB per file.`, "error");
      } else {
        addToast("Invalid File", "One or more files could not be uploaded.", "error");
      }
      
      // If no valid files were accepted alongside rejections, stop here.
      if (acceptedFiles.length === 0) return;
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
      addToast("Success", `Added ${validImages.length} images.`, "success");
    }
  }, [images.length, addToast, processFiles]);

  const { getRootProps, getInputProps, open: openAdd } = useDropzone({
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
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
       addToast("Unsupported Format", "Only JPG, PNG, WEBP, GIF, and BMP images are supported.", "error");
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
        addToast("Success", "Image replaced successfully", "success");
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
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-purple/5" />
               <motion.div 
                 variants={staggerContainer} initial="hidden" animate="show"
                 className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
               >
                 <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                   <HeroPill>Convert JPG, PNG, and WebP images into a single, high-quality PDF document instantly.</HeroPill>
                   <UploadArea onDrop={onDrop} mode="image-to-pdf" disabled={isGenerating} />
                 </motion.div>
                 <motion.div variants={fadeInUp}>
                   <RotatingText />
                 </motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="image-to-pdf" />
              <AdSlot zone="footer" />
              <FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="workspace"
            className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-charcoal-950"
          >
            {/* 1. LEFT SIDEBAR (Settings) - Visible on Desktop/Tablet, Drawer on Mobile */}
            <div className={`flex-none md:w-80 bg-white dark:bg-charcoal-900 z-30 h-full flex flex-col shadow-xl md:shadow-none border-r border-slate-200/60 dark:border-white/5 ${isMobile && !isSidebarOpen ? 'hidden' : 'w-full'}`}>
              <Sidebar 
                mode="image-to-pdf" 
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

                {/* Canvas Background Pattern */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]" 
                  style={{
                    backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} 
                />

                {/* Main Preview Container - Centered & Constrained */}
                <div className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-10 relative z-10 overflow-auto">
                  <motion.div 
                    animate={{ scale }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="relative origin-center"
                  >
                    <Preview 
                      image={activeImage} 
                      config={config} 
                      onReplace={handleReplace} 
                      onAddFiles={onDrop} 
                      onDropRejected={(msg) => addToast("Error", msg, "error")} 
                      onClose={handleReset} 
                      scale={1} 
                    />
                  </motion.div>
                </div>

                {/* Floating Add Button */}
                {!isMobile && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                    <motion.button 
                      onClick={openAdd}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-charcoal-800 text-white dark:bg-white dark:text-charcoal-900 px-5 py-3 rounded-full shadow-2xl hover:shadow-xl transition-all font-bold text-sm border border-white/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Page</span>
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
                        selectedImageIds={selectedImageIds}
                        onReorder={setImages}
                        onSelect={handleSelection}
                        onRemove={handleRemove}
                        onRotate={handleRotate}
                        isMobile={false}
                        className="h-full"
                     />
                  </div>
                )}

                {/* Mobile Drawer Filmstrip */}
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
                           <Filmstrip direction="vertical" images={images} activeImageId={activeImageId} selectedImageIds={selectedImageIds} onReorder={setImages} onSelect={handleSelection} onRemove={handleRemove} onRotate={handleRotate} isMobile={isMobile} className="h-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* 3. RIGHT SIDEBAR (Filmstrip - Desktop Only >= 1024px) */}
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
                    selectedImageIds={selectedImageIds} 
                    onReorder={setImages} 
                    onSelect={handleSelection} 
                    onRemove={handleRemove} 
                    onRotate={handleRotate} 
                    isMobile={isMobile} 
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {/* Mobile Bottom Bar */}
            {isMobile && images.length > 0 && !isSidebarOpen && (
              <StickyBar 
                imageCount={images.length} 
                totalSize={totalSize} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                progress={progress}
                status={status}
                mode="image-to-pdf"
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