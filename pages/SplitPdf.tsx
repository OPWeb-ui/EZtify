
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { StickyBar } from '../components/StickyBar';
import { FileRejection } from 'react-dropzone';
import { GitFork, Layers, Lock, Cpu, Settings } from 'lucide-react';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const SplitPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only PDF files are allowed.", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];

    setIsProcessingFiles(true);
    setStatus('Loading PDF pages...');
    
    try {
      const loadedPages = await loadPdfPages(f, setProgress, setStatus);
      if (loadedPages.length > 0) {
        setFile(f);
        setPages(loadedPages);
      } else {
        addToast("Error", "Could not load pages.", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to parse PDF.", "error");
    } finally {
      setIsProcessingFiles(false);
      setProgress(0);
      setStatus('');
    }
  }, [addToast]);

  const handleTogglePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleSelectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const handleDeselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));
  const handleInvertSelection = () => setPages(prev => prev.map(p => ({ ...p, selected: !p.selected })));

  const handleSplit = async () => {
    const selectedPages = pages.filter(p => p.selected);
    if (!file || selectedPages.length === 0) {
      addToast("Warning", "Select at least one page.", "warning");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await savePdfWithModifications(file, selectedPages, undefined, setProgress, setStatus);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `split_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast("Success", "PDF split successfully!", "success");
    } catch (error) {
      console.error(error);
      addToast("Error", "Failed to split PDF.", "error");
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
            title="Split PDF"
            description="Extract specific pages or split your document into multiple independent PDF files."
            icon={<GitFork />}
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            isProcessing={isProcessingFiles}
            accentColor="text-purple-500"
            specs={[
              { label: "Mode", value: "Extraction", icon: <Layers /> },
              { label: "Preview", value: "Thumbnails", icon: <Settings /> },
              { label: "Privacy", value: "Client-Side", icon: <Lock /> },
              { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
            ]}
            tip="Select the pages you want to keep. All other pages will be removed from the new file."
        />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-charcoal-900 dark:text-white flex items-center gap-2">
              Select Pages to Extract from <span className="text-brand-purple">{file.name}</span>
            </h3>
            <SplitPageGrid 
              pages={pages}
              onTogglePage={handleTogglePage}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onInvertSelection={handleInvertSelection}
              onRemovePage={() => {}} 
              onRemoveSelected={() => {}}
              onReorder={() => {}}
              isReorderDisabled={true} // Split only selects pages, doesn't reorder usually
              useVisualIndexing
            />
          </div>
        </div>
      )}

      {file && (
         <StickyBar 
            mode="split-pdf"
            imageCount={pages.filter(p => p.selected).length}
            totalSize={0}
            onGenerate={handleSplit}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
         />
      )}
    </div>
  );
};
