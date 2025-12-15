
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
  Cpu, Settings, Zap, FolderArchive, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const ZipFilesPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [files, setFiles] = useState<ZipFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      }, 500);
    }
  }, [addToast, isProcessingFiles, isGenerating]);
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
          const error = fileRejections[0].errors[0];
          if (error.code === 'file-too-large') {
               addToast("File Too Large", "Max file size is 100MB.", "error");
          } else if (error.code === 'too-many-files') {
               addToast("Too Many Files", "Max 50 files allowed.", "error");
          } else {
               addToast("Invalid Upload", error.message, "error");
          }
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

  const handleAddFilesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessingFiles || isGenerating) return;
    if (e.target.files) {
      processDroppedFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  const handleZip = async () => {
    if (files.length === 0) return;
    
    if (useEncryption && !password) {
        addToast("Error", "Please enter a password.", "error");
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
  }

  const getFileInfo = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    if (type.includes('pdf') || name.endsWith('.pdf')) return { color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/20', icon: <FileText size={20} /> };
    if (type.includes('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name)) return { color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20', icon: <ImageIcon size={20} /> };
    if (type.includes('video/') || /\.(mp4|mov|avi|mkv)$/.test(name)) return { color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20', icon: <Video size={20} /> };
    if (type.includes('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(name)) return { color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/20', icon: <Music size={20} /> };
    if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return { color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20', icon: <Archive size={20} /> };
    if (/\.(js|ts|jsx|tsx|html|css|json|py|java|c|cpp|xml|yml|yaml|md)$/.test(name)) return { color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/20', icon: <Code size={20} /> };
    
    return { 
      color: 'text-slate-500 bg-slate-100 dark:bg-charcoal-800', 
      icon: <FileIcon size={20} /> 
    };
  };

  const totalSize = files.reduce((acc, curr) => acc + curr.file.size, 0);
  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <ToolLandingLayout
        title="Zip Files"
        description="Create optimized ZIP archives securely in your browser."
        icon={<FolderArchive />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        multiple={true}
        isProcessing={isProcessingFiles}
        accentColor="text-amber-500"
        specs={[
          { label: "Algorithm", value: "DEFLATE", icon: <Zap /> },
          { label: "Encryption", value: "AES-256", icon: <Lock /> },
          { label: "Privacy", value: "Local", icon: <ShieldCheck /> },
          { label: "Engine", value: "JSZip", icon: <Cpu /> },
        ]}
        tip="Files are processed 100% client-side via WebAssembly. No data leaves your device."
      />
    );
  }

  return (
    <motion.div
      key="studio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 h-full"
      {...getRootProps()}
    >
      <input 
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileChange}
        disabled={isProcessingFiles || isGenerating}
      />
      <PageReadyTracker />
      
      <div className="w-full max-w-5xl mx-auto bg-white dark:bg-charcoal-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-charcoal-700 flex flex-col md:flex-row h-full md:h-[600px] ring-1 ring-black/5">
          
          <AnimatePresence>
              {isDragActive && (
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-brand-purple/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                  >
                      <FilePlus className="w-16 h-16 mb-4 animate-bounce" />
                      <h3 className="text-2xl font-mono font-bold">ADD_TO_ARCHIVE</h3>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="p-6 pb-2 shrink-0 flex items-center justify-between z-10 border-b border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
                  <div>
                      <h3 className="text-lg font-mono font-bold text-charcoal-900 dark:text-white uppercase tracking-tight">Archive Contents</h3>
                      <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono mt-0.5">{files.length} items ready</p>
                  </div>
                  <motion.button 
                      whileTap={buttonTap}
                      onClick={handleAddFilesClick}
                      className="p-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors text-brand-purple border border-slate-200 dark:border-charcoal-700"
                      title="Add more files"
                  >
                      <FilePlus size={18} />
                  </motion.button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 space-y-3 bg-slate-50/50 dark:bg-black/20">
                  <AnimatePresence initial={false}>
                      {files.map(file => {
                          const { color, icon } = getFileInfo(file.file);
                          return (
                          <motion.div 
                              key={file.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                              className="bg-white dark:bg-charcoal-850 p-3 rounded-xl border border-slate-200 dark:border-charcoal-700 flex items-center gap-4 group hover:border-brand-purple/30 dark:hover:border-charcoal-600 transition-colors shadow-sm"
                          >
                              <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${color}`}>
                                  {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-bold font-mono text-xs text-charcoal-900 dark:text-white truncate">{file.file.name}</p>
                                  <p className="text-[10px] font-mono text-charcoal-500 dark:text-charcoal-400">{formatSize(file.file.size)}</p>
                              </div>
                              <motion.button 
                                  whileTap={buttonTap} 
                                  onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} 
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                                  aria-label={`Remove ${file.file.name}`}
                              >
                                  <X size={16} />
                              </motion.button>
                          </motion.div>
                          );
                      })}
                  </AnimatePresence>
              </div>
          </div>

          <div className="w-full md:w-80 bg-white dark:bg-charcoal-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-charcoal-700 p-6 flex flex-col gap-6 shrink-0 relative z-20">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-2 mb-4">
                      <Settings size={14} className="text-charcoal-400" />
                      <h4 className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-widest font-mono">Configuration</h4>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-charcoal-800 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm transition-all mb-6">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${useEncryption ? 'bg-brand-purple/10 text-brand-purple' : 'bg-white dark:bg-charcoal-900 text-charcoal-400 border border-slate-200 dark:border-charcoal-600'}`}>
                                  {useEncryption ? <ShieldCheck size={18} /> : <Lock size={18} />}
                              </div>
                              <div>
                                  <span className="block text-xs font-bold text-charcoal-900 dark:text-white font-mono">Encryption</span>
                                  <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">AES-256 Protection</span>
                              </div>
                          </div>
                          <button 
                              onClick={() => setUseEncryption(!useEncryption)} 
                              className={`relative flex items-center w-10 h-6 rounded-full transition-colors ${useEncryption ? 'bg-brand-purple justify-end' : 'bg-slate-300 dark:bg-charcoal-600 justify-start'}`}
                          >
                              <motion.div layout className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm" />
                          </button>
                      </div>
                      
                      <AnimatePresence>
                          {useEncryption && (
                              <motion.div 
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  className="relative overflow-hidden"
                              >
                                  <input 
                                      type={isPasswordVisible ? 'text' : 'password'}
                                      value={password}
                                      onClick={(e) => e.stopPropagation()} 
                                      onChange={(e) => setPassword(e.target.value)}
                                      placeholder="Set Password"
                                      className="w-full bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-600 rounded-lg px-3 py-2.5 pr-10 text-xs font-mono text-charcoal-900 dark:text-white placeholder:text-charcoal-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none transition-colors"
                                  />
                                  <button
                                      type="button"
                                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                      className="absolute top-0 bottom-0 right-0 flex items-center justify-center w-10 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"
                                  >
                                      {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-charcoal-800 rounded-xl p-4 border border-slate-200 dark:border-charcoal-700 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal-600 dark:text-charcoal-400 font-mono">Total Size</span>
                          <span className="font-bold text-charcoal-900 dark:text-white font-mono">{formatSize(totalSize)}</span>
                      </div>
                  </div>
              </div>

              <div className="space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-charcoal-700 md:border-none md:pt-0">
                  <motion.button
                      onClick={handleZip}
                      disabled={isGenerating || files.length === 0}
                      whileTap={buttonTap}
                      className="relative overflow-hidden w-full h-12 rounded-lg font-bold font-mono text-xs text-white bg-charcoal-900 dark:bg-white dark:text-charcoal-900 shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group hover:bg-brand-purple dark:hover:bg-slate-200 border border-transparent"
                  >
                      {isGenerating && (
                          <motion.div 
                              className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.3 }}
                          />
                      )}
                      <div className="relative flex items-center justify-center gap-2 z-10 uppercase tracking-wide">
                          {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                          <span>
                              {isGenerating 
                                  ? (status || `ZIPPING... ${progress.toFixed(0)}%`)
                                  : 'EXECUTE_ZIP'
                              }
                          </span>
                      </div>
                  </motion.button>
                  
                  <motion.button
                      onClick={reset}
                      whileTap={buttonTap}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-lg font-bold font-mono text-[10px] uppercase tracking-wide text-charcoal-500 dark:text-charcoal-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                      <RefreshCw size={14} /> RESET_SYSTEM
                  </motion.button>
              </div>
          </div>

      </div>
    </motion.div>
  );
};
