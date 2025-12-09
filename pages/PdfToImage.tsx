import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '../components/Layout';
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
import { UploadedImage, PdfConfig, ExportConfig } from '../types';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderInput } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { buttonTap } from '../utils/animations';

export const PdfToImagePage: React.FC = () => {
  const { addToast } = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scale, setScale] = useState(1);

  // Config State
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'auto', // Use auto to match extracted PDF page dimensions
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

  React.useEffect(() => {
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

  const processPdf = async (file: File) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const extracted = await extractImagesFromPdf(file, setProgress);
      if (extracted.length === 0) {
        addToast("Error", "No images found or PDF is empty.", "error");
      } else {
        // Append new images instead of replacing
        setImages(prev => {
           const updated = [...prev, ...extracted];
           // Switch active view to the first page of the new batch
           if (extracted.length > 0) {
              setActiveImageId(extracted[0].id);
           }
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
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // 1. Handle explicit rejections
    if (fileRejections.length > 0) {
      const isImage = fileRejections.some(r => r.file.type.startsWith('image/'));
      if (isImage) {
         addToast("Incorrect File Type", "Image detected. Please upload a PDF file.", "error");
      } else {
         addToast("Invalid File", "Please upload a PDF file.", "error");
      }
      return;
    }

    if (acceptedFiles.length === 0) return;
    
    // Process all accepted PDFs (append them one by one)
    for (const file of acceptedFiles) {
        if (file.type !== 'application/pdf') {
            addToast("Invalid File", `Skipped ${file.name}. Please upload PDF files.`, "error");
            continue;
        }
        await processPdf(file);
    }
  }, [addToast]);

  // Dropzone for Adding more PDFs (Append)
  const { getRootProps: getAddRoot, getInputProps: getAddInput, open: openAdd } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true, // Allow adding multiple PDFs at once
    noClick: true,
    noKeyboard: true
  });

  const handleRotate = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      requestAnimationFrame(async () => {
        try {
          for (let i = 0; i < images.length; i++) {
            // Update progress occasionally
            setProgress(Math.round(((i + 1) / images.length) * 100));
            
            const imgData = images[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                const img = new Image();
                img.src = imgData.previewUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

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
            // Brief delay to help browser handle multiple downloads
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (e) {
          console.error(e);
          addToast("Error", "Export failed.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleAddPdf = () => {
      openAdd();
  };

  const handleReset = () => {
    setImages([]);
    setActiveImageId(null);
    setScale(1);
  };

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0); // Approx size

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
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob bg-brand-mint/10" />
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
               <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white mb-4 leading-tight tracking-tight">
                 Turn Your PDF Pages <br/> Into Images in Seconds
               </h2>
               
               <HeroPill>
                  <span className="font-bold text-brand-mint">PDF to Image</span> extracts pages from your document and saves them as high-resolution JPG or PNG files. 
                  Secure, local extraction with no server uploads.
               </HeroPill>

               <div className="w-full max-w-xl mb-8 relative z-20">
                 <UploadArea onDrop={onDrop} mode="pdf-to-image" disabled={isGenerating} />
               </div>
               <RotatingText />
             </div>
          </section>

          <AdSlot zone="hero" />

          <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-12 border-t border-brand-purple/5 dark:border-white/5">
            <HowItWorks mode="pdf-to-image" />
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

          <Sidebar 
            mode="pdf-to-image"
            config={config} 
            onConfigChange={setConfig} 
            exportConfig={exportConfig}
            onExportConfigChange={setExportConfig}
            isOpen={isSidebarOpen} 
          />

          <div className="flex-1 flex flex-col relative h-full bg-slate-50/30 dark:bg-charcoal-900/30 overflow-hidden">
            
            {/* 1. PREVIEW AREA */}
            <div className="flex-1 relative min-h-0 w-full flex flex-col">
               <Preview 
                 image={activeImage} 
                 config={config} 
                 onReplace={() => {}} // Replace is disabled for extracted pages
                 onAddFiles={onDrop} // Dropping file here Appends
                 onDropRejected={() => {}}
                 onClose={handleReset}
                 scale={scale}
               />
            </div>
            
            {/* 2. FILMSTRIP (Fixed height wrapper) */}
            <div className="flex-none z-10 border-t border-pastel-border bg-white/80 dark:bg-charcoal-900/80 backdrop-blur pb-20 md:pb-24">
              <Filmstrip 
                images={images} 
                activeImageId={activeImageId}
                onReorder={setImages}
                onSelect={setActiveImageId}
                onRemove={handleRemove}
                onRotate={handleRotate}
                isMobile={isMobile}
                className="pt-2"
              />
            </div>

            {/* 3. STICKY BAR */}
            <StickyBar 
              imageCount={images.length} 
              totalSize={totalSize} 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating} 
              progress={progress}
              mode="pdf-to-image"
              onSecondaryAction={handleAddPdf}
              secondaryLabel="Add PDF"
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