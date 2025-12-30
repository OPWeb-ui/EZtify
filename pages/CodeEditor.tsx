
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { FileRejection, useDropzone } from 'react-dropzone';
import { 
  Code2, Save, X, FilePlus, RefreshCw, PenTool, Terminal, Layers, Lock, 
  Minus, Plus, FileCode, Download, ChevronDown, File as FileIcon, Menu,
  Wand2, Settings, FileText, ChevronRight, Hash, Activity, HardDrive,
  Monitor, Layout, Type, Cpu, BarChart3, Play, Check, Loader2, Zap, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
/* Fixed: Removed techEase and added motionTokens */
import { buttonTap, modalContentVariants, motionTokens, standardLayoutTransition } from '../utils/animations';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { IconBox } from '../components/IconBox';
import { EZButton } from '../components/EZButton';
import { MobileFloatingToolbar } from '../components/MobileFloatingToolbar';
import { EZSlider } from '../components/EZSlider';
import { EZSegmentedControl } from '../components/EZSegmentedControl';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { xml } from '@codemirror/lang-xml';
import { githubLight } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';
import { UploadArea } from '../components/UploadArea';

const ACCENT_COLOR = "#7C3AED"; // Brand Violet

interface CodeFile {
  id: string; 
  name: string; 
  content: string; 
  language: string;
  size: number;
}

const BatchProgressOverlay: React.FC<{ progress: number; status: string; currentFile: number; totalFiles: number; isVisible: boolean }> = ({ progress, status, currentFile, totalFiles, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-nd-base/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm bg-nd-surface rounded-[2.5rem] shadow-2xl p-8 border border-nd-border flex flex-col items-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6"
            >
              <IconBox icon={<Terminal />} size="xl" toolAccentColor={ACCENT_COLOR} active />
            </motion.div>
            
            <div className="w-full text-center mb-6">
              <h2 className="text-xl font-bold text-nd-primary">Indexing Workspace</h2>
              <p className="text-xs text-nd-muted font-mono mt-1 truncate max-w-full">
                {status || 'Parsing source...'}
              </p>
            </div>
            
            <div className="w-full h-1.5 bg-nd-subtle rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-violet-600" 
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>
            
            <div className="w-full flex justify-between items-center text-[10px] font-mono font-bold text-nd-muted mt-2 uppercase tracking-widest">
              <span>{currentFile} / {totalFiles} Files</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CodeEditorPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // State
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ progress: 0, status: '', currentFile: 0, totalFiles: 0 });
  
  // Config
  const [fontSize, setFontSize] = useState(14);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    setIsProcessing(true);
    let count = 0;
    let firstNewId: string | null = null;
    const newFilesToAdd: CodeFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
       const file = uploadedFiles[i];
       setProgressState({ progress: (i / uploadedFiles.length) * 100, status: `Reading ${file.name}`, currentFile: i + 1, totalFiles: uploadedFiles.length });
       
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
       } catch (e) { console.error(`Failed to read file: ${file.name}`, e); }
    }
    
    setFiles(prev => [...prev, ...newFilesToAdd]);
    if (!activeFileId && firstNewId) setActiveFileId(firstNewId);
    
    setIsProcessing(false);
    if (count > 0) addToast("Success", `Mounted ${count} files to workspace.`, "success");
  }, [activeFileId, addToast]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) addToast("Error", "Unsupported stream detected.", "error");
    if (acceptedFiles.length > 0) handleFileUpload(acceptedFiles);
  }, [handleFileUpload, addToast]);

  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop, 
    noClick: true, 
    noKeyboard: true, 
    multiple: true, 
    accept: { 'text/*': [], 'application/json': ['.json'], 'image/svg+xml': ['.svg'] }, 
    disabled: isProcessing 
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFileUpload(Array.from(e.target.files));
    if (e.target) e.target.value = '';
  };
  
  const handleReset = () => { 
    setFiles([]); 
    setActiveFileId(null); 
  };
  
  const activeFile = files.find(f => f.id === activeFileId);

  const updateFileContent = (newContent: string) => {
    if (activeFileId) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent, size: new Blob([newContent]).size } : f));
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Success", "File saved to device.", "success");
  };

  const closeFile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const nextFiles = files.filter(x => x.id !== id);
      setFiles(nextFiles);
      if (activeFileId === id) setActiveFileId(nextFiles.length > 0 ? nextFiles[0].id : null);
  };

  const getExtensions = useMemo(() => {
    const langExtensions: any[] = [EditorView.lineWrapping];
    
    // Technical Note: In CodeMirror 6, dynamic font styles must be applied via a theme extension.
    // This allows the editor to react to the 'fontSize' state changes in real-time.
    const dynamicTheme = EditorView.theme({
      "&": { 
        height: "100%", 
        fontSize: `${fontSize}px`, 
        backgroundColor: "transparent !important" 
      },
      ".cm-scroller": { 
        overflow: "auto", 
        fontFamily: "'JetBrains Mono', monospace" 
      },
      ".cm-gutters": { 
        backgroundColor: "transparent", 
        borderRight: "none", 
        color: "var(--text-muted)" 
      },
      ".cm-content": { 
        padding: "20px 0" 
      },
      ".cm-line": { 
        padding: "0 24px" 
      },
      ".cm-activeLine": { 
        backgroundColor: "rgba(124, 58, 237, 0.05)" // Violet active line
      },
      ".cm-activeLineGutter": { 
        backgroundColor: "rgba(124, 58, 237, 0.1)" 
      }
    });

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
    return [dynamicTheme, ...langExtensions];
  }, [activeFile?.language, fontSize]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = useMemo(() => {
      const totalChars = files.reduce((acc, f) => acc + f.content.length, 0);
      const totalLines = files.reduce((acc, f) => acc + f.content.split('\n').length, 0);
      const totalVolume = files.reduce((acc, f) => acc + f.size, 0);
      return { totalChars, totalLines, totalVolume };
  }, [files]);

  const isWorkspaceEmpty = files.length === 0;

  // --- DESKTOP RENDER: STUDIO INTERFACE ---
  if (!isMobile) {
    return (
      <div className="flex w-full h-full font-sans overflow-hidden relative p-4 md:p-6 gap-6" {...getRootProps()}>
        <PageReadyTracker />
        <BatchProgressOverlay isVisible={isProcessing} progress={progressState.progress} status={progressState.status} currentFile={progressState.currentFile} totalFiles={progressState.totalFiles} />
        <input ref={fileInputRef} type="file" multiple className="hidden" accept="text/*,application/json,.svg" onChange={handleFileChange} />
        <DragDropOverlay isDragActive={isDragActive} message="Append Code Stream" variant="violet" />

        {/* 1. MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-nd-surface/60 dark:bg-nd-surface/40 backdrop-blur-xl rounded-[2.5rem] border border-nd-border shadow-2xl overflow-hidden">
          
          <div className="h-20 shrink-0 px-6 flex items-center justify-between border-b border-nd-border bg-nd-surface/30">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 mr-4 py-2">
               {files.map(f => (
                 <button 
                   key={f.id}
                   onClick={() => setActiveFileId(f.id)}
                   className={`flex items-center gap-2 h-10 px-4 rounded-xl border transition-all duration-300 shrink-0 ${activeFileId === f.id ? 'bg-nd-surface border-violet-500/30 shadow-md text-nd-primary font-bold ring-2 ring-violet-500/10' : 'bg-transparent border-transparent text-nd-muted hover:text-nd-secondary'}`}
                 >
                    <FileIcon size={14} className={activeFileId === f.id ? 'text-violet-600' : 'opacity-40'} />
                    <span className="text-xs font-mono truncate max-w-[150px]">{f.name}</span>
                    <button 
                      onClick={(e) => closeFile(e, f.id)}
                      className={`p-1 rounded-md hover:bg-rose-500 hover:text-white transition-all ${activeFileId === f.id ? 'opacity-40' : 'opacity-0'}`}
                    >
                        <X size={10} />
                    </button>
                 </button>
               ))}
            </div>
            <div className="flex items-center gap-3 shrink-0">
               <EZButton variant="tertiary" size="sm" onClick={handleReset} disabled={isWorkspaceEmpty} icon={<RefreshCw size={14}/>}>Clear</EZButton>
               <EZButton variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} icon={<Plus size={14}/>}>{isWorkspaceEmpty ? 'Add Files' : 'Open'}</EZButton>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-transparent">
             <div className="absolute inset-0 pointer-events-none opacity-[0.01] z-0" 
                  style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
             />

             {isWorkspaceEmpty ? (
                <div className="h-full flex items-center justify-center p-8">
                    <UploadArea onDrop={(files) => handleFileUpload(files)} mode="code-editor" accept={{ 'text/*': [], 'application/json': ['.json'], 'image/svg+xml': ['.svg'] }} multiple={true} isProcessing={isProcessing} />
                </div>
             ) : activeFile ? (
               <div className="h-full relative z-10 overscroll-contain">
                  <CodeMirror 
                    value={activeFile.content} 
                    extensions={getExtensions} 
                    onChange={updateFileContent} 
                    theme={githubLight} 
                    className="h-full editor-full-height" 
                    basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true, highlightActiveLine: true }} 
                  />
               </div>
             ) : null}
          </div>

          <div className="h-10 bg-nd-subtle/20 border-t border-nd-border/30 flex items-center justify-between px-8 text-[10px] font-mono text-nd-muted shrink-0 select-none">
             <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <Monitor size={10} />
                  {activeFile ? activeFile.language.toUpperCase() : 'NONE'}
                </span>
                {activeFile && (
                  <span className="opacity-60">Lines: {activeFile.content.split('\n').length}</span>
                )}
             </div>
             <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-violet-600 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  READY
                </span>
             </div>
          </div>
        </div>

        {/* 2. INSPECTOR PANEL */}
        <div className="w-96 shrink-0 h-full flex flex-col pointer-events-none relative z-20">
            <div className="flex-1 bg-nd-surface/80 dark:bg-nd-surface/50 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-nd-border flex flex-col overflow-hidden pointer-events-auto">
                <div className="h-20 border-b border-nd-border flex items-center justify-between px-8 shrink-0 bg-violet-500/5">
                    <div className="flex items-center gap-3">
                        <IconBox icon={<Settings />} size="xs" active toolAccentColor={ACCENT_COLOR} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-900/60 dark:text-violet-400/60 font-mono">Control Panel</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {/* Metrics Module */}
                    <div className="bg-nd-subtle/50 rounded-[2rem] p-8 border border-nd-border">
                        <div className="flex items-center gap-3 mb-6 text-nd-muted">
                            <IconBox icon={<BarChart3 />} size="xs" variant="transparent" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-mono">Telemetry</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <span className="block text-[10px] font-bold text-nd-muted uppercase mb-1.5 opacity-60">Volume</span>
                                <span className="text-xl font-bold text-violet-600 font-mono tracking-tighter">{formatSize(stats.totalVolume)}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-nd-muted uppercase mb-1.5 opacity-60">Lines</span>
                                <span className="text-xl font-bold text-nd-primary font-mono tracking-tighter">{stats.totalLines.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-nd-muted uppercase font-mono">
                                <span className="opacity-60">Buffer Load</span>
                                <span>{Math.min(100, Math.round(stats.totalVolume / (10 * 1024 * 1024) * 100))}%</span>
                            </div>
                            <div className="h-2 bg-nd-border/50 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-violet-600 shadow-[0_0_12px_rgba(124,58,237,0.6)]" 
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min(100, (stats.totalVolume / (10 * 1024 * 1024) * 100))}%` }} 
                                /* Fixed: Replaced techEase with motionTokens.ease.out */
                                transition={{ duration: 1.2, ease: motionTokens.ease.out }}
                            />
                            </div>
                        </div>
                    </div>

                    {/* Typography Config */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 px-1">
                            <IconBox icon={<Type />} size="xs" active toolAccentColor={ACCENT_COLOR} />
                            <span className="text-[12px] font-bold uppercase tracking-wider text-nd-secondary font-mono">Typography</span>
                        </div>
                        <div className="p-4 bg-nd-subtle rounded-2xl border border-nd-border">
                            <EZSlider 
                                label="Font Size"
                                value={fontSize}
                                min={10} max={32} suffix="px"
                                onChange={setFontSize}
                            />
                        </div>
                        <p className="text-[10px] text-nd-muted leading-relaxed px-1">
                          Syntactic rendering is handled via WASM-based parsers. Changes to typography apply globally across all active buffers.
                        </p>
                    </div>
                </div>

                <div className="p-8 border-t border-nd-border/50 bg-nd-subtle/20">
                    <EZButton 
                        variant="primary" 
                        fullWidth 
                        size="lg" 
                        onClick={handleDownload} 
                        disabled={!activeFile} 
                        icon={<Save size={20} />}
                        className="shadow-xl !bg-violet-600 hover:!bg-violet-700 shadow-violet-500/20 h-16 rounded-[1.5rem] tracking-widest text-sm"
                    >
                        COMMIT & SAVE
                    </EZButton>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- MOBILE LAYOUT ---
  return (
    <div className="relative h-full w-full bg-nd-base overflow-hidden" {...getRootProps()}>
        <PageReadyTracker />
        <BatchProgressOverlay isVisible={isProcessing} progress={progressState.progress} status={progressState.status} currentFile={progressState.currentFile} totalFiles={progressState.totalFiles} />
        <DragDropOverlay isDragActive={isDragActive} message="Add Source" variant="violet" />
        <input ref={fileInputRef} type="file" multiple className="hidden" accept="text/*,application/json,.svg" onChange={handleFileChange} />
        
        <div className="absolute inset-0 z-0 overflow-y-auto pt-24 pb-32 px-4 touch-pan-y custom-scrollbar">
            {isWorkspaceEmpty ? (
                <div className="h-full flex items-center justify-center p-8">
                    <UploadArea onDrop={(files) => handleFileUpload(files)} mode="code-editor" accept={{ 'text/*': [], 'application/json': ['.json'], 'image/svg+xml': ['.svg'] }} multiple={true} isProcessing={isProcessing} />
                </div>
            ) : (
                <>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {files.map(f => (
                        <motion.div
                          key={f.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => { setActiveFileId(f.id); setIsSettingsOpen(false); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border mb-3 transition-all ${activeFileId === f.id ? 'bg-violet-50 border-violet-500/20 ring-1 ring-violet-500/10' : 'bg-nd-surface border-nd-border'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeFileId === f.id ? 'bg-violet-600 text-white' : 'bg-nd-subtle text-nd-muted border-nd-border'}`}>
                            <FileCode size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-nd-primary font-mono truncate">{f.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-nd-muted mt-0.5 uppercase tracking-tighter">
                              <span>{formatSize(f.size)}</span>
                              <div className="w-1 h-1 rounded-full bg-nd-border" />
                              <span>{f.language}</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); closeFile(e, f.id); }} className="p-2 text-nd-muted hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div onClick={() => fileInputRef.current?.click()} className="h-20 border-2 border-dashed border-nd-border rounded-2xl flex items-center justify-center gap-2 text-nd-muted active:scale-95 transition-transform cursor-pointer bg-nd-surface/50">
                        <FilePlus size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider">Mount Source</span>
                    </div>
                </>
            )}
        </div>

        {!isWorkspaceEmpty && (
            <>
                <MobileFloatingToolbar>
                    <div className="flex items-center gap-2">
                        <IconBox icon={<Terminal />} size="xs" toolAccentColor={ACCENT_COLOR} active />
                        <span className="font-bold text-sm text-nd-primary">Code Editor</span>
                    </div>
                    <button onClick={handleReset} className="text-xs font-bold text-nd-muted">Reset</button>
                </MobileFloatingToolbar>

                <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-nd-surface/90 backdrop-blur-xl border-t border-nd-border px-4 pb-6 pt-3 z-20 flex items-center justify-between gap-4">
                    <div className="flex flex-col justify-center flex-1">
                       <span className="text-[10px] font-bold text-nd-muted uppercase tracking-wider">Workspace</span>
                       <span className="text-sm font-bold text-nd-primary font-mono">{files.length} Buffers Active</span>
                    </div>

                    <div className="flex items-center gap-3">
                       <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full bg-nd-subtle flex items-center justify-center text-nd-primary transition-all"><Settings size={20} /></button>
                       <button onClick={handleDownload} disabled={!activeFile} className="h-10 px-6 rounded-full bg-violet-600 text-white font-bold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50">
                          <Save size={16} />
                          <span>Save</span>
                       </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isSettingsOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setIsSettingsOpen(false)} />
                            <motion.div variants={modalContentVariants} initial="hidden" animate="visible" exit="exit" className="absolute bottom-0 left-0 right-0 bg-nd-surface rounded-t-[32px] z-40 p-6 pb-[env(safe-area-inset-bottom)] shadow-2xl space-y-6">
                                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-nd-primary">Interface Config</h3><button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-nd-subtle rounded-full"><X size={18} /></button></div>
                                <div className="space-y-6">
                                    <EZSlider label="Font Size" value={fontSize} min={10} max={32} suffix="px" onChange={setFontSize} />
                                    <div className="p-4 bg-nd-subtle rounded-2xl border border-nd-border space-y-2">
                                        <span className="text-[10px] font-bold text-nd-muted uppercase block">Active Meta</span>
                                        <div className="flex justify-between text-xs font-mono font-bold">
                                            <span>Chars:</span> <span>{activeFile?.content.length.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-mono font-bold">
                                            <span>Lines:</span> <span>{activeFile?.content.split('\n').length.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <EZButton fullWidth variant="secondary" onClick={() => setIsSettingsOpen(false)} className="mt-4">Confirm Settings</EZButton>
                                <EZButton fullWidth variant="destructive" onClick={handleReset}>Flush All Buffers</EZButton>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </>
        )}

        <style>{`
            .editor-full-height .cm-editor {
                height: 100%;
            }
        `}</style>
    </div>
  );
};
