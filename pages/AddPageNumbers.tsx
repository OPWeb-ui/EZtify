
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, PageNumberConfig } from '../types';
import { loadPdfPages, savePdfWithModifications } from '../services/pdfSplitter';
import { SplitPageGrid } from '../components/SplitPageGrid';
import { StickyBar } from '../components/StickyBar';
import { FileRejection } from 'react-dropzone';
import { Settings } from 'lucide-react';
import { EZDropdown } from '../components/EZDropdown';

export const AddPageNumbersPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [config, setConfig] = useState<PageNumberConfig>({
    position: 'bottom',
    alignment: 'center',
    startFrom: 1,
    fontSize: 12,
    fontFamily: 'Helvetica',
    offsetX: 0,
    offsetY: 0
  });

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setStatus('Loading preview...');
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
       const blob = await savePdfWithModifications(file, pages, config, setProgress, setStatus);
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `numbered_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "Numbers added!", "success");
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
            <UploadArea onDrop={onDrop} mode="add-page-numbers" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
           {/* Sidebar Config */}
           <div className="w-full md:w-80 bg-white dark:bg-charcoal-800 border-r border-slate-200 dark:border-charcoal-700 p-6 overflow-y-auto z-10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Settings size={18} /> Numbering</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wide">Position</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                       <button onClick={() => setConfig({...config, position: 'top'})} className={`p-2 rounded-lg text-sm border ${config.position === 'top' ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'border-slate-200 dark:border-charcoal-600'}`}>Top</button>
                       <button onClick={() => setConfig({...config, position: 'bottom'})} className={`p-2 rounded-lg text-sm border ${config.position === 'bottom' ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'border-slate-200 dark:border-charcoal-600'}`}>Bottom</button>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wide">Alignment</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                       <button onClick={() => setConfig({...config, alignment: 'left'})} className={`p-2 rounded-lg text-sm border ${config.alignment === 'left' ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'border-slate-200 dark:border-charcoal-600'}`}>Left</button>
                       <button onClick={() => setConfig({...config, alignment: 'center'})} className={`p-2 rounded-lg text-sm border ${config.alignment === 'center' ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'border-slate-200 dark:border-charcoal-600'}`}>Center</button>
                       <button onClick={() => setConfig({...config, alignment: 'right'})} className={`p-2 rounded-lg text-sm border ${config.alignment === 'right' ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'border-slate-200 dark:border-charcoal-600'}`}>Right</button>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wide mb-1 block">Start Number</label>
                    <input 
                      type="number" 
                      value={config.startFrom} 
                      onChange={(e) => setConfig({...config, startFrom: parseInt(e.target.value) || 1})}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-charcoal-600 bg-transparent"
                    />
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wide mb-1 block">Font Size</label>
                    <input 
                      type="range" 
                      min="8" max="24"
                      value={config.fontSize} 
                      onChange={(e) => setConfig({...config, fontSize: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-right text-xs">{config.fontSize}px</div>
                 </div>
              </div>
           </div>

           {/* Preview */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-charcoal-900">
              <div className="max-w-4xl mx-auto">
                 <h3 className="text-lg font-bold mb-4 text-center">Preview</h3>
                 <SplitPageGrid 
                    pages={pages}
                    onTogglePage={() => {}}
                    onSelectAll={() => {}}
                    onDeselectAll={() => {}}
                    onInvertSelection={() => {}}
                    onRemovePage={() => {}}
                    onRemoveSelected={() => {}}
                    onReorder={() => {}}
                    isReorderDisabled={true}
                    numberingConfig={config} // Pass config for live preview
                    showBadges={false}
                 />
              </div>
           </div>
        </div>
      )}

      {file && (
         <StickyBar 
            mode="add-page-numbers"
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
