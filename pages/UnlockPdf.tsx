
import React, { useState, useCallback } from 'react';
import { useLayoutContext } from '../components/Layout';
import { UploadArea } from '../components/UploadArea';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { isPdfEncrypted, unlockPdf } from '../services/pdfSecurity';
import { FileRejection } from 'react-dropzone';
import { Lock, Unlock, Download } from 'lucide-react';

export const UnlockPdfPage: React.FC = () => {
  const { addToast } = useLayoutContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
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

  const handleUnlock = async () => {
    if (!file) return;
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
       addToast("Success", "PDF unlocked!", "success");
       setFile(null);
       setPassword('');
    } catch (e) {
       addToast("Error", "Incorrect password or decryption failed.", "error");
    } finally {
       setIsUnlocking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-charcoal-900">
      <PageReadyTracker />
      
      {!file ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full">
            <UploadArea onDrop={onDrop} mode="unlock-pdf" isProcessing={isProcessingFiles} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
           <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-charcoal-700">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 {isEncrypted ? <Lock size={32} /> : <Unlock size={32} />}
              </div>
              <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">{file.name}</h3>
              
              {!isEncrypted ? (
                 <div className="space-y-4">
                    <p className="text-sm text-charcoal-500 dark:text-slate-400">
                       This file is not encrypted. You don't need to unlock it.
                    </p>
                    <button 
                       onClick={() => setFile(null)} 
                       className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-charcoal-700 font-bold rounded-xl transition-colors"
                    >
                       Choose Another File
                    </button>
                 </div>
              ) : (
                 <div className="space-y-4">
                    <p className="text-sm text-charcoal-500 dark:text-slate-400">
                       Enter the password to remove security.
                    </p>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-purple/50"
                    />
                    <button 
                       onClick={handleUnlock}
                       disabled={!password || isUnlocking}
                       className="w-full py-3 bg-brand-purple hover:bg-brand-purpleDark text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all disabled:opacity-50"
                    >
                       {isUnlocking ? "Unlocking..." : "Unlock PDF"}
                    </button>
                    <button onClick={() => setFile(null)} className="text-sm text-charcoal-400 hover:text-charcoal-600">Cancel</button>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
