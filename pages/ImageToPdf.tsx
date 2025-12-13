
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
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
import { FilmstripModal } from '../components/FilmstripModal';
import { FileStack, Image as ImageIcon, Cpu, Settings, Lock } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { techEase } from '../utils/animations';

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
  const [isFilmstripModalOpen, setIsFilmstripModalOpen] = useState(false);
  
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 0,
    quality: 0.9
  });

  const processFiles = useCallback(async (files: File[]) => {
      const validImages: UploadedImage[] = [];
      for (const file of files) {
          if (file.type.startsWith('image/')) {
              const previewUrl = URL.createObjectURL(file);
              
              // Wait for image dimensions to load to ensure Preview aspect ratio is correct immediately
              const dimensions = await new Promise<{w: number, h: number}>((resolve) => {
                  const img = new Image();
                  img.onload = () => resolve({ w: img.width, h: img.height });
                  img.onerror = () => resolve({ w: 0, h: 0 });
                  img.src = previewUrl;
              });

              validImages.push({
                  id: nanoid(),
                  file,
                  previewUrl,
                  width: dimensions.w, 
                  height: dimensions.h, 
                  rotation: 0
              });
          }
      }
      return validImages;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
        addToast("Invalid File", "Only image files are allowed.", "error");
    }
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    // const startTime = Date.now();
    
    try {
        const validImages = await processFiles(acceptedFiles);
        
        // Ensure minimum loading time for UX smoothness
        // const elapsedTime = Date.now() - startTime;
        // if (elapsedTime < 500) {
        //     await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        // }

        if (validImages.length > 0) {
          setImages(prev => {
            const updated = [...prev, ...validImages];
            if (!activeImageId && validImages.length > 0) setActiveImageId(validImages[0].id);
            return updated;
          });
          setTimeout(() => {
            addToast("Success", `Added ${validImages.length} images.`, "success");
          }, 100);
        }
    } catch (e) {
        console.error("Error processing files", e);
        addToast("Error", "Failed to process some images.", "error");
    } finally {
        setIsProcessingFiles(false);
    }
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
  
  const handleSelectFromModal = (id: string) => {
    setActiveImageId(id);
    setIsFilmstripModalOpen(false);
  };

  const activeImage = images.find(i => i.id === activeImageId) || null;

  return (
    <div className="flex w-full h-full pt-16 overflow-hidden">
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
            showFilmstripToggle={!isMobile}
            isFilmstripVisible={isFilmstripVisible}
            onToggleFilmstrip={() => setIsFilmstripVisible(!isFilmstripVisible)}
        />
        
        <div className={`flex-1 flex flex-col h-full relative min-w-0 ${images.length > 0 ? 'bg-slate-100 dark:bg-charcoal-900' : ''} ${isMobile && images.length > 0 ? 'pb-[88px]' : ''}`}>
            
            {images.length > 0 && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                     style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
            )}

            {images.length === 0 ? (
                <ToolLandingLayout
                  title="Image to PDF"
                  description="Compile photos, screenshots, and graphics into a high-fidelity PDF document."
                  icon={<FileStack />}
                  onDrop={(files) => onDrop(files, [])}
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] }}
                  multiple={true}
                  isProcessing={isProcessingFiles}
                  accentColor="text-yellow-500"
                  specs={[
                    { label: "Input", value: "JPG/PNG/WEBP", icon: <ImageIcon /> },
                    { label: "Engine", value: "jsPDF", icon: <Cpu /> },
                    { label: "Privacy", value: "Local", icon: <Lock /> },
                    { label: "Config", value: "A4/Letter", icon: <Settings /> },
                  ]}
                  tip="Drag and drop images into the filmstrip to reorder them before conversion."
                />
            ) : (
                <div className="flex-1 flex flex-col min-h-0 relative z-10">
                    <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8">
                        <Preview 
                           image={activeImage} 
                           config={config} 
                           onReplace={() => {}} 
                           onDropRejected={() => {}}
                           scale={1}
                           onAddFiles={(files) => onDrop(files, [])}
                        />
                    </div>
                    
                    {!isMobile && (
                        <AnimatePresence>
                            {isFilmstripVisible && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 160, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: techEase }}
                                    className="shrink-0 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-t border-slate-200 dark:border-charcoal-800 z-20 relative shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
                                >
                                    <Filmstrip 
                                        images={images}
                                        activeImageId={activeImageId}
                                        onSelect={setActiveImageId}
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
                    )}
                </div>
            )}
        </div>
        
        {isMobile && images.length > 0 && (
            <>
                <StickyBar 
                    mode="image-to-pdf"
                    imageCount={images.length}
                    totalSize={0}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    progress={progress}
                    status={status}
                    showFilmstripToggle
                    isFilmstripVisible={isFilmstripModalOpen}
                    onToggleFilmstrip={() => setIsFilmstripModalOpen(true)}
                />
                <FilmstripModal
                    isOpen={isFilmstripModalOpen}
                    onClose={() => setIsFilmstripModalOpen(false)}
                    title={`${images.length} Images`}
                >
                    <Filmstrip 
                        images={images}
                        activeImageId={activeImageId}
                        onSelect={handleSelectFromModal}
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
                </FilmstripModal>
            </>
        )}
    </div>
  );
};
