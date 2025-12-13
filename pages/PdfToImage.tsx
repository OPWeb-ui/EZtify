
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { generateZip } from '../services/zipGenerator';
import { UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { StickyBar } from '../components/StickyBar';
import { Preview } from '../components/Preview';
import { Sidebar } from '../components/Sidebar';
import { FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmstripModal } from '../components/FilmstripModal';
import { Image as ImageIcon, Cpu, Settings, Lock } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { techEase } from '../utils/animations';

export const PdfToImagePage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFilmstripVisible, setIsFilmstripVisible] = useState(true);
  const [isFilmstripModalOpen, setIsFilmstripModalOpen] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Error", "Please select a valid PDF file.", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    setStatus('Parsing PDF structure...');
    const startTime = Date.now();
    
    try {
      const file = acceptedFiles[0];
      const extracted = await extractImagesFromPdf(file, setProgress, setStatus);
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 800) {
          await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
      }

      if (extracted.length > 0) {
        setImages(extracted);
        setActiveImageId(extracted[0].id);
        addToast("Success", `Extracted ${extracted.length} images.`, "success");
      } else {
        addToast("No Images", "No images found in this PDF.", "warning");
      }
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to process PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleDownload = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
      await generateZip(images, { format: 'jpeg', quality: 1, scale: 1 }, setProgress);
      addToast("Success", "Images downloaded successfully.", "success");
    } catch (error) {
      addToast("Error", "Failed to create ZIP.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
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
        mode="pdf-to-image"
        config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }}
        exportConfig={{ format: 'jpeg', quality: 1, scale: 1 }}
        onConfigChange={() => {}}
        onExportConfigChange={() => {}}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onGenerate={handleDownload}
        isGenerating={isGenerating}
        progress={progress}
        status={status}
        imageCount={images.length}
        showFilmstripToggle={!isMobile}
        isFilmstripVisible={isFilmstripVisible}
        onToggleFilmstrip={() => setIsFilmstripVisible(!isFilmstripVisible)}
      />
      
      <div className={`flex-1 flex flex-col h-full relative min-w-0 ${images.length > 0 ? 'bg-slate-100 dark:bg-charcoal-900' : ''} ${isMobile && images.length > 0 ? 'pb-[88px]' : ''}`}>
        
        {/* Tech Workspace Pattern */}
        {images.length > 0 && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                 style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />
        )}

        {images.length === 0 ? (
          <ToolLandingLayout
            title="PDF to Image"
            description="Extract every page of your PDF as a high-resolution image."
            icon={<ImageIcon />}
            onDrop={(files) => onDrop(files, [])}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-yellow-500"
            specs={[
              { label: "Output", value: "JPG/PNG", icon: <ImageIcon /> },
              { label: "Engine", value: "PDF.js", icon: <Cpu /> },
              { label: "Privacy", value: "Local", icon: <Lock /> },
              { label: "Quality", value: "High", icon: <Settings /> },
            ]}
            tip="Use the 'Extract' button to download all pages as a convenient ZIP archive."
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 relative z-10">
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8">
               <Preview 
                  image={activeImage} 
                  config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }}
                  onReplace={() => {}} 
                  onDropRejected={() => {}}
                  scale={1}
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
                          onRotate={() => {}}
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
             mode="pdf-to-image"
             imageCount={images.length}
             totalSize={0}
             onGenerate={handleDownload}
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
              title={`${images.length} Pages`}
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
                  onRotate={() => {}}
                  isMobile={isMobile}
              />
           </FilmstripModal>
         </>
      )}
    </div>
  );
};
