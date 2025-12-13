
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { generateZip } from '../services/zipGenerator';
import { UploadedImage } from '../types';
import { Filmstrip } from '../components/Filmstrip';
import { StickyBar } from '../components/StickyBar';
import { Preview } from '../components/Preview';
import { Sidebar } from '../components/Sidebar';
import { FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';

export const PdfToImagePage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true);
    setStatus('Extracting images...');
    const startTime = Date.now();
    
    try {
      const file = acceptedFiles[0];
      const extracted = await extractImagesFromPdf(file, setProgress, setStatus);
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }
      setHasStarted(true);

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

  const activeImage = images.find(i => i.id === activeImageId) || null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
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
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-slate-100 dark:bg-black/20">
        {images.length === 0 ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
            <div className="max-w-2xl w-full">
              <UploadArea onDrop={onDrop} mode="pdf-to-image" isProcessing={isProcessingFiles} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative w-full">
               <div className="min-h-full flex items-center justify-center p-4 md:p-8">
                   <Preview 
                      image={activeImage} 
                      config={{ pageSize: 'auto', orientation: 'portrait', fitMode: 'contain', margin: 0, quality: 1 }}
                      onReplace={() => {}} 
                      onDropRejected={() => {}}
                      scale={1}
                   />
               </div>
            </div>
            
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="shrink-0 h-32 md:h-40 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]"
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
                onRotate={() => {}}
                isMobile={isMobile}
              />
            </motion.div>

            {isMobile && (
                <div className="h-[88px] w-full shrink-0 bg-white dark:bg-charcoal-850" />
            )}
          </>
        )}
        
        {isMobile && images.length > 0 && (
           <StickyBar 
             mode="pdf-to-image"
             imageCount={images.length}
             totalSize={0}
             onGenerate={handleDownload}
             isGenerating={isGenerating}
             progress={progress}
             status={status}
           />
        )}
      </div>
    </div>
  );
};
