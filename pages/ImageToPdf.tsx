

import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig, PdfPage } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { nanoid } from 'nanoid';
import { Plus, X, FileDown, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { EZDropdown } from '../components/EZDropdown';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { UploadArea } from '../components/UploadArea';
import { HeroPill } from '../components/HeroPill';
import { RotatingText } from '../components/RotatingText';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const ImageToPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false); // New State
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 1.0
  });

  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_RESOLUTION_PX = 10000;
  const MAX_IMAGE_COUNT = 50;

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

    // Process files
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
    if (fileRejections && fileRejections.length > 0) {
      addToast("Invalid File", "Please upload valid images.", "error");
      if (acceptedFiles.length === 0) return;
    }
    
    if (images.length >= MAX_IMAGE_COUNT) {
      addToast("Limit Reached", `Maximum of ${MAX_IMAGE_COUNT} images reached.`, "warning");
      return;
    }

    // Start loading
    setIsProcessingFiles(true);

    // Min wait time for smooth animation (500ms)
    const startTime = Date.now();

    const remainingSlots = MAX_IMAGE_COUNT - images.length;
    const validImages = await processFiles(acceptedFiles, remainingSlots);
    
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) {
       await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));
    }

    if (validImages.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...validImages];
        if (!activeImageId) setActiveImageId(validImages[0].id);
        return updated;
      });
      addToast("Success", `Added ${validImages.length} images.`, "success");
    }
    
    setIsProcessingFiles(false);
  }, [images.length, addToast, processFiles, activeImageId]);

  const { getRootProps, getInputProps, open: openAdd, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleRemove = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSelectedImageIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
  };

  const handleDeleteSelected = () => {
    setImages(prev => prev.filter(img => !selectedImageIds.has(img.id)));
    setSelectedImageIds(new Set());
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
  
  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setSelectedImageIds(new Set());
  };

  // Convert UploadedImage to PdfPage for SplitPageGrid
  const gridPages: PdfPage[] = images.map((img, idx) => ({
    id: img.id,
    pageIndex: idx,
    previewUrl: img.previewUrl,
    selected: selectedImageIds.has(img.id),
    rotation: img.rotation,
    type: 'original'
  }));

  const handleGridReorder = (newPages: PdfPage[]) => {
    const reorderedImages = newPages.map(p => images.find(img => img.id === p.id)!).filter(Boolean);
    setImages(reorderedImages);
  };

  const handleGridToggle = (id: string) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <PageReadyTracker />
      <AnimatePresence mode="wait">
        {images.length === 0 ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-purple/10" />
               <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                 <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                   <HeroPill>Convert JPG, PNG, and WebP images into a single, high-quality PDF document.</HeroPill>
                   <UploadArea onDrop={onDrop} mode="image-to-pdf" disabled={isGenerating} isProcessing={isProcessingFiles} />
                 </motion.div>
                 <motion.div variants={fadeInUp}><RotatingText /></motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="image-to-pdf" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" className="flex-1 flex flex-col items-center relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none" {...getRootProps({ onClick: (e) => e.stopPropagation() })}>
            <input {...getInputProps()} />
            
            <DragDropOverlay 
              isDragActive={isDragActive} 
              message="Drop more images" 
              subMessage="They will be added to the end" 
              variant="purple"
            />

            {/* 1. STUDIO MODE BAR (Sticky Top) */}
            <div className="w-full bg-slate-100/80 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-slate-200 dark:border-charcoal-700 sticky top-0 z-40">
               <div className="max-w-7xl mx-auto p-2 flex items-center gap-3">
                  <div className="flex items-center">
                     <span className="font-bold text-charcoal-800 dark:text-white text-sm">Images to PDF</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                     <button 
                       onClick={openAdd} 
                       className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-charcoal-700 dark:text-slate-200 font-bold text-xs hover:border-brand-purple/50 hover:text-brand-purple transition-all shadow-sm"
                     >
                       <Plus size={16} /> Add Images
                     </button>
                     <button onClick={handleReset} className="p-2 text-charcoal-400 hover:bg-rose-100 hover:text-rose-500 rounded-lg transition-colors" title="Close">
                       <X size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* 2. CONTROL TOOLBAR (Settings) */}
            <div className="w-full bg-white dark:bg-charcoal-800 border-b border-slate-200 dark:border-charcoal-700 p-3 animate-in slide-in-from-top-2">
                <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3">
                    <EZDropdown
                       label="Size"
                       value={config.pageSize}
                       options={[
                         { label: 'Auto', value: 'auto' },
                         { label: 'A4', value: 'a4' },
                         { label: 'Letter', value: 'letter' },
                       ]}
                       onChange={(v) => setConfig({ ...config, pageSize: v })}
                       fullWidth
                     />
                     <EZDropdown
                       label="Orient"
                       value={config.orientation}
                       options={[
                         { label: 'Portrait', value: 'portrait' },
                         { label: 'Landscape', value: 'landscape' },
                       ]}
                       onChange={(v) => setConfig({ ...config, orientation: v })}
                       fullWidth
                     />
                     <EZDropdown
                       label="Fit"
                       value={config.fitMode}
                       options={[
                         { label: 'Contain', value: 'contain' },
                         { label: 'Cover', value: 'cover' },
                         { label: 'Fill', value: 'fill' },
                       ]}
                       onChange={(v) => setConfig({ ...config, fitMode: v })}
                       fullWidth
                     />
                </div>
            </div>

            {/* 3. MAIN CANVAS */}
            <div className="w-full max-w-7xl p-4 pb-32 flex-1">
               <SplitPageGrid
                 pages={gridPages}
                 onTogglePage={handleGridToggle}
                 onSelectAll={() => setSelectedImageIds(new Set(images.map(i => i.id)))}
                 onDeselectAll={() => setSelectedImageIds(new Set())}
                 onInvertSelection={() => {
                     const newSet = new Set(selectedImageIds);
                     images.forEach(img => {
                       if (newSet.has(img.id)) newSet.delete(img.id);
                       else newSet.add(img.id);
                     });
                     setSelectedImageIds(newSet);
                 }}
                 onRemovePage={handleRemove}
                 onRemoveSelected={handleDeleteSelected}
                 onReorder={handleGridReorder}
                 useVisualIndexing={true}
               />
            </div>

            {/* 4. STICKY BOTTOM CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 p-4 z-50">
               <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="hidden md:block text-xs font-medium text-charcoal-400 dark:text-slate-500">
                     {images.length} Images • Drag to reorder
                  </div>
                  
                  <div className="w-full md:w-auto">
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.96 }}
                       onClick={handleGenerate}
                       disabled={isGenerating || images.length === 0}
                       className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[240px] text-sm relative overflow-hidden"
                     >
                        {isGenerating ? (
                          <>
                            <div className="absolute inset-0 bg-black/10" />
                            <motion.div 
                              className="absolute inset-y-0 left-0 bg-white/20" 
                              initial={{ width: '0%' }} 
                              animate={{ width: `${progress}%` }} 
                              transition={{ duration: 0.2 }} 
                            />
                            <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                            <span className="relative z-10">{status || 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <FileDown size={18} />
                            Convert to PDF & Download
                          </>
                        )}
                     </motion.button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
