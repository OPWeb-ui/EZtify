
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { convertPdfToPptx } from '../services/pdfToPptxConverter';
import { FileRejection } from 'react-dropzone';
import { Presentation, CheckCircle } from 'lucide-react';

export const PdfToPptxPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    
    setIsProcessingFiles(true);
    setTimeout(() => {
      setFile(f);
      setIsProcessingFiles(false);
      setResult(null);
    }, 600);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const blob = await convertPdfToPptx(file, setProgress, setStatus);
      setResult(blob);
      addToast("Success", "Converted to PowerPoint!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error", "Conversion failed.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_EZtify.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {!file ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="pdf-to-pptx" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
           <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-charcoal-700">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 {result ? <CheckCircle size={32} /> : <Presentation size={32} />}
              </div>
              <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">{file.name}</h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 mb-8">
                 {result ? "Conversion complete! Ready to download." : "Convert PDF pages to PPTX slides."}
              </p>
              
              {!result ? (
                 <button 
                   onClick={handleConvert} 
                   disabled={isGenerating}
                   className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                 >
                    {isGenerating ? `Converting... ${progress}%` : "Convert to PPTX"}
                 </button>
              ) : (
                 <div className="space-y-3">
                    <button 
                       onClick={downloadResult}
                       className="w-full py-4 bg-brand-purple hover:bg-brand-purpleDark text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all"
                    >
                       Download PowerPoint
                    </button>
                    <button onClick={() => { setFile(null); setResult(null); }} className="text-sm text-charcoal-500 hover:text-brand-purple">
                       Convert Another
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
