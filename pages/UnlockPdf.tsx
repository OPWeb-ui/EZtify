
import React, { useState, useCallback, useRef } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { isPdfEncrypted, unlockPdf } from '../services/pdfSecurity';
import { useDropzone, FileRejection } from 'react-dropzone';
import { 
  UnlockKeyhole, Unlock, RefreshCw, FileText, X, Eye, EyeOff, 
  Zap, Cpu, ShieldCheck, Lock, KeyRound, FilePlus, Download, Loader2,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, techEase } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { DragDropOverlay } from '../components/DragDropOverlay';
import { StickyBar } from '../components/StickyBar';
import { IconBox } from '../components/IconBox';

export const UnlockPdfPage: React.FC = () => {
  const { addToast, isMobile } = useLayoutContext();
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [status, setStatus] = useState('');
  
  // Mobile UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      addToast("Invalid File", "Please upload a valid PDF file.", "error");
      return;
    }
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];

    setIsProcessingFiles(true);
    const startTime = Date.now();
    setStatus('Checking encryption...');
    
    try {
      const encrypted = await isPdfEncrypted(f);
      
      // Enforce 1s minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      setIsEncrypted(encrypted);
      setFile(f);
      // Auto-open settings (password input) on mobile if encrypted
      if (encrypted && window.innerWidth < 768) {
          setIsSettingsOpen(true);
      }
    } catch (e) {
      addToast("Error", "Could not check file.", "error");
    } finally {
      setIsProcessingFiles(false);
      setStatus('');
    }
  }, [addToast]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: true,
    noKeyboard: true,
    disabled: isProcessingFiles || isUnlocking
  });

  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = '';
  };

  const reset = () => {
    setFile(null);
    setIsEncrypted(false);
    setPassword('');
    setIsPasswordVisible(false);
    setIsUnlocking(false);
    setStatus('');
    setIsProcessingFiles(false);
    setIsSettingsOpen(false);
  };

  const handleUnlock = async () => {
    if (!file) return;
    if (isEncrypted && !password) {
      addToast("Error", "Please enter a password.", "error");
      if (isMobile) setIsSettingsOpen(true);
      return;
    }
    
    setIsUnlocking(true);
    try {
       // If not encrypted, we basically just return the file, but let's simulate the flow
       const blob = isEncrypted ? await unlockPdf(file, password) : file;
       
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = isEncrypted ? `unlocked_${file.name}` : file.name;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       
       addToast("Success", "File unlocked and downloaded!", "success");
       // Optional: Don't reset immediately so user sees success? 
       // For now, let's keep the file there.
    } catch (e) {
       addToast("Error", "Incorrect password or decryption failed.", "error");
    } finally {
       setIsUnlocking(false);
    }
  };

  // --- Shared Component: Password Input ---
  const PasswordInput = () => (
    <div className="space-y-4">
        {isEncrypted ? (
            <div className="space-y-3">
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg flex items-start gap-3">
                    <Lock size={16} className="text-rose-500 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">Encrypted</h4>
                        <p className="text-[10px] text-rose-600 dark:text-rose-300/80 leading-relaxed mt-1">
                            This document is password protected. Enter the owner password to decrypt it.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
                        Decryption Key
                    </label>
                    <div className="relative group">
                        <input 
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl px-4 py-3 pr-12 text-sm font-mono text-charcoal-900 dark:text-white placeholder:text-charcoal-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none transition-all shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-4 rounded-xl flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Unlock size={20} />
                </div>
                <h4 className="text-sm font-bold text-green-700 dark:text-green-400">No Encryption</h4>
                <p className="text-xs text-green-600 dark:text-green-300/80">
                    This file is not password protected. You can open it directly.
                </p>
            </div>
        )}
    </div>
  );

  // --- Shared Component: File Item ---
  const FileItem = () => (
    <div className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 shadow-sm">
        <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border
            ${isEncrypted 
                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 border-rose-100 dark:border-rose-900/30' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30'}
        `}>
            {isEncrypted ? <Lock size={24} /> : <Unlock size={24} />}
        </div>

        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-white font-mono truncate mb-1" title={file?.name}>
                {file?.name}
            </h4>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-charcoal-500 dark:text-slate-400">
                    <HardDrive size={10} />
                    <span>{(file!.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {isEncrypted && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-bold uppercase tracking-wide">
                        Locked
                    </span>
                )}
            </div>
        </div>

        <motion.button 
            whileTap={buttonTap} 
            onClick={reset} 
            className="p-2 text-charcoal-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" 
            title="Remove"
            disabled={isUnlocking}
        >
            <X size={18} />
        </motion.button>
    </div>
  );

  if (!file) {
    return (
      <ToolLandingLayout
        title="Unlock PDF"
        description="Remove passwords and encryption from PDF files securely in your browser."
        icon={<UnlockKeyhole />}
        onDrop={(files, rejections) => onDrop(files, rejections)}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={false}
        isProcessing={isProcessingFiles}
        accentColor="text-rose-500"
        specs={[
          { label: "Encryption", value: "AES/RC4", icon: <ShieldCheck /> },
          { label: "Privacy", value: "Client-Side", icon: <Lock /> },
          { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
          { label: "Input", value: "Password", icon: <Zap /> },
        ]}
        tip="You must know the current password to unlock the file. We do not crack passwords."
      />
    );
  }

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-charcoal-950 font-sans" {...getRootProps()}>
        <PageReadyTracker />
        <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} disabled={isUnlocking} />
        <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="red" />

        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
              <IconBox icon={<UnlockKeyhole />} size="sm" toolAccentColor="#388E3C" active />
              <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Unlocker</h3>
                  <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">1 Document Loaded</p>
              </div>
          </div>
          <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} disabled={isUnlocking} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold disabled:opacity-50 border border-transparent">
              <FilePlus size={16} /> Replace
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <FileItem />
        </div>

        {/* Sticky Action Bar */}
        <StickyBar 
          mode="unlock-pdf"
          imageCount={1}
          totalSize={file.size}
          onGenerate={handleUnlock}
          isGenerating={isUnlocking}
          status={isUnlocking ? 'DECRYPTING...' : ''}
          onReset={reset}
          onSecondaryAction={() => setIsSettingsOpen(true)}
          secondaryLabel="Credentials"
          secondaryIcon={<KeyRound />}
        />

        {/* Password Bottom Sheet */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 z-[1100] flex flex-col justify-end pointer-events-none">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsSettingsOpen(false)} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="relative w-full bg-white dark:bg-charcoal-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-charcoal-800 flex flex-col max-h-[70vh] overflow-hidden pointer-events-auto pb-[env(safe-area-inset-bottom)]"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-charcoal-800">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-brand-purple" />
                    <h3 className="text-sm font-bold text-charcoal-800 dark:text-white uppercase tracking-wider font-mono">Credentials</h3>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 -mr-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-200"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <PasswordInput />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
      <PageReadyTracker />
      <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,.pdf" onChange={handleFileChange} disabled={isUnlocking} />
      <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="red" />
      
      {/* 1. LEFT / CENTER: File Visualization */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-black/20 relative z-10">
          <div className="h-16 border-b border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-3">
                  <IconBox icon={<UnlockKeyhole />} size="sm" toolAccentColor="#388E3C" active />
                  <div>
                      <h3 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wider font-mono">Unlock PDF</h3>
                      <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">Client-side decryption</p>
                  </div>
              </div>
              <motion.button whileTap={buttonTap} onClick={handleAddFilesClick} disabled={isUnlocking} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-transparent disabled:opacity-50">
                  <FilePlus size={16} /> <span className="hidden sm:inline">Replace File</span>
              </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex items-center justify-center">
              <div className="max-w-xl w-full">
                  <FileItem />
              </div>
          </div>
      </div>

      {/* 2. RIGHT SIDEBAR: Configuration */}
      <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="h-16 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50 dark:bg-charcoal-850/50">
              <KeyRound size={16} className="text-charcoal-400 mr-2" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Credentials</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <PasswordInput />
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0 space-y-3">
              <motion.button 
                  onClick={handleUnlock} 
                  disabled={isUnlocking} 
                  whileTap={buttonTap} 
                  className="relative overflow-hidden w-full h-12 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-xs tracking-wider uppercase rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                  <div className="relative flex items-center justify-center gap-2 z-10">
                      {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                      <span>{isUnlocking ? 'DECRYPTING...' : 'UNLOCK PDF'}</span>
                  </div>
              </motion.button>
              <motion.button 
                  whileTap={buttonTap} 
                  onClick={reset} 
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wide text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
              >
                  <RefreshCw size={12} /> Reset System
              </motion.button>
          </div>
      </div>
    </div>
  );
};
