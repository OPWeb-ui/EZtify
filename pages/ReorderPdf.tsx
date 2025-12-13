
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { reorderPdf } from '../services/pdfReorder';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { StickyBar } from '../components/StickyBar';
import { FileRejection, useDropzone } from 'react-dropzone';
import { ListOrdered, Lock, Cpu, Info, Zap, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const ReorderPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Loading pages...');
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
      }
    } catch (e) {
      addToast("Error", "Failed to load PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       // Map current page objects back to original indices
       const indices = pages.map(p => p.pageIndex);
       const blob = await reorderPdf(file, indices, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `reordered_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF reordered!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
    } finally {
       setIsGenerating(false);
       setProgress(0);
       setStatus('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {!file ? (
        <ToolLandingLayout
            title="Reorder PDF"
            description="Drag and drop to rearrange pages in your PDF document."
            icon={<ListOrdered />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-purple-500"
            specs={[
              { label: "Interaction", value: "Drag & Drop", icon: <Move /> },
              { label: "Privacy", value: "Client-Side", icon: <Lock /> },
              { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
              { label: "Speed", value: "Fast", icon: <Zap /> },
            ]}
            tip="Simply drag the thumbnails to change their sequence. You can also delete pages."
        />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
           <div className="max-w-6xl mx-auto">
              <h3 className="text-xl font-bold mb-4 text-charcoal-900 dark:text-white">Drag & Drop to Reorder</h3>
              <SplitPageGrid 
                 pages={pages}
                 onTogglePage={() => {}} // No selection in reorder mode
                 onSelectAll={() => {}}
                 onDeselectAll={() => {}}
                 onInvertSelection={() => {}}
                 onRemovePage={(id) => setPages(prev => prev.filter(p => p.id !== id))}
                 onRemoveSelected={() => {}}
                 onReorder={setPages}
                 isReorderDisabled={false}
                 useVisualIndexing
              />
           </div>
        </div>
      )}

      {file && (
         <StickyBar 
            mode="reorder-pdf"
            imageCount={pages.length}
            totalSize={0}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
         />
      )}
    </div>
  );
};
