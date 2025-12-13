
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { FileRejection } from 'react-dropzone';
import { Code, Save, X, FilePlus } from 'lucide-react';
import { StickyBar } from '../components/StickyBar';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export const CodeEditorPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const handleFileUpload = async (uploadedFiles: File[]) => {
    let count = 0;
    for (const file of uploadedFiles) {
       try {
         const text = await file.text();
         const newFile: CodeFile = {
           id: Math.random().toString(36).substr(2, 9),
           name: file.name,
           content: text,
           language: file.name.split('.').pop() || 'text'
         };
         setFiles(prev => [...prev, newFile]);
         if (!activeFileId) setActiveFileId(newFile.id);
         count++;
       } catch (e) {
         console.error(e);
       }
    }
    return count;
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Only text files allowed.", "error");
    }
    
    if (acceptedFiles.length > 0) {
       setIsProcessingFiles(true);
       const count = await handleFileUpload(acceptedFiles);
       setIsProcessingFiles(false);
       if (count > 0) {
         addToast("Success", `Opened ${count} files.`, "success");
         if (!activeFileId && files.length === 0) {
            // Set active if it was empty
            // Handled inside loop logic actually but state updates are async
         }
       }
    }
  }, [addToast, activeFileId, files.length]);

  const activeFile = files.find(f => f.id === activeFileId);

  const updateFileContent = (newContent: string) => {
    if (activeFileId) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Success", "File saved!", "success");
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {files.length === 0 ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="code-editor" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
           {/* Sidebar File List */}
           <div className="w-full md:w-64 bg-white dark:bg-charcoal-800 border-r border-slate-200 dark:border-charcoal-700 flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-charcoal-700 font-bold flex items-center gap-2">
                 <Code size={18} /> Open Files
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {files.map(f => (
                   <div 
                     key={f.id}
                     onClick={() => setActiveFileId(f.id)}
                     className={`
                       px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between group
                       ${activeFileId === f.id ? 'bg-brand-purple/10 text-brand-purple font-medium' : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'}
                     `}
                   >
                     <span className="truncate">{f.name}</span>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         const nextFiles = files.filter(x => x.id !== f.id);
                         setFiles(nextFiles);
                         if (activeFileId === f.id) setActiveFileId(nextFiles.length > 0 ? nextFiles[0].id : null);
                       }}
                       className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500"
                     >
                       <X size={14} />
                     </button>
                   </div>
                 ))}
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-charcoal-700">
                 <div className="relative">
                    <input 
                      type="file" 
                      multiple 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(Array.from(e.target.files));
                         }
                      }}
                    />
                    <button className="w-full py-2 bg-slate-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                       <FilePlus size={16} /> Add File
                    </button>
                 </div>
              </div>
           </div>

           {/* Editor Area */}
           <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-charcoal-900">
              {activeFile ? (
                 <>
                   <div className="flex-1 relative">
                      <textarea
                        value={activeFile.content}
                        onChange={(e) => updateFileContent(e.target.value)}
                        className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent outline-none resize-none text-charcoal-800 dark:text-slate-200"
                        spellCheck={false}
                      />
                   </div>
                   {/* Mobile Action Bar */}
                   <div className="p-4 border-t border-slate-200 dark:border-charcoal-700 flex justify-end">
                      <button 
                        onClick={handleDownload}
                        className="px-6 py-2 bg-brand-purple text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 flex items-center gap-2 hover:bg-brand-purpleDark transition-colors"
                      >
                         <Save size={18} /> Save File
                      </button>
                   </div>
                 </>
              ) : (
                 <div className="flex-1 flex items-center justify-center text-charcoal-400">
                    Select a file to edit
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
