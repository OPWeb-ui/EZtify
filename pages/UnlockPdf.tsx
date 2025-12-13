
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { isPdfEncrypted, unlockPdf } from '../services/pdfSecurity';
import { FileRejection, useDropzone } from 'react-dropzone';
import { UnlockKeyhole, Unlock, RefreshCw, FileText, X, Eye, EyeOff, FilePlus, Zap, Cpu, Info, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { ToolLandingLayout } from '../components/ToolLandingLayout';

export const UnlockPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [status, setStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];

    setIsProcessingFiles(true);
    setStatus('Checking encryption...');
    try {
      const encrypted = await isPdfEncrypted(f);
      setIsEncrypted(encrypted);
      setFile(f);
    } catch (e) {
      addToast("Error", "Could not check file.", "error");
    } finally {
      setIsProcessingFiles(false);
      setStatus('');
    }
  }, [addToast]);

  const reset = () => {
    setFile(null);
    setIsEncrypted(false);
    setPassword('');
    setIsPasswordVisible(false);
    setIsUnlocking(false);
    setStatus('');
    setIsProcessingFiles(false);
  };

  const handleUnlock = async () => {
    if (!file || !password) {
      if (!password) addToast("Error", "Please enter a password.", "error");
      return;
    }
    setIsUnlocking(true);
    try {
       const blob = await unlockPdf(file, password);
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `unlocked_${file.name}`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       addToast("Success", "PDF unlocked and downloaded!", "success");
       reset();
    } catch (e) {
       addToast("Error", "Incorrect password or decryption failed.", "error");
    } finally {
       setIsUnlocking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-16 overflow-hidden bg-slate-50 dark:bg-charcoal-950">
      <PageReadyTracker />
      
      <AnimatePresence mode="wait">
        {!file ? (
          <ToolLandingLayout
            title="Unlock PDF"
            description="Remove passwords and encryption from PDF files to enable editing and printing."
            icon={<UnlockKeyhole />}
            onDrop={onDrop}
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
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6"
          >
            <div className="w-full max-w-2xl bg-white dark:bg-charcoal-900 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-2xl overflow-hidden relative">
              
              {/* Tech Header */}
              <div className="h-12 bg-slate-50 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between px-4 select-none">
                 <div className="flex gap-3 items-center">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-charcoal-600" />
                    </div>
                    <div className="h-4 w-px bg-slate-300 dark:bg-charcoal-600" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400 font-bold">SECURITY_MODULE</span>
                 </div>
                 <button onClick={reset} className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300 transition-colors">
                    <X size={16} />
                 </button>
              </div>

              <div className="p-8 md:p-12 flex flex-col items-center">
                  
                  {/* File Info */}
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 p-4 rounded-xl w-full max-w-md mb-8">
                      <div className="w-10 h-10 flex items-center justify-center bg-rose-100 dark:bg-rose-900/20 rounded-lg text-rose-500 shrink-0">
                          <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-bold font-mono text-sm text-charcoal-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-[10px] font-mono text-charcoal-500 dark:text-charcoal-400">{(file.size / 1024 / 1024).toFixed(2)} MB • {isEncrypted ? 'LOCKED' : 'OPEN'}</p>
                      </div>
                  </div>
              
                  {isEncrypted ? (
                    <div className="w-full max-w-md space-y-4">
                        <div className="text-center mb-2">
                            <h4 className="font-bold text-charcoal-900 dark:text-white font-mono text-sm uppercase tracking-wide mb-1">Decryption Required</h4>
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Enter the owner password to unlock this file.</p>
                        </div>

                        <div className="relative">
                            <input 
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                className="w-full bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl px-4 py-3.5 pr-12 text-sm font-mono text-charcoal-900 dark:text-white placeholder:text-charcoal-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none transition-all shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-300"
                            >
                              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <motion.button
                            onClick={handleUnlock}
                            disabled={isUnlocking || !password}
                            whileTap={buttonTap}
                            className="w-full py-4 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold font-mono text-sm rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group border border-transparent mt-2"
                        >
                            <div className="relative flex items-center justify-center gap-2">
                                <Unlock size={16} />
                                <span>{isUnlocking ? 'DECRYPTING...' : 'EXECUTE_UNLOCK'}</span>
                            </div>
                        </motion.button>
                    </div>
                  ) : (
                    <div className="text-center w-full max-w-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full mb-4">
                            <Unlock size={32} />
                        </div>
                        <h4 className="font-bold text-charcoal-900 dark:text-white text-lg mb-2">No Encryption Detected</h4>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-6">This file is mostly already accessible.</p>
                        
                        <motion.button
                            onClick={reset}
                            whileTap={buttonTap}
                            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold font-mono text-xs bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors"
                          >
                            <RefreshCw size={14} /> RESET_MODULE
                        </motion.button>
                    </div>
                  )}
              </div>
              
              {/* Footer Status Bar */}
              <div className="bg-slate-50 dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 px-4 py-2 flex justify-between items-center text-[10px] font-mono text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider">
                 <span>Alg: AES-256 / RC4</span>
                 <span>Status: {isEncrypted ? 'Locked' : 'Open'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
