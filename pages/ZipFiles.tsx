
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { ZipFile } from '../types';
import { generateGenericZip } from '../services/genericZipService';
import { nanoid } from 'nanoid';
import { FileRejection } from 'react-dropzone';
import { StickyBar } from '../components/StickyBar';
import { Archive, File as FileIcon, X } from 'lucide-react';

export const ZipFilesPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<ZipFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // We could add thumbnail generation for images if we wanted, 
  // but for generic ZIP it might be overkill.
  const generateThumbnails = async (newFiles: ZipFile[]) => {
      // No-op for now
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    const validNewFiles: ZipFile[] = acceptedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (validNewFiles.length > 0) {
      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...validNewFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${validNewFiles.length} files.`, "success");
        generateThumbnails(validNewFiles);
      }, 500);
    }
  }, [addToast]);

  const handleZip = async () => {
    if (files.length === 0) return;
    setIsGenerating(true);
    try {
      const blob = await generateGenericZip(files, 'DEFLATE', setProgress, setStatus);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archive_EZtify.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "Archive created!", "success");
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to zip files.", "error");
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
            <UploadArea onDrop={onDrop} mode="zip-files" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
          <div className="max-w-3xl mx-auto grid gap-3">
             {files.map(f => (
               <div key={f.id} className="flex items-center gap-4 p-3 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm">
                 <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                    <FileIcon size={20} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-charcoal-800 dark:text-white truncate">{f.file.name}</div>
                    <div className="text-xs text-charcoal-500 dark:text-slate-400">{(f.file.size / 1024).toFixed(1)} KB</div>
                 </div>
                 <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="p-2 text-slate-400 hover:text-rose-500">
                    <X size={18} />
                 </button>
               </div>
             ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
         <StickyBar 
            mode="zip-files"
            imageCount={files.length}
            totalSize={0}
            onGenerate={handleZip}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
         />
      )}
    </div>
  );
};
