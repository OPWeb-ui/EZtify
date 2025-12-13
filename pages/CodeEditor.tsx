
import React, { useState, useCallback, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Code, Save, X, FilePlus, RefreshCw, PenTool, Terminal, Braces, Layers, Lock, Code2, Minus, Plus, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

// CodeMirror Imports
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { xml } from '@codemirror/lang-xml';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export const CodeEditorPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const { theme } = useTheme();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const handleFileUpload = async (uploadedFiles: File[]) => {
    let count = 0;
    let firstNewId = activeFileId;
    const newFilesToAdd: CodeFile[] = [];

    for (const file of uploadedFiles) {
       try {
         const text = await file.text();
         const ext = file.name.split('.').pop()?.toLowerCase() || 'text';
         const newFile: CodeFile = {
           id: Math.random().toString(36).substr(2, 9),
           name: file.name,
           content: text,
           language: ext
         };
         newFilesToAdd.push(newFile);
         if (!firstNewId) firstNewId = newFile.id;
         count++;
       } catch (e) {
         console.error(e);
       }
    }
    
    if (newFilesToAdd.length > 0) {
      setFiles(prev => [...prev, ...newFilesToAdd]);
      if (!activeFileId) setActiveFileId(firstNewId);
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
       }
    }
  }, [addToast, activeFileId]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    accept: { 'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.sql', '.yaml', '.yml', '.ini', '.cfg', '.env', '.gitignore'] }
  });
  
  const reset = () => {
    setFiles([]);
    setActiveFileId(null);
  };

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

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.min(Math.max(10, prev + delta), 32));
  };

  // Determine language extension
  const getExtensions = useMemo(() => {
      if (!activeFile) return [];
      const ext = activeFile.language;
      switch(ext) {
          case 'js':
          case 'jsx':
          case 'ts':
          case 'tsx':
              return [javascript({ jsx: true, typescript: true })];
          case 'html':
              return [html()];
          case 'css':
              return [css()];
          case 'json':
              return [json()];
          case 'md':
          case 'markdown':
              return [markdown()];
          case 'py':
              return [python()];
          case 'xml':
          case 'svg':
              return [xml()];
          default:
              return [];
      }
  }, [activeFile?.language]);

  const editorTheme = theme === 'dark' ? vscodeDark : githubLight;

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {files.length === 0 ? (
        <ToolLandingLayout
            title="Code Editor"
            description="Drag & drop snippets, config files, or code to edit with syntax highlighting."
            icon={<Terminal />}
            onDrop={onDrop}
            accept={{ 'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.sql', '.yaml', '.yml', '.ini', '.cfg', '.env', '.gitignore'] }}
            multiple={true}
            isProcessing={isProcessingFiles}
            accentColor="text-cyan-500"
            specs={[
              { label: "Syntax", value: "Highlighter", icon: <PenTool /> },
              { label: "Theme", value: "Auto-Switch", icon: <Layers /> },
              { label: "Privacy", value: "Local Only", icon: <Lock /> },
              { label: "Formats", value: "JS/HTML/CSS+", icon: <Braces /> },
            ]}
            tip="Perfect for quick edits to config files or reviewing code snippets without opening an IDE."
        />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden" {...getRootProps()}>
           <input {...getInputProps()} />
           {/* Sidebar File List */}
           <div className={`
                ${isMobile ? 'w-full h-auto max-h-64 border-b' : 'w-64 h-full border-r'} 
                bg-white dark:bg-[#252526] border-slate-200 dark:border-charcoal-700 flex flex-col shrink-0 z-10
           `}>
              <div className="p-4 border-b border-slate-200 dark:border-charcoal-700 font-bold flex items-center gap-2 text-charcoal-800 dark:text-white font-mono text-sm shrink-0">
                 <Code2 size={16} /> Open Files
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 {files.map(f => (
                   <div 
                     key={f.id}
                     onClick={(e) => { e.stopPropagation(); setActiveFileId(f.id); }}
                     className={`
                       px-3 py-2 rounded-lg text-xs font-mono cursor-pointer flex items-center justify-between group transition-colors select-none
                       ${activeFileId === f.id 
                         ? 'bg-cyan-50 text-cyan-700 font-bold dark:bg-cyan-900/30 dark:text-cyan-400' 
                         : 'text-charcoal-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2d2e]'}
                     `}
                   >
                     <span className="truncate">{f.name}</span>
                     <motion.button 
                       whileHover={{ scale: 1.1 }}
                       onClick={(e) => {
                         e.stopPropagation();
                         const nextFiles = files.filter(x => x.id !== f.id);
                         setFiles(nextFiles);
                         if (activeFileId === f.id) setActiveFileId(nextFiles.length > 0 ? nextFiles[0].id : null);
                       }}
                       className="p-1 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded opacity-60 group-hover:opacity-100 transition-all"
                     >
                       <X size={12} />
                     </motion.button>
                   </div>
                 ))}
              </div>
              
              <div className="p-3 border-t border-slate-200 dark:border-charcoal-700 shrink-0 space-y-2 bg-white dark:bg-[#252526]">
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
                    <button className="w-full py-2 bg-slate-100 dark:bg-[#333333] text-charcoal-700 dark:text-slate-300 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-[#444444] transition-colors">
                       <FilePlus size={14} /> Add File
                    </button>
                 </div>
                 <button onClick={reset} className="w-full py-2 bg-slate-100 dark:bg-[#333333] text-charcoal-700 dark:text-slate-300 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-[#444444] transition-colors">
                    <RefreshCw size={14} /> Reset
                 </button>
              </div>
           </div>

           {/* Editor Area */}
           <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
              {activeFile ? (
                 <>
                   {/* Editor Toolbar */}
                   <div className="h-10 border-b border-slate-200 dark:border-charcoal-700 bg-slate-50 dark:bg-[#252526] flex items-center justify-between px-3 shrink-0">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <span className="text-xs font-mono text-charcoal-500 dark:text-slate-400 truncate max-w-[200px]">{activeFile.name}</span>
                         <span className="text-[10px] bg-slate-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">{activeFile.language}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white dark:bg-charcoal-800 rounded-md border border-slate-200 dark:border-charcoal-600 p-0.5">
                              <button onClick={() => adjustFontSize(-2)} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded text-charcoal-500 dark:text-slate-400" title="Decrease Font Size">
                                  <Minus size={12} />
                              </button>
                              <div className="flex items-center gap-1 px-1 min-w-[3rem] justify-center border-l border-r border-slate-100 dark:border-charcoal-700/50">
                                  <Type size={10} className="text-charcoal-400 opacity-70" />
                                  <span className="text-[10px] font-mono text-charcoal-600 dark:text-slate-300">{fontSize}px</span>
                              </div>
                              <button onClick={() => adjustFontSize(2)} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-700 rounded text-charcoal-500 dark:text-slate-400" title="Increase Font Size">
                                  <Plus size={12} />
                              </button>
                          </div>
                      </div>
                   </div>

                   <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#1e1e1e]">
                      <CodeMirror
                        value={activeFile.content}
                        height="100%"
                        extensions={getExtensions}
                        onChange={updateFileContent}
                        theme={editorTheme}
                        className="text-sm h-full font-mono"
                        style={{ height: '100%', fontSize: `${fontSize}px` }}
                        basicSetup={{
                           lineNumbers: true,
                           highlightActiveLineGutter: true,
                           foldGutter: true,
                           indentOnInput: true,
                           bracketMatching: true,
                           closeBrackets: true,
                           autocompletion: true,
                           highlightSelectionMatches: true,
                        }}
                      />
                   </div>
                   {/* Action Bar */}
                   <div className="p-3 border-t border-slate-200 dark:border-charcoal-700 bg-slate-50 dark:bg-[#252526] flex justify-end items-center shrink-0">
                      <motion.button 
                        whileTap={buttonTap}
                        onClick={handleDownload}
                        className="px-4 py-2 bg-charcoal-900 dark:bg-cyan-600 text-white font-bold font-mono rounded-lg shadow-sm flex items-center gap-2 hover:bg-charcoal-800 dark:hover:bg-cyan-500 transition-colors text-xs"
                      >
                         <Save size={14} /> SAVE_FILE
                      </motion.button>
                   </div>
                 </>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-charcoal-400 dark:text-slate-500 bg-slate-50 dark:bg-[#1e1e1e] font-mono text-xs p-8 text-center select-none">
                    <Code size={48} className="mb-4 opacity-20" />
                    <p className="uppercase tracking-wider font-bold mb-2">No File Active</p>
                    <p className="opacity-60 max-w-xs">Select a file from the sidebar or drag and drop a new one to begin editing.</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
