
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { ZipFile } from '../types';
import { generateGenericZip } from '../services/genericZipService';
import { createEncryptedZip } from '../services/zipEncryption';
import { nanoid } from 'nanoid';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  Archive, File as FileIcon, X, Lock, Download, FilePlus, RefreshCw, 
  Eye, EyeOff, FileText, Image as ImageIcon, Video, Music, Code, 
  Settings, FolderArchive, ShieldCheck, Trash2, Package, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase, modalContentVariants } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { Loader2 } from 'lucide-react';
import { IconBox } from '../components/IconBox';

export const ZipFilesPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  const [files, setFiles] = useState<ZipFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const [activeMobileSheet, setActiveMobileSheet] = useState<'none' | 'files' | 'settings'>('none');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processDroppedFiles = useCallback((uploadedFiles: File[]) => {
    if (isProcessingFiles || isGenerating) return;

    const validNewFiles: ZipFile[] = uploadedFiles.map(f => ({
      id: nanoid(),
      file: f
    }));

    if (validNewFiles.length > 0) {
      setIsProcessingFiles(true);
      setTimeout(() => {
        setFiles(prev => [...prev, ...validNewFiles]);
        setIsProcessingFiles(false);
        addToast("Success", `Added ${validNewFiles.length} files.`, "success");
      }, 300);
    }
  }, [addToast, isProcessingFiles, isGenerating]);
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
          addToast("Error", "Invalid files detected.", "error");
          return;
      }
      processDroppedFiles(acceptedFiles);
  }, [processDroppedFiles, addToast]);
  
  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    disabled: isProcessingFiles || isGenerating
  });

  const handleAddFilesClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processDroppedFiles(Array.from(e.target.files));
    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleZip = async () => {
    if (files.length === 0) return;
    
    if (useEncryption && !password) {
        addToast("Error", "Please enter a password.", "error");
        if (isMobile) setActiveMobileSheet('settings');
        return;
    }

    setIsGenerating(true);
    try {
      let blob;
      if (useEncryption && password) {
          blob = await createEncryptedZip(files, password, setProgress);
      } else {
          blob = await generateGenericZip(files, 'DEFLATE', setProgress, setStatus);
      }
      
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

  const reset = () => {
    setFiles([]);
    setUseEncryption(false);
    setPassword('');
    setProgress(0);
    setStatus('');
    setIsGenerating(false);
    setActiveMobileSheet('none');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    let icon = <FileIcon />;
    let color = 'text-slate-400';

    if (['pdf'].includes(ext!)) { icon = <FileText />; color = 'text-rose-500'; }
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext!)) { icon = <ImageIcon />; color = 'text-blue-500'; }
    else if (['mp4', 'mov', 'avi'].includes(ext!)) { icon = <Video />; color = 'text-purple-500'; }
    else if (['mp3', 'wav'].includes(ext!)) { icon = <Music />; color = 'text-pink-500'; }
    else if (['js', 'ts', 'html', 'css', 'json'].includes(ext!)) { icon = <Code />; color = 'text-cyan-500'; }
    else if (['zip', 'rar', '7z'].includes(ext!)) { icon = <Archive />; color = 'text-amber-500'; }

    return React.cloneElement(icon as React.ReactElement, { className: color, size: 20 });
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((acc, curr) => acc + curr.file.size, 0);

  if (files.length === 0) {
    return (
      <ToolLandingLayout
        title="Zip Files"
        description="Create optimized ZIP archives securely in your browser."
        icon={<FolderArchive />}
        onDrop={(files) => processDroppedFiles(files)}
        multiple={true}
        isProcessing={isProcessingFiles}
        accentColor="#F59E0B"
        specs={[
          { label: "Privacy", value: "Local", icon: <ShieldCheck /> },
          { label: "Security", value: "AES-256", icon: <Lock /> },
        ]}
      />
    );
  }

  // DESKTOP: File Manager Layout
  if (!isMobile) {
      return (
        <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
            <PageReadyTracker />
            <DragDropOverlay isDragActive={isDragActive} message="Add Files to Archive" variant="amber" />
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} disabled={isProcessingFiles || isGenerating} />

            {/* Main Content: File List */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 relative z-10">
                <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Archive Manager</h2>
                            <p className="text-[10px] text-charcoal-500 font-mono">{files.length} items • {formatSize(totalSize)}</p>
                        </div>
                    </div>
                    <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors">
                        <FilePlus size={14} /> Add Files
                    </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-charcoal-850 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">Name</th>
                                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400 text-right">Size</th>
                                <th className="px-6 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-charcoal-800">
                            {files.map((file) => (
                                <tr key={file.id} className="group hover:bg-slate-50 dark:hover:bg-charcoal-800/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0">{getFileIcon(file.file.name)}</div>
                                            <span className="text-sm font-medium text-charcoal-900 dark:text-slate-200 truncate max-w-md block">{file.file.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className="text-xs font-mono text-charcoal-500 dark:text-charcoal-400">{formatSize(file.file.size)}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={() => removeFile(file.id)}
                                            className="p-1.5 text-charcoal-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sidebar: Settings & Actions */}
            <div className="w-80 bg-slate-50 dark:bg-charcoal-950 flex flex-col shrink-0 z-20">
                <div className="h-16 px-6 border-b border-slate-200 dark:border-charcoal-800 flex items-center shrink-0">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300 flex items-center gap-2">
                        <Settings size={14} /> Configuration
                    </span>
                </div>

                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                    {/* Compression Info */}
                    <div className="p-4 bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-charcoal-500 dark:text-charcoal-400">
                            <HardDrive size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Output</span>
                        </div>
                        <div className="text-2xl font-bold text-charcoal-900 dark:text-white font-mono">
                            ZIP
                        </div>
                        <div className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                            Standard Deflate Compression
                        </div>
                    </div>

                    {/* Encryption */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">Encryption</label>
                            <button 
                                onClick={() => setUseEncryption(!useEncryption)}
                                className={`relative w-9 h-5 rounded-full transition-colors ${useEncryption ? 'bg-amber-500' : 'bg-slate-300 dark:bg-charcoal-700'}`}
                            >
                                <motion.div 
                                    className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                    animate={{ x: useEncryption ? 16 : 0 }}
                                    transition={techEase}
                                />
                            </button>
                        </div>
                        
                        <AnimatePresence>
                            {useEncryption && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative">
                                        <input 
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full h-10 pl-3 pr-10 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"
                                        >
                                            {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500/80 mt-2 flex items-center gap-1">
                                        <Lock size={10} /> AES-256 Encryption enabled
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shrink-0 space-y-3">
                    <motion.button
                        whileTap={buttonTap}
                        onClick={handleZip}
                        disabled={isGenerating || files.length === 0}
                        className="
                            w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                            rounded-xl font-bold font-mono text-xs uppercase tracking-wide
                            shadow-lg hover:shadow-xl hover:bg-amber-500 dark:hover:bg-amber-100 transition-all 
                            disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2
                        "
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        <span>{isGenerating ? 'Archiving...' : 'Download ZIP'}</span>
                    </motion.button>
                    
                    <motion.button whileTap={buttonTap} onClick={reset} className="w-full py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw size={12} /> Start Over
                    </motion.button>
                </div>
            </div>
        </div>
      );
  }

  // --- MOBILE LAYOUT (Unchanged) ---
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-charcoal-950 overflow-hidden relative" {...getRootProps()}>
        <PageReadyTracker />
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} disabled={isProcessingFiles || isGenerating} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white dark:bg-charcoal-900 rounded-3xl shadow-xl border border-slate-100 dark:border-charcoal-800 p-8 text-center"
            >
                <div className="flex justify-center mb-6">
                   <IconBox icon={<Package />} size="xl" variant="warning" />
                </div>
                
                <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-1">
                    {files.length} Files
                </h2>
                <p className="text-sm font-mono text-charcoal-500 dark:text-charcoal-400 mb-8">
                    {formatSize(totalSize)} Total
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button 
                        whileTap={buttonTap}
                        onClick={() => setActiveMobileSheet('files')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
                    >
                        <FileText size={20} className="text-charcoal-400" />
                        <span className="text-xs font-bold text-charcoal-600 dark:text-slate-300">Review Files</span>
                    </motion.button>
                    <motion.button 
                        whileTap={buttonTap}
                        onClick={() => setActiveMobileSheet('settings')}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors"
                    >
                        <Settings size={20} className="text-charcoal-400" />
                        <span className="text-xs font-bold text-charcoal-600 dark:text-slate-300">Options</span>
                    </motion.button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-charcoal-400 cursor-pointer" onClick={reset}>
                    <RefreshCw size={12} />
                    <span>Start Over</span>
                </div>
            </motion.div>
        </div>

        <div className="p-4 bg-white dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 pb-[env(safe-area-inset-bottom)]">
            <motion.button
                whileTap={buttonTap}
                onClick={handleZip}
                disabled={isGenerating}
                className="w-full h-14 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                <span>{isGenerating ? 'Processing...' : 'Create ZIP Archive'}</span>
            </motion.button>
        </div>

        <AnimatePresence>
            {activeMobileSheet !== 'none' && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setActiveMobileSheet('none')}
                    />
                    <motion.div 
                        variants={modalContentVariants}
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="relative w-full bg-white dark:bg-charcoal-900 rounded-t-[32px] shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] pb-[env(safe-area-inset-bottom)]"
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-charcoal-800">
                            <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                                {activeMobileSheet === 'files' ? 'Manage Files' : 'Archive Settings'}
                            </h3>
                            <button onClick={() => setActiveMobileSheet('none')} className="p-2 bg-slate-100 dark:bg-charcoal-800 rounded-full text-charcoal-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeMobileSheet === 'files' ? (
                                <div className="space-y-4">
                                    <button onClick={handleAddFilesClick} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-charcoal-700 rounded-xl text-charcoal-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-charcoal-800 transition-colors">
                                        <FilePlus size={18} /> Add More Files
                                    </button>
                                    {files.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-charcoal-800 rounded-xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="shrink-0">
                                                    <IconBox icon={getFileIcon(file.file.name)} size="xs" variant="ghost" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-charcoal-900 dark:text-white truncate">{file.file.name}</div>
                                                    <div className="text-xs font-mono text-charcoal-500">{formatSize(file.file.size)}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(file.id)} className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <IconBox 
                                                icon={useEncryption ? <Lock /> : <ShieldCheck />} 
                                                size="sm" 
                                                variant={useEncryption ? 'warning' : 'neutral'} 
                                            />
                                            <div>
                                                <span className="block text-xs font-bold text-charcoal-900 dark:text-white">Encryption</span>
                                                <span className="text-[10px] text-charcoal-500">AES-256 Standard</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setUseEncryption(!useEncryption)}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${useEncryption ? 'bg-amber-500' : 'bg-slate-300 dark:bg-charcoal-600'}`}
                                        >
                                            <motion.div 
                                                className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                                animate={{ x: useEncryption ? 20 : 0 }}
                                                transition={techEase}
                                            />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {useEncryption && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="relative pt-1">
                                                    <input 
                                                        type={isPasswordVisible ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Enter password"
                                                        className="w-full h-10 pl-3 pr-10 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                    />
                                                    <button 
                                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                        className="absolute right-0 top-1 bottom-0 w-10 flex items-center justify-center text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"
                                                    >
                                                        {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};
