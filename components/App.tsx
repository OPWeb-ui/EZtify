import React, { useState, useEffect, useCallback } from 'react';
import { UploadedImage, PdfConfig, ToastMessage, AppMode, ExportConfig, CompressionLevel, CompressionResult, PdfFile } from '../types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Filmstrip } from './components/Filmstrip';
import { Preview } from './components/Preview';
import { StickyBar } from './components/StickyBar';
import { FAQ } from './components/FAQ';
import { HowItWorks } from './components/HowItWorks';
import { UploadArea } from './components/UploadArea';
import { ToastContainer } from './components/Toast';
import { MergeFileList } from './components/MergeFileList';
import { generatePDF } from './services/pdfGenerator';
import { extractImagesFromPdf } from './services/pdfExtractor';
import { compressPDF } from './services/pdfCompressor';
import { mergePdfs } from './services/pdfMerger';
import { generateZip } from './services/zipGenerator';
import { RotatingText } from './components/RotatingText';
import { nanoid } from 'nanoid';
import { Plus, ArrowLeft, Minimize2, CheckCircle, RefreshCcw, Download, Layers } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('image-to-pdf');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Compress Mode State
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('normal');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  // Merge Mode State
  const [mergeFiles, setMergeFiles] = useState<PdfFile[]>([]);
  const [mergeResult, setMergeResult] = useState<{ blob: Blob, size: number, count: number } | null>(null);

  // PDF Gen Config
  const [config, setConfig] = useState<PdfConfig>({
    pageSize: 'a4',
    orientation: 'portrait',
    fitMode: 'contain',
    margin: 10,
    quality: 0.8
  });

  // PDF Export Config
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.9,
    scale: 2
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Constants
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_RESOLUTION_PX = 10000;
  const MAX_IMAGE_COUNT = 50;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state when mode changes
  const switchMode = (newMode: AppMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setImages([]);
      setActiveImageId(null);
      setCompressFile(null);
      setCompressionResult(null);
      setMergeFiles([]);
      setMergeResult(null);
      setProgress(0);
    }
  };

  const addToast = (title: string, message: string, type: 'warning' | 'error' = 'warning') => {
    const id = nanoid();
    setToasts(prev => {
      const updated = [...prev, { id, title, message, type }];
      return updated.slice(-5);
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRemove = (id: string) => {
    if (mode === 'merge-pdf') {
      setMergeFiles(prev => prev.filter(f => f.id !== id));
      return;
    }
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Validation
    if (fileRejections.length > 0) {
      const isPdfRejection = fileRejections.some(r => r.file.type === 'application/pdf');
      const isImageRejection = fileRejections.some(r => r.file.type.startsWith('image/'));

      if (mode === 'image-to-pdf' && isPdfRejection) {
        addToast("Incorrect Mode", "Please upload images for this tool.", "error");
        return;
      }
      if ((mode === 'pdf-to-image' || mode === 'compress-pdf' || mode === 'merge-pdf') && isImageRejection) {
        addToast("Incorrect Mode", "Please upload a PDF file for this tool.", "error");
        return;
      }
      addToast("Unsupported Format", "Unsupported file type.", "error");
    }

    if (acceptedFiles.length === 0) return;

    // --- COMPRESS PDF LOGIC ---
    if (mode === 'compress-pdf') {
      const file = acceptedFiles[0];
      if (acceptedFiles.length > 1) {
        addToast("One File at a Time", "Please upload one PDF file at a time.", "warning");
      }
      if (file.size > 50 * 1024 * 1024) {
         addToast("Large File Detected", "Processing large files may take longer.", "warning");
      }
      setCompressFile(file);
      setCompressionResult(null);
      return;
    }

    // --- MERGE PDF LOGIC ---
    if (mode === 'merge-pdf') {
      const newFiles: PdfFile[] = acceptedFiles.map(file => ({
        id: nanoid(),
        file
      }));
      setMergeFiles(prev => [...prev, ...newFiles]);
      return;
    }

    // --- IMAGE TO PDF LOGIC ---
    if (mode === 'image-to-pdf') {
       const validSizeFiles: File[] = [];
       let sizeErrorCount = 0;
   
       acceptedFiles.forEach(file => {
         if (file.size > MAX_FILE_SIZE_BYTES) {
           sizeErrorCount++;
         } else {
           validSizeFiles.push(file);
         }
       });
   
       if (sizeErrorCount > 0) {
         addToast("File Too Large", `Max ${MAX_FILE_SIZE_MB}MB per file.`, "error");
       }
   
       if (validSizeFiles.length === 0) return;
   
       const currentCount = images.length;
       const remainingSlots = MAX_IMAGE_COUNT - currentCount;
       
       if (remainingSlots <= 0) {
          addToast("Limit Reached", `Maximum of ${MAX_IMAGE_COUNT} images allowed.`, "warning");
         return;
       }
   
       let filesToProcess = validSizeFiles;
       if (validSizeFiles.length > remainingSlots) {
         filesToProcess = validSizeFiles.slice(0, remainingSlots);
         addToast("Limit Reached", `Uploading first ${remainingSlots} images to fit limit.`, "warning");
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
   
       const validImages = results.filter((img): img is UploadedImage => img !== null);
       
       if (validImages.length < filesToProcess.length) {
          addToast("Resolution Too High", `Some images exceeded ${MAX_RESOLUTION_PX}px and were skipped.`, "error");
       }
   
       if (validImages.length > 0) {
         setImages(prev => {
           const updated = [...prev, ...validImages];
           if (!activeImageId && updated.length > 0) setActiveImageId(updated[0].id);
           return updated;
         });
       }

    } else if (mode === 'pdf-to-image') {
      // --- PDF TO IMAGE LOGIC ---
      const pdfFile = acceptedFiles[0]; 
      if (acceptedFiles.length > 1) {
        addToast("One File at a Time", "Please upload one PDF file at a time.", "warning");
      }

      setIsGenerating(true);
      setProgress(0);
      try {
        const extracted = await extractImagesFromPdf(pdfFile, (p) => setProgress(p));
        if (extracted.length === 0) {
           addToast("Error", "Could not extract images from this PDF.", "error");
        } else {
           setImages(extracted);
           setActiveImageId(extracted[0].id);
        }
      } catch (e) {
        console.error(e);
        addToast("Extraction Failed", "Failed to parse PDF.", "error");
      } finally {
        setIsGenerating(false);
        setProgress(0);
      }
    }

  }, [images.length, activeImageId, mode]); 

  // Used for the floating action button
  const { getRootProps: getFabRoot, getInputProps: getFabInput } = useDropzone({ 
    onDrop,
    accept: mode === 'image-to-pdf' 
      ? { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }
      : { 'application/pdf': ['.pdf'] },
    maxSize: mode === 'image-to-pdf' ? MAX_FILE_SIZE_BYTES : undefined
  });

  const handleReplace = useCallback((file: File) => {
    if (mode === 'pdf-to-image' || mode === 'compress-pdf' || mode === 'merge-pdf') {
      return;
    }

    if (!activeImageId) return;
    if (!file.type.startsWith('image/')) {
        addToast("Unsupported Format", "Unsupported file type.", "error");
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
  }, [activeImageId, mode]);

  const handleDropRejected = (msg: string) => {
    addToast("Upload Failed", msg, "error");
  };

  const handleCompress = async () => {
    if (!compressFile) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      requestAnimationFrame(async () => {
        try {
          const result = await compressPDF(compressFile, compressionLevel, (p) => setProgress(p));
          setCompressionResult(result);
        } catch (e) {
          console.error(e);
          addToast("Compression Failed", "Could not compress this PDF.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const handleMerge = async () => {
    if (mergeFiles.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      requestAnimationFrame(async () => {
        try {
          const blob = await mergePdfs(mergeFiles, (p) => setProgress(p));
          setMergeResult({ blob, size: blob.size, count: mergeFiles.length });
        } catch (e) {
          console.error(e);
          addToast("Merge Failed", "Could not merge files. One might be corrupt.", "error");
        } finally {
          setIsGenerating(false);
          setProgress(0);
        }
      });
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const downloadMerged = () => {
    if (!mergeResult) return;
    const url = URL.createObjectURL(mergeResult.blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `PDFme-Merged-${date}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      requestAnimationFrame(async () => {
        try {
          if (mode === 'image-to-pdf') {
            await generatePDF(images, config, (percent) => setProgress(percent));
          } else {
            await generateZip(images, exportConfig, (percent) => setProgress(percent));
          }
        } catch (e) {
          console.error("Operation failed:", e);
          addToast("Operation Failed", "Something went wrong.", "error");
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

  const handleRotate = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const downloadCompressed = () => {
    if (!compressionResult) return;
    const url = URL.createObjectURL(compressionResult.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = compressionResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalSize = images.reduce((acc, img) => acc + img.file.size, 0);
  const activeImage = images.find(img => img.id === activeImageId) || null;

  // Helpers for view state
  const isCompressMode = mode === 'compress-pdf';
  const isMergeMode = mode === 'merge-pdf';

  const showHero = 
    (isCompressMode && !compressFile) || 
    (isMergeMode && mergeFiles.length === 0) || 
    (!isCompressMode && !isMergeMode && images.length === 0);

  const showCompressWorkspace = isCompressMode && compressFile;
  const showMergeWorkspace = isMergeMode && mergeFiles.length > 0;

  // Get dynamic background blob color based on tool personality
  const getBlobColor = () => {
    switch (mode) {
      case 'image-to-pdf': return 'bg-brand-purple/5';
      case 'pdf-to-image': return 'bg-brand-mint/10';
      case 'compress-pdf': return 'bg-brand-violet/10';
      case 'merge-pdf': return 'bg-brand-orange/10';
      default: return 'bg-brand-purple/5';
    }
  };

  return (
    <div className="min-h-screen bg-pastel-bg text-charcoal-600 flex flex-col font-sans selection:bg-brand-purple/20">
      
      <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />

      <Header currentMode={mode} onModeChange={switchMode} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16">
        
        {showHero ? (
          // ========================
          // SINGLE-ACTION HERO LANDING (ALL MODES)
          // ========================
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            
            <section className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-12 pb-12 relative">
              {/* Dynamic Background Blob */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-blob transition-colors duration-1000 ease-in-out ${getBlobColor()}`} />
              
              <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                
                {/* Headline Dynamic */}
                <h2 className="text-3xl md:text-6xl font-heading font-bold text-charcoal-900 mb-4 leading-tight md:leading-[1.1] tracking-tight">
                  {mode === 'image-to-pdf' && <>Turn Your Images Into <br/> a PDF in One Click</>}
                  {mode === 'pdf-to-image' && <>Turn Your PDF Pages <br/> Into Images in Seconds</>}
                  {mode === 'compress-pdf' && <>Make Your PDF Smaller <br/> in One Click</>}
                  {mode === 'merge-pdf' && <>Merge Multiple PDFs <br/> Into One File in One Click</>}
                </h2>

                {/* Upload Box */}
                <div className="w-full max-w-xl my-6 md:my-8 relative z-20">
                   <UploadArea onDrop={onDrop} mode={mode} disabled={isGenerating} />
                </div>

                <RotatingText />
              </div>
            </section>

            {/* Below Fold */}
            <div className="w-full bg-gradient-to-b from-transparent to-white/40 pb-20 pt-12 border-t border-brand-purple/5">
              <HowItWorks mode={mode} />
              <FAQ />
            </div>
          </div>
        ) : showMergeWorkspace ? (
           // ========================
           // MERGE PDF WORKFLOW
           // ========================
           <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto custom-scrollbar">
             <div className="w-full max-w-lg mb-20">
               
               {!mergeResult ? (
                 <>
                  {/* File List */}
                  <MergeFileList 
                    files={mergeFiles} 
                    onReorder={setMergeFiles} 
                    onRemove={handleRemove} 
                  />
                  
                  {/* Add More Area (Small) */}
                  <div className="mb-8">
                     <div {...getFabRoot()} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-brand-purple/50 hover:bg-white cursor-pointer transition-all">
                        <input {...getFabInput()} />
                        <span className="text-sm font-bold text-brand-purple flex items-center justify-center gap-2">
                           <Plus size={16} /> Add more PDFs
                        </span>
                     </div>
                  </div>
                  
                  {/* Merge Button */}
                  <div className="sticky bottom-4 z-30">
                     <button
                       onClick={handleMerge}
                       disabled={isGenerating}
                       className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait relative overflow-hidden"
                     >
                        {isGenerating ? (
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Merging {progress > 0 && `${Math.round(progress)}%`}...</span>
                           </div>
                        ) : (
                           "Merge PDFs Now"
                        )}
                     </button>
                  </div>
                 </>
               ) : (
                 // MERGE RESULT
                 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 mt-12">
                      <div className="bg-brand-mint/10 border border-brand-mint/20 rounded-2xl p-6 text-center">
                         <div className="text-brand-mint mb-2 flex justify-center"><CheckCircle size={48} /></div>
                         <h3 className="text-xl font-bold text-charcoal-800">Merge Complete!</h3>
                         <p className="text-charcoal-500 mt-2 text-sm">
                           Successfully merged {mergeResult.count} files.
                         </p>
                         <div className="text-brand-purple font-bold text-lg mt-1">{(mergeResult.size / (1024 * 1024)).toFixed(2)} MB</div>
                      </div>

                      <button
                        onClick={downloadMerged}
                        className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                         <Download size={20} />
                         Download Merged PDF
                      </button>

                      <button
                        onClick={() => { setMergeFiles([]); setMergeResult(null); }}
                        className="w-full py-3 text-charcoal-500 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                      >
                         <RefreshCcw size={14} /> Merge more files
                      </button>
                 </div>
               )}

             </div>
           </div>
        ) : showCompressWorkspace ? (
          // ========================
          // COMPRESS PDF WORKFLOW (No Sidebar/Filmstrip)
          // ========================
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
             <div className="w-full max-w-lg">
                
                {/* File Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-brand-purple/5 border border-slate-100 text-center mb-6">
                   <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
                      <Minimize2 className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-bold text-charcoal-800 truncate px-4">{compressFile?.name}</h3>
                   <p className="text-charcoal-500 font-mono text-sm mt-1">{(compressFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                {!compressionResult ? (
                   // SELECTION STATE
                   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-2 gap-4">
                         <button
                           onClick={() => setCompressionLevel('normal')}
                           className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${compressionLevel === 'normal' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 bg-white hover:border-brand-purple/30'}`}
                         >
                            <div className="font-bold text-charcoal-800 mb-1">Normal</div>
                            <div className="text-xs text-charcoal-500">Optimized structure. Good quality.</div>
                            {compressionLevel === 'normal' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}
                         </button>

                         <button
                           onClick={() => setCompressionLevel('strong')}
                           className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${compressionLevel === 'strong' ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 bg-white hover:border-brand-purple/30'}`}
                         >
                            <div className="font-bold text-charcoal-800 mb-1">Strong</div>
                            <div className="text-xs text-charcoal-500">Max compression. Lower quality.</div>
                            {compressionLevel === 'strong' && <div className="absolute top-2 right-2 text-brand-purple"><CheckCircle size={16} /></div>}
                         </button>
                      </div>

                      <button
                        onClick={handleCompress}
                        disabled={isGenerating}
                        className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait relative overflow-hidden"
                      >
                         {isGenerating ? (
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Compressing {progress > 0 && `${Math.round(progress)}%`}...</span>
                           </div>
                         ) : (
                           "Compress PDF Now"
                         )}
                      </button>
                   </div>
                ) : (
                   // RESULT STATE
                   <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-brand-mint/10 border border-brand-mint/20 rounded-2xl p-6 text-center">
                         <div className="text-brand-mint mb-2 flex justify-center"><CheckCircle size={48} /></div>
                         <h3 className="text-xl font-bold text-charcoal-800">Ready to Download!</h3>
                         <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                            <div className="text-charcoal-400 line-through">{(compressionResult.originalSize / (1024 * 1024)).toFixed(2)} MB</div>
                            <ArrowLeft className="w-4 h-4 text-charcoal-300 rotate-180" />
                            <div className="text-brand-purple font-bold text-lg">{(compressionResult.newSize / (1024 * 1024)).toFixed(2)} MB</div>
                         </div>
                         <div className="mt-2 inline-block px-3 py-1 bg-brand-mint text-white text-xs font-bold rounded-full">
                            Saved {Math.round((1 - compressionResult.newSize / compressionResult.originalSize) * 100)}%
                         </div>
                      </div>

                      <button
                        onClick={downloadCompressed}
                        className="w-full py-4 rounded-xl bg-brand-purple text-white font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                         <Download size={20} />
                         Download Compressed PDF
                      </button>

                      <button
                        onClick={() => { setCompressFile(null); setCompressionResult(null); }}
                        className="w-full py-3 text-charcoal-500 hover:text-brand-purple font-medium text-sm flex items-center justify-center gap-2"
                      >
                         <RefreshCcw size={14} /> Compress another file
                      </button>
                   </div>
                )}
             </div>
             
             {/* Mobile Sticky Bar for Compress Action (only when not generating and no result yet) */}
             {isMobile && !isGenerating && !compressionResult && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-xl z-50">
                  <button
                    onClick={handleCompress}
                    className="w-full py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/20 active:scale-95 transition-all"
                  >
                    Compress Now
                  </button>
                </div>
             )}
          </div>
        ) : (
          // ========================
          // STANDARD WORKSPACE (Images <-> PDF)
          // ========================
          <div className="flex-1 flex flex-col md:flex-row relative h-[calc(100vh-4rem)]">
            
            {/* Desktop Sidebar / Mobile Drawer */}
            <Sidebar 
              mode={mode}
              config={config} 
              onConfigChange={setConfig} 
              exportConfig={exportConfig}
              onExportConfigChange={setExportConfig}
              isOpen={isSidebarOpen} 
            />

            <div className="flex-1 flex flex-col relative h-full bg-slate-50/30">
              
              {/* Top: Preview Area */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className="flex-1 relative z-0 pb-36 md:pb-0 h-full"> 
                  <Preview 
                    image={activeImage} 
                    config={config} 
                    onReplace={handleReplace}
                    onDropRejected={handleDropRejected}
                  />
                  
                  {/* Floating Add Page Button */}
                  {mode === 'image-to-pdf' && (
                    <div {...getFabRoot()} className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
                      <input {...getFabInput()} />
                      <button className="flex items-center gap-2 bg-white/90 backdrop-blur hover:bg-white text-charcoal-800 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-pastel-border shadow-lg shadow-brand-purple/5 transition-all group hover:scale-105 active:scale-95">
                          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform text-brand-purple" />
                          <span className="text-xs md:text-sm font-bold text-brand-purple">Add Page</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filmstrip */}
              <div className={`z-10 border-t border-pastel-border bg-white/80 backdrop-blur flex-shrink-0 ${isMobile ? 'h-32 pb-1' : 'h-56'}`}>
                <Filmstrip 
                  images={images} 
                  activeImageId={activeImageId}
                  onReorder={setImages}
                  onSelect={setActiveImageId}
                  onRemove={handleRemove}
                  onRotate={handleRotate}
                  isMobile={isMobile}
                />
              </div>

              {/* Spacer */}
              {isMobile && <div className="h-20" />}

              {/* Sticky Action Bar */}
              <StickyBar 
                imageCount={images.length} 
                totalSize={totalSize} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                progress={progress}
                mode={mode}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;