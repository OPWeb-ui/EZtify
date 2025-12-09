import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Layout';
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
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { nanoid } from 'nanoid';
import { Plus } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

export const ImageToPdfPage: React.FC = () => {
  const { addToast } = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scale, setScale] = useState(1);

  // Config State
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });
  
  // Placeholder for reuse
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

  // Reset scale when active image changes
  useEffect(() => {
    setScale(1);
  }, [activeImageId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  // Shared file processing logic
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

  // Handler for Appending Images (Standard Drop)
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const isPdf = fileRejections.some(r => r.file.type === 'application/pdf');
      if (isPdf) {
         addToast("Incorrect File Type", "PDF detected. Please upload Images (JPG, PNG).", "error");
      } else {
         addToast("Invalid File", "Please upload supported image formats only.", "error");
      }
      return; // Block processing if rejection
    }
    
    // STRICT LIMIT CHECK
    if (images.length >= MAX_IMAGE_COUNT) {
      addToast("Limit Reached", `You reached the ${MAX_IMAGE_COUNT} image limit. Please remove some images to add more.`, "warning");
      return;
    }

    const remainingSlots = MAX_IMAGE_COUNT - images.length;
    const validImages = await processFiles(acceptedFiles, remainingSlots);
    
    if (validImages.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...validImages];
        // Select the first new image
        const newId = validImages[0].id;
        if (updated.length > 0) {
           // If we just added our first images, or if user wants to see what they added, switch to it.
           // Usually users want to see the new thing they added.
           setActiveImageId(newId);
           setSelectedImageIds(new Set([newId]));
        }
        return updated;
      });
      // Optionally toast count
      if (images.length > 0) {
        addToast("Added", `${validImages.length} images added.`, "warning");
      }
    }
  }, [images.length, addToast, processFiles]);

  // New Batch Dropzone (Append)
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

    // Multi-select with Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      setSelectedImageIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
      return;
    }

    // Range select with Shift
    if (e.shiftKey && activeImageId) {
      const currentIndex = images.findIndex(img => img.id === activeImageId);
      const newIndex = images.findIndex(img => img.id === id);
      
      if (currentIndex !== -1 && newIndex !== -1) {
        const start = Math.min(currentIndex, newIndex);
        const end = Math.max(currentIndex, newIndex);
        const range = images.slice(start, end + 1).map(img => img.id);
        setSelectedImageIds(new Set(range));
      } else {
         setSelectedImageIds(new Set([id]));
      }
      return;
    }

    // Single select (if no modifier keys)
    setSelectedImageIds(new Set([id]));
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });

    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleRotate = (id: string) => {
    if (selectedImageIds.has(id)) {
      setImages(prev => prev.map(img => 
        selectedImageIds.has(img.id) ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      ));
    } else {
      setSelectedImageIds(new Set([id]));
      setActiveImageId(id);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      ));
    }
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      requestAnimationFrame(async () => {
        try {
          await generatePDF(images, config, setProgress);
        } catch (e) {
          addToast("Error", "Generation failed.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };
  
  // Handler for replacing a SPECIFIC image (passed to Preview for direct single replace)
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

  const handleAddImages = () => {
    openAdd();
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setSelectedImageIds(new Set());
    setScale(1);
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {images.length === 0 ? (
        <motion.div 
          key="hero"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
        >
          <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob bg-brand-purple/5" />
             
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
               <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                 Turn Your Images Into <br/> a PDF in One Click
               </h2>
               
               <HeroPill>
                  <span className="font-bold text-brand-purple">Image to PDF</span> converts your photos into a single, high-quality document instantly. 
                  100% private processing in your browser—no uploads, no waiting.
               </HeroPill>

               <div className="w-full max-w-xl mb-8 relative z-20">
                 <UploadArea onDrop={onDrop} mode="image-to-pdf" disabled={isGenerating} />
               </div>

               <RotatingText />
             </div>
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 0.9, 
            filter: "blur(10px)",
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="flex-1 flex flex-col md:flex-row relative h-[100dvh] overflow-hidden"
        >
          {/* Hidden Add Input */}
          <div {...getAddRoot({ className: 'hidden' })}>
            <input {...getAddInput()} />
          </div>

          {/* Sidebar */}
          <Sidebar 
            mode="image-to-pdf"
            config={config} 
            onConfigChange={setConfig} 
            exportConfig={exportConfig}
            onExportConfigChange={setExportConfig}
            isOpen={isSidebarOpen} 
          />

          {/* Main Area */}
          <div className="flex-1 flex flex-col relative h-full bg-slate-50/30 dark:bg-charcoal-900/30 overflow-hidden">
            
            {/* 1. PREVIEW AREA (Grow to fill available space) */}
            <div className="flex-1 relative min-h-0 w-full flex flex-col">
              <Preview 
                image={activeImage} 
                config={config} 
                onReplace={handleReplace} // Keep this for single replace if needed
                onAddFiles={onDrop} // Dropping files here Appends
                onDropRejected={(msg) => addToast("Error", msg, "error")}
                onClose={handleReset}
                scale={scale}
              />
            </div>

            {/* 2. FILMSTRIP (Fixed height) */}
            <div className="flex-none z-10 border-t border-pastel-border bg-white/80 dark:bg-charcoal-900/80 backdrop-blur pb-20 md:pb-24">
               <Filmstrip 
                 images={images} 
                 activeImageId={activeImageId}
                 selectedImageIds={selectedImageIds}
                 onReorder={setImages}
                 onSelect={handleSelection}
                 onRemove={handleRemove}
                 onRotate={handleRotate}
                 isMobile={isMobile}
                 className="pt-2"
               />
            </div>

            {/* 3. STICKY BAR (Floating) */}
            <StickyBar 
              imageCount={images.length} 
              totalSize={totalSize} 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating} 
              progress={progress}
              mode="image-to-pdf"
              onSecondaryAction={handleAddImages}
              secondaryLabel="Add Images"
              secondaryIcon={<Plus className="w-4 h-4" />}
              zoomLevel={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};