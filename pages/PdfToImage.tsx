

import React, { useState, useCallback, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { AdSlot } from '../components/AdSlot';
import { RotatingText } from '../components/RotatingText';
import { HeroPill } from '../components/HeroPill';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { UploadedImage, PdfConfig, ExportConfig, PdfPage } from '../types';
import { extractImagesFromPdf } from '../services/pdfExtractor';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { staggerContainer, fadeInUp, buttonTap } from '../utils/animations';
import { EZDropdown } from '../components/EZDropdown';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { DragDropOverlay } from '../components/DragDropOverlay';

export const PdfToImagePage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false); // Loading state
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 1.0,
    scale: 1
  });

  const processPdf = async (file: File) => {
    // We are already inside a processing block, so no need to double toggle
    setIsGenerating(true);
    setProgress(0);
    setStatus('Reading PDF...');
    try {
      const extracted = await extractImagesFromPdf(file, setProgress, setStatus);
      if (extracted.length === 0) {
        addToast("Error", "No images found or PDF is empty.", "error");
      } else {
        setImages(prev => [...prev, ...extracted]);
        addToast("Success", `Extracted ${extracted.length} pages.`, "success");
      }
    } catch (e) {
      console.error(e);
      addToast("Error", "Failed to process PDF.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[] = []) => {
    if (fileRejections && fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;

    setIsProcessingFiles(true); // Start loader
    const startTime = Date.now();

    // Process sequentially
    for (const file of acceptedFiles) {
        await processPdf(file);
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
    }

    setHasStarted(true);
    setIsProcessingFiles(false); // End loader and transition
  }, [addToast]);

  const { getRootProps, getInputProps, open: openAdd, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length === 0) setHasStarted(false);
      return filtered;
    });
    setSelectedImageIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleDeleteSelected = () => {
    setImages(prev => {
      const filtered = prev.filter(img => !selectedImageIds.has(img.id));
      if (filtered.length === 0) setHasStarted(false);
      return filtered;
    });
    setSelectedImageIds(new Set());
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setStatus('Exporting...');
    setTimeout(async () => {
      try {
        const imagesToProcess = selectedImageIds.size > 0 ? images.filter(i => selectedImageIds.has(i.id)) : images;
        
        for (let i = 0; i < imagesToProcess.length; i++) {
          setStatus(`Saving page ${i + 1}/${imagesToProcess.length}...`);
          setProgress(Math.round(((i + 1) / imagesToProcess.length) * 100));
          
          const imgData = imagesToProcess[i];
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
              const img = new Image();
              img.src = imgData.previewUrl;
              await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
              
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
                  const originalName = imgData.file.name;
                  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || `page-${i+1}`;
                  const filename = `${baseName}_EZtify.${extension}`;

                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
              }
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (e) {
        addToast("Error", "Export failed.", "error");
      } finally {
        setIsGenerating(false);
        setProgress(0);
        setStatus('');
      }
    }, 50);
  };

  const handleReset = () => {
    setImages([]);
    setHasStarted(false);
    setSelectedImageIds(new Set());
  };

  // Convert for Grid
  const gridPages: PdfPage[] = images.map((img, idx) => ({
    id: img.id,
    pageIndex: idx,
    previewUrl: img.previewUrl,
    selected: selectedImageIds.has(img.id),
    rotation: img.rotation
  }));

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
        {!hasStarted ? (
          <motion.div key="hero" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <section className="flex-1 flex flex-col items-center justify-center p-4 pt-8 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none bg-brand-mint/10" />
               <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                 <motion.div variants={fadeInUp} className="w-full max-w-xl my-4 relative z-20">
                   <HeroPill>Extract pages from your PDF and save them as separate high-res images.</HeroPill>
                   <UploadArea onDrop={onDrop} mode="pdf-to-image" disabled={isGenerating} isProcessing={isProcessingFiles} />
                 </motion.div>
                 <motion.div variants={fadeInUp}><RotatingText /></motion.div>
               </motion.div>
            </section>
            <AdSlot zone="hero" />
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 dark:to-charcoal-900/40 pb-20 pt-10 border-t border-brand-purple/5 dark:border-white/5">
              <HowItWorks mode="pdf-to-image" />
              <AdSlot zone="footer" /><FAQ />
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" className="flex-1 flex flex-col items-center relative bg-white/50 dark:bg-charcoal-900/50 min-h-[calc(100vh-4rem)] outline-none" {...getRootProps({ onClick: (e) => e.stopPropagation() })}>
            <input {...getInputProps()} />
            
            <DragDropOverlay 
              isDragActive={isDragActive} 
              message="Drop more PDFs" 
              subMessage="They will be processed sequentially" 
              variant="mint"
            />

            {/* 1. STUDIO MODE BAR */}
            <div className="w-full bg-slate-100/80 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-slate-200 dark:border-charcoal-700 sticky top-0 z-40">
               <div className="max-w-7xl mx-auto p-2 flex items-center gap-3">
                  <div className="flex items-center">
                     <span className="font-bold text-charcoal-800 dark:text-white text-sm">PDF to Images</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                     <button 
                       onClick={openAdd} 
                       className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-charcoal-700 dark:text-slate-200 font-bold text-xs hover:border-brand-mint/50 hover:text-brand-mint transition-all shadow-sm"
                     >
                       <Plus size={16} /> Add PDF
                     </button>
                     <button onClick={handleReset} className="p-2 text-charcoal-400 hover:bg-rose-100 hover:text-rose-500 rounded-lg transition-colors" title="Close">
                       <X size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* 2. CONTROL TOOLBAR */}
            <div className="w-full bg-white dark:bg-charcoal-800 border-b border-slate-200 dark:border-charcoal-700 p-3 animate-in slide-in-from-top-2">
                <div className="max-w-md mx-auto">
                    <EZDropdown
                       label="Format"
                       value={exportConfig.format}
                       options={[
                         { label: 'PNG Image', value: 'png' },
                         { label: 'JPG Image', value: 'jpeg' },
                       ]}
                       onChange={(v) => setExportConfig({ ...exportConfig, format: v })}
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
                 onReorder={() => {}} // Reorder irrelevant usually but supported visually
                 useVisualIndexing={true}
               />
            </div>

            {/* 4. STICKY BOTTOM CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-charcoal-700 p-4 z-50">
               <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="hidden md:block text-xs font-medium text-charcoal-400 dark:text-slate-500">
                     {selectedImageIds.size > 0 ? `${selectedImageIds.size} Selected` : `${images.length} Images Extracted`}
                  </div>
                  
                  <div className="w-full md:w-auto">
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.96 }}
                       onClick={handleGenerate}
                       disabled={isGenerating || images.length === 0}
                       className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-brand-mint text-white font-bold shadow-lg shadow-brand-mint/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[240px] text-sm relative overflow-hidden"
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
                            <Download size={18} />
                            {selectedImageIds.size > 0 ? 'Download Selected Images' : 'Convert to Images & Download'}
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
