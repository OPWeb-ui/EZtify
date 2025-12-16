
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { FileRejection, useDropzone } from 'react-dropzone';
import { 
  Code, Save, X, FilePlus, RefreshCw, PenTool, Terminal, Braces, Layers, Lock, 
  Code2, Minus, Plus, Type, FileCode, Download, FolderOpen, Search, 
  ChevronDown, ChevronRight, File as FileIcon, LayoutTemplate, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { xml } from '@codemirror/lang-xml';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';

// Custom theme for full height containment
const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px"
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "'JetBrains Mono', monospace"
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
    color: "#6e7681"
  },
  ".cm-lineNumbers .cm-gutterElement": {
    paddingLeft: "12px",
    paddingRight: "12px"
  }
});

interface CodeFile {
  id: string; 
  name: string; 
  content: string; 
  language: string;
  size: number;
}

export const CodeEditorPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const { theme } = useTheme();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [lineCount, setLineCount] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MOBILE HINT ---
  useEffect(() => {
    if (isMobile && files.length > 0) {
      const hasSeenHint = localStorage.getItem('eztify-desktop-hint-toast');
      if (!hasSeenHint) {
        const timer = setTimeout(() => {
          addToast("Desktop Optimized", "For complex coding, desktop offers a full IDE experience.", "info");
          localStorage.setItem('eztify-desktop-hint-toast', 'true');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMobile, files.length, addToast]);

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    if (isProcessingFiles) return 0;
    setIsProcessingFiles(true);

    let count = 0;
    let firstNewId = null;
    const newFilesToAdd: CodeFile[] = [];

    for (const file of uploadedFiles) {
       try {
         const text = await file.text();
         const ext = file.name.split('.').pop()?.toLowerCase() || 'text';
         const newFile: CodeFile = { 
             id: Math.random().toString(36).substr(2, 9), 
             name: file.name, 
             content: text, 
             language: ext,
             size: file.size
         };
         newFilesToAdd.push(newFile);
         if (!firstNewId) firstNewId = newFile.id;
         count++;
       } catch (e) { console.error(e); }
    }
    
    if (newFilesToAdd.length > 0) {
      setFiles(prev => [...prev, ...newFilesToAdd]);
      if (!activeFileId) setActiveFileId(firstNewId);
    }
    
    setIsProcessingFiles(false);
    if (count > 0) addToast("Success", `Opened ${count} files.`, "success");

    return count;
  }, [activeFileId, addToast, isProcessingFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) addToast("Invalid File", "Only text files allowed.", "error");
    if (acceptedFiles.length > 0) {
       await handleFileUpload(acceptedFiles);
    }
  }, [addToast, handleFileUpload]);

  const { getRootProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true, multiple: true, accept: { 'text/*': [] }, disabled: isProcessingFiles });
  
  const handleAddFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };
  
  const reset = () => { setFiles([]); setActiveFileId(null); };
  
  const activeFile = files.find(f => f.id === activeFileId);

  // Update line count for status bar
  useEffect(() => {
      if (activeFile) {
          setLineCount(activeFile.content.split('\n').length);
      } else {
          setLineCount(0);
      }
  }, [activeFile]);

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

  const closeFile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const nextFiles = files.filter(x => x.id !== id);
      setFiles(nextFiles);
      if (activeFileId === id) setActiveFileId(nextFiles.length > 0 ? nextFiles[0].id : null);
  };

  const adjustFontSize = (delta: number) => setFontSize(prev => Math.min(Math.max(10, prev + delta), 32));

  const getExtensions = useMemo(() => {
    const langExtensions: any[] = [];
    if (activeFile) {
      switch(activeFile.language) {
        case 'js': case 'jsx': case 'ts': case 'tsx': langExtensions.push(javascript({ jsx: true, typescript: true })); break;
        case 'html': langExtensions.push(html()); break;
        case 'css': langExtensions.push(css()); break;
        case 'json': langExtensions.push(json()); break;
        case 'md': case 'markdown': langExtensions.push(markdown()); break;
        case 'py': langExtensions.push(python()); break;
        case 'xml': case 'svg': langExtensions.push(xml()); break;
      }
    }
    return [editorTheme, ...langExtensions];
  }, [activeFile?.language]);

  if (files.length === 0) {
    return (
      <ToolLandingLayout
          title="Code Editor"
          description="A lightweight, secure code editor for your browser. Syntax highlighting for 20+ languages."
          icon={<Terminal />}
          onDrop={(files) => onDrop(files, [])}
          accept={{ 'text/*': [] }}
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
    );
  }

  // --- IDE LAYOUT ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
       <PageReadyTracker />
       <DragDropOverlay isDragActive={isDragActive} message="OPEN_FILES" subMessage="ADD_TO_WORKSPACE" variant="cyan" icon={<FileCode size={64} />} />
       <input ref={fileInputRef} type="file" multiple className="hidden" accept="text/*" onChange={handleFileChange} disabled={isProcessingFiles} />
       
       {/* 1. SIDEBAR: EXPLORER */}
       <div className={`${isMobile ? 'hidden' : 'flex'} w-64 bg-slate-50 dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex-col shrink-0 z-20`}>
          {/* Header */}
          <div className="h-10 px-4 flex items-center justify-between text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest bg-slate-100 dark:bg-charcoal-850">
              <span>Explorer</span>
              <button onClick={reset} title="Close All"><MoreHorizontal size={14} /></button>
          </div>

          {/* Section Header */}
          <div className="px-2 py-2 flex items-center gap-1 text-xs font-bold text-charcoal-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-charcoal-800">
              <ChevronDown size={14} />
              <span className="uppercase font-mono">Open Editors</span>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
             {files.map(f => (
               <div 
                 key={f.id} 
                 onClick={() => setActiveFileId(f.id)} 
                 className={`
                   group flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors
                   ${activeFileId === f.id 
                     ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 font-medium' 
                     : 'text-charcoal-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-charcoal-800'}
                 `}
               >
                 <FileIcon size={14} className={activeFileId === f.id ? 'text-cyan-500' : 'text-charcoal-400'} />
                 <span className="truncate flex-1 font-mono">{f.name}</span>
                 {activeFileId === f.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                 <button 
                    onClick={(e) => closeFile(e, f.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-charcoal-700 rounded text-charcoal-500"
                 >
                    <X size={12} />
                 </button>
               </div>
             ))}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-charcoal-800 space-y-2 bg-slate-50 dark:bg-charcoal-900">
             <button onClick={handleAddFileClick} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 text-xs font-bold font-mono transition-transform active:scale-95">
                <FilePlus size={14} /> NEW FILE
             </button>
          </div>
       </div>

       {/* 2. MAIN: EDITOR */}
       <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] relative">
          
          {/* Editor Header / Tabs */}
          {activeFile ? (
             <div className="h-10 flex items-center justify-between bg-slate-100 dark:bg-[#252526] border-b border-slate-200 dark:border-black/20 shrink-0">
                {/* Tab */}
                <div className="flex h-full">
                   <div className="h-full px-4 flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border-r border-slate-200 dark:border-black/20 border-t-2 border-t-cyan-500 min-w-[150px] max-w-[250px]">
                      <FileCode size={14} className="text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs text-charcoal-800 dark:text-slate-200 font-medium truncate flex-1">{activeFile.name}</span>
                      <button onClick={(e) => closeFile(e, activeFile.id)} className="text-charcoal-400 hover:text-rose-500"><X size={14} /></button>
                   </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 pr-4">
                   <div className="flex items-center bg-white dark:bg-[#333333] rounded-md border border-slate-200 dark:border-transparent p-0.5">
                      <button onClick={() => adjustFontSize(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-[#444444] rounded text-charcoal-500 dark:text-slate-400" title="Decrease Font"><Minus size={12} /></button>
                      <span className="text-[10px] font-mono px-2 min-w-[2rem] text-center text-charcoal-600 dark:text-slate-300">{fontSize}</span>
                      <button onClick={() => adjustFontSize(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-[#444444] rounded text-charcoal-500 dark:text-slate-400" title="Increase Font"><Plus size={12} /></button>
                   </div>
                   
                   <motion.button 
                      whileTap={buttonTap} 
                      onClick={handleDownload}
                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-[#333333] text-charcoal-600 dark:text-slate-300 transition-colors"
                      title="Save File"
                   >
                      <Save size={16} />
                   </motion.button>
                </div>
             </div>
          ) : (
             <div className="h-10 bg-slate-100 dark:bg-[#252526] border-b border-slate-200 dark:border-black/20" />
          )}

          {/* Editor Body */}
          <div className="flex-1 relative overflow-hidden">
             {activeFile ? (
                <CodeMirror 
                  value={activeFile.content} 
                  extensions={getExtensions} 
                  onChange={updateFileContent} 
                  theme={theme === 'dark' ? vscodeDark : githubLight} 
                  className="h-full text-sm" 
                  style={{ fontSize: `${fontSize}px`, height: '100%' }} 
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
             ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-400 dark:text-slate-600 bg-slate-50/50 dark:bg-[#1e1e1e]">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-[#252526] rounded-full flex items-center justify-center mb-6">
                      <Code size={48} className="opacity-50" />
                   </div>
                   <h3 className="text-sm font-bold uppercase tracking-widest mb-2">No Editor Active</h3>
                   <div className="flex gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-[#333333] px-1.5 rounded">⌘ O</span> to open</span>
                      <span className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-[#333333] px-1.5 rounded">⌘ N</span> to create</span>
                   </div>
                </div>
             )}
          </div>

          {/* 3. STATUS BAR */}
          <div className="h-6 bg-cyan-600 dark:bg-cyan-700 text-white flex items-center justify-between px-3 text-[10px] font-mono shrink-0 select-none">
             <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Terminal size={10} /> READY</span>
                {activeFile && (
                    <span>Ln {lineCount}, Col 1</span>
                )}
             </div>
             
             <div className="flex items-center gap-4">
                {activeFile ? (
                    <>
                        <span>UTF-8</span>
                        <span>{activeFile.language.toUpperCase()}</span>
                        <span>{(activeFile.size / 1024).toFixed(2)} KB</span>
                    </>
                ) : (
                    <span>EZTIFY EDITOR v1.0</span>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};
