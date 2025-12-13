
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
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

export const ImageToPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isFilmstripVisible, setIsFilmstripVisible] = useState(true);
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 0,
    quality: 0.9
  });

  const processFiles = useCallback((files: File[]) => {
      const validImages: UploadedImage[] = [];
      for (const file of files) {
          if (file.type.startsWith('image/')) {
              validImages.push({
                  id: nanoid(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  width: 0, 
                  height: 0, 
                  rotation: 0
              });
          }
      }
      
      validImages.forEach(img => {
          const i = new Image();
          i.onload = () => {
              img.width = i.width;
              img.height = i.height;
          };
          i.src = img.previewUrl;
      });

      return validImages;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
        addToast("Invalid File", "Only image files are allowed.", "error");
    }
    
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    const startTime = Date.now();

    const validImages = processFiles(acceptedFiles);
    
    // Ensure minimum loading time of 1 second
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
    }

    if (validImages.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...validImages];
        if (!activeImageId && validImages.length > 0) setActiveImageId(validImages[0].id);
        return updated;
      });
      setTimeout(() => {
        addToast("Success", `Added ${validImages.length} images.`, "success");
      }, 300);
    }
    setIsProcessingFiles(false);
  }, [addToast, processFiles, activeImageId]);

  const handleGenerate = async () => {
      if (images.length === 0) return;
      setIsGenerating(true);
      try {
          await generatePDF(images, config, setProgress, setStatus);
          addToast("Success", "PDF Generated successfully!", "success");
      } catch (error) {
          console.error(error);
          addToast("Error", "Failed to generate PDF.", "error");
      } finally {
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
      }
  };

  const activeImage = images.find(i => i.id === activeImageId) || null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <PageReadyTracker />
        <Sidebar 
            mode="image-to-pdf"
            config={config}
            exportConfig={{ format: 'jpeg', quality: 0.9, scale: 1 }}
            onConfigChange={setConfig}
            onExportConfigChange={() => {}}
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
            imageCount={images.length}
        />
        
        {/* Main Content Column */}
        <div className="flex-1 flex flex-col h-full relative min-w-0 bg-slate-100 dark:bg-black/20">
            {images.length === 0 ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
                    <div className="max-w-2xl w-full">
                        <UploadArea onDrop={onDrop} mode="image-to-pdf" isProcessing={isProcessingFiles} />
                    </div>
                </div>
            ) : (
                <>
                    {/* Adaptive Preview Area: Takes remaining space, allows scrolling */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative w-full">
                        <div className="min-h-full flex items-center justify-center p-4 md:p-8">
                            <Preview 
                               image={activeImage} 
                               config={config} 
                               onReplace={() => {}} 
                               onDropRejected={() => {}}
                               scale={1}
                               onAddFiles={(files) => onDrop(files, [])}
                            />
                        </div>
                    </div>
                    
                    {/* Filmstrip Panel: Fixed height at bottom of flex container */}
                    <AnimatePresence>
                        {isFilmstripVisible && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: isMobile ? 128 : 160, opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="shrink-0 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] overflow-hidden"
                            >
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
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Spacer: Reserves space for the fixed StickyBar */}
                    {isMobile && (
                        <div className="h-[88px] w-full shrink-0 bg-transparent pointer-events-none" />
                    )}
                </>
            )}
            
            {/* Sticky Action Bar (Fixed Position) */}
            {isMobile && images.length > 0 && (
                <StickyBar 
                    mode="image-to-pdf"
                    imageCount={images.length}
                    totalSize={0}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    progress={progress}
                    status={status}
                    showFilmstripToggle
                    isFilmstripVisible={isFilmstripVisible}
                    onToggleFilmstrip={() => setIsFilmstripVisible(!isFilmstripVisible)}
                />
            )}
        </div>
    </div>
  );
};
