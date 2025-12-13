
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { StickyBar } from '../components/StickyBar';
import { FileRejection } from 'react-dropzone';

export const DeletePdfPagesPage: React.FC = () => {
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
        // Initially select all pages (so user deselects what to delete, or we just remove from array)
        // Actually for "Delete pages" tool, usually user clicks to delete
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

  const handleRemovePage = (id: string) => {
     setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       // savePdfWithModifications expects the pages we want to KEEP
       const blob = await savePdfWithModifications(file, pages, undefined, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `modified_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "Pages deleted!", "success");
    } catch (e) {
       addToast("Error", "Failed to save PDF.", "error");
    } finally {
       setIsGenerating(false);
       setProgress(0);
       setStatus('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {!file ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="delete-pdf-pages" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
           <div className="max-w-6xl mx-auto">
              <h3 className="text-xl font-bold mb-4 text-charcoal-900 dark:text-white">Click Trash Icon to Delete Pages</h3>
              <SplitPageGrid 
                 pages={pages}
                 onTogglePage={() => {}} 
                 onSelectAll={() => {}}
                 onDeselectAll={() => {}}
                 onInvertSelection={() => {}}
                 onRemovePage={handleRemovePage}
                 onRemoveSelected={() => {}} // Could implement selection for batch delete
                 onReorder={() => {}}
                 isReorderDisabled={true}
                 useVisualIndexing
              />
           </div>
        </div>
      )}

      {file && (
         <StickyBar 
            mode="delete-pdf-pages"
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
