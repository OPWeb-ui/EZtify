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
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { nanoid } from 'nanoid';
import { Plus, X, FolderInput } from 'lucide-react';
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
  const [showConfirm, setShowConfirm] = useState(false);

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
      addToast("Invalid File", "Please upload supported image formats only.", "error");
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
        const newId = validImages[0].id;
        if (!activeImageId && updated.length > 0) {
          setActiveImageId(newId);
          setSelectedImageIds(new Set([newId]));
        }
        return updated;
      });
    }
  }, [images.length, activeImageId, addToast, processFiles]);

  // Handler for Replacing Images (New Batch)
  const onDropReplace = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload supported image formats only.", "error");
    }
    
    if (acceptedFiles.length === 0) return;

    // Reset logic implies we can use full capacity
    const validImages = await processFiles(acceptedFiles, MAX_IMAGE_COUNT);
    
    if (validImages.length > 0) {
      setImages(validImages);
      const newId = validImages[0].id;
      setActiveImageId(newId);
      setSelectedImageIds(new Set([newId]));
      addToast("New Batch", "Images successfully replaced.", "warning");
    }
  }, [addToast, processFiles]);

  // Main Dropzone (Append) - Programmatic usage for Add Page Button
  const { open: openAddImage } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: MAX_FILE_SIZE_BYTES,
    noClick: true,
    noKeyboard: true,
    multiple: true
  });

  // New Batch Dropzone (Replace) - Programmatically triggered
  const { getRootProps: getReplaceRoot, getInputProps: getReplaceInput, open: openReplace } = useDropzone({
    onDrop: onDropReplace,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: MAX_FILE_SIZE_BYTES,
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
  
  const handleReplace = (file: File) => {
    if (!activeImageId) return;
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

  const handleNewBatch = () => {
    if (images.length > 0) {
      setShowConfirm(true);
    } else {
      openReplace();
    }
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setSelectedImageIds(new Set());
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);

  return (
    <AnimatePresence mode="wait">
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
               
               <div className="w-full max-w-xl my-6 md:my-8 relative z-20">
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
          {/* Hidden Replace Input */}
          <div {...getReplaceRoot({ className: 'hidden' })}>
            <input {...getReplaceInput()} />
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

          {/* Main Area: Flex Column instead of overlapping absolutes to prevent clipping */}
          <div className="flex-1 flex flex-col relative h-full bg-slate-50/30 dark:bg-charcoal-900/30 overflow-hidden">
            
            {/* 1. PREVIEW AREA (Grow to fill available space) */}
            <div className="flex-1 relative min-h-0 w-full flex flex-col">
              <Preview 
                image={activeImage} 
                config={config} 
                onReplace={handleReplace}
                onDropRejected={(msg) => addToast("Error", msg, "error")}
                onClose={handleReset}
                onAddImage={openAddImage}
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
              onSecondaryAction={handleNewBatch}
              secondaryLabel="New Batch"
              secondaryIcon={<FolderInput className="w-4 h-4" />}
            />
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ pointerEvents: 'auto' }}>
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirm(false)}
                className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative bg-white dark:bg-charcoal-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-charcoal-700 overflow-hidden"
             >
               <h3 className="text-lg font-heading font-bold text-charcoal-800 dark:text-white mb-2">Start New Batch?</h3>
               <p className="text-sm text-charcoal-500 dark:text-slate-400 mb-6 leading-relaxed">
                 This will remove all current images and start fresh. Any unsaved PDFs will be lost.
               </p>
               <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setShowConfirm(false)}
                   className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => {
                     setShowConfirm(false);
                     openReplace();
                   }}
                   className="px-4 py-2 text-sm font-bold text-white bg-brand-purple hover:bg-brand-purpleDark rounded-lg shadow-lg shadow-brand-purple/20 transition-colors"
                 >
                   Yes, Start New
                 </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};