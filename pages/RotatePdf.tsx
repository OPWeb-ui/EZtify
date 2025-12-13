
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { savePdfWithEditorChanges } from '../services/pdfEditor';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { StickyBar } from '../components/StickyBar';
import { FileRejection, useDropzone } from 'react-dropzone';
import { RotateCw, Lock, Cpu, Zap, RefreshCw, RefreshCcw } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const RotatePdfPage: React.FC = () => {
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

  const handleRotate = (id: string) => {
    setPages(prev => prev.map(p => {
       if (p.id === id) {
          const current = p.rotation || 0;
          return { ...p, rotation: (current + 90) % 360 };
       }
       return p;
    }));
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
       const blob = await savePdfWithEditorChanges(file, pages, undefined, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `rotated_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF rotated!", "success");
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
            title="Rotate PDF"
            description="Fix the orientation of pages in your PDF document. Rotate individual pages or the entire file."
            icon={<RotateCw />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-purple-500"
            specs={[
              { label: "Interaction", value: "Click/Tap", icon: <RefreshCcw /> },
              { label: "Privacy", value: "Client-Side", icon: <Lock /> },
              { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
              { label: "Mode", value: "Rotation", icon: <Zap /> },
            ]}
            tip="Click on any page to rotate it 90 degrees clockwise."
        />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
           <div className="max-w-6xl mx-auto">
              <h3 className="text-xl font-bold mb-4 text-charcoal-900 dark:text-white">Click Pages to Rotate</h3>
              <SplitPageGrid 
                 pages={pages}
                 onTogglePage={() => {}} // Used for rotation via onRotate prop
                 onSelectAll={() => {}}
                 onDeselectAll={() => {}}
                 onInvertSelection={() => {}}
                 onRemovePage={() => {}}
                 onRemoveSelected={() => {}}
                 onReorder={() => {}}
                 isReorderDisabled={true}
                 onRotate={handleRotate}
                 useVisualIndexing
              />
           </div>
        </div>
      )}

      {file && (
         <StickyBar 
            mode="rotate-pdf"
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
