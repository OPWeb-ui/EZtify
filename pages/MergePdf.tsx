
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfFile } from '../types';
import { mergePdfs } from '../services/pdfMerger';
import { nanoid } from 'nanoid';
import { FileRejection } from 'react-dropzone';
import { MergeFileList } from '../components/MergeFileList';
import { StickyBar } from '../components/StickyBar';
import { generatePdfThumbnail } from '../services/pdfThumbnail';

export const MergePdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const generateThumbnails = async (newFiles: PdfFile[]) => {
    for (const f of newFiles) {
      try {
        const url = await generatePdfThumbnail(f.file);
        setFiles(prev => prev.map(p => p.id === f.id ? { ...p, previewUrl: url } : p));
      } catch (e) {
        console.warn("No thumbnail for", f.file.name);
      }
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
    }

    const newFiles: PdfFile[] = acceptedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (newFiles.length > 0) {
      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${newFiles.length} files.`, "success");
        generateThumbnails(newFiles);
      }, 500);
    }
  }, [addToast]);

  const handleMerge = async () => {
    if (files.length < 2) {
      addToast("Warning", "Need at least 2 files to merge.", "warning");
      return;
    }
    
    setIsGenerating(true);
    try {
      const mergedBlob = await mergePdfs(files, setProgress, setStatus);
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_${files.length}_files_EZtify.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDFs merged successfully!", "success");
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to merge PDFs.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {files.length === 0 ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="merge-pdf" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
          <MergeFileList 
            files={files} 
            onReorder={setFiles} 
            onRemove={(id) => setFiles(prev => prev.filter(f => f.id !== id))} 
          />
        </div>
      )}

      {files.length > 0 && (
         <StickyBar 
            mode="merge-pdf"
            imageCount={files.length}
            totalSize={0}
            onGenerate={handleMerge}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
         />
      )}
    </div>
  );
};
