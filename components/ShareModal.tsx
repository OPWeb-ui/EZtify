
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Copy, Check, Mail } from 'lucide-react';
import { modalOverlayVariants, modalContentVariants } from '../utils/animations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = useState(false);

  // Handle body scroll locking and Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Share EZtify");
    const body = encodeURIComponent(`I found this great tool for converting images to PDF securely in the browser: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out EZtify: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  
  const shareTelegram = () => {
    const shareUrl = encodeURIComponent(url);
    const text = encodeURIComponent('Check out EZtify');
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 h-[100dvh] w-screen pointer-events-none">
          {/* Backdrop */}
          <motion.div
            variants={modalOverlayVariants as Variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm pointer-events-auto"
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={modalContentVariants as Variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[400px] bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
          >
            {/* Ambient Decorative Blobs - Purple Theme */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-2 relative z-10">
              <div>
                <h3 className="text-xl font-heading font-bold text-charcoal-800 dark:text-white">Share EZtify</h3>
                <p className="text-sm text-charcoal-500 dark:text-slate-400 mt-1">Share these free tools with friends.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 -mt-2 rounded-full text-charcoal-400 hover:bg-slate-100 dark:hover:bg-charcoal-800 hover:text-charcoal-800 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 pt-4 overflow-y-auto custom-scrollbar relative z-10">
              
              {/* Copy Link Input */}
              <div className="group relative flex items-center gap-2 bg-slate-50 dark:bg-charcoal-800 p-2 pl-3 rounded-xl border border-slate-200 dark:border-charcoal-700 focus-within:border-brand-purple/50 focus-within:ring-2 focus-within:ring-brand-purple/10 transition-all mb-6">
                <input 
                  readOnly 
                  value={url} 
                  className="bg-transparent border-none outline-none text-sm text-charcoal-600 dark:text-slate-300 w-full font-mono truncate py-1"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopy}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm
                    ${copied 
                      ? 'bg-brand-mint text-white shadow-brand-mint/20' 
                      : 'bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-slate-200 border border-slate-100 dark:border-charcoal-600 hover:border-slate-300 hover:text-brand-purple'}
                  `}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Social Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button 
                  onClick={shareWhatsApp} 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 shadow-sm hover:shadow-md hover:border-green-200 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-charcoal-600 dark:text-slate-400 group-hover:text-green-700 dark:group-hover:text-green-400">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button 
                  onClick={shareTelegram} 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 shadow-sm hover:shadow-md hover:border-sky-200 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-[-1px] translate-y-[1px]">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-charcoal-600 dark:text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-400">Telegram</span>
                </button>

                {/* Email */}
                <button 
                  onClick={shareEmail} 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 shadow-sm hover:shadow-md hover:border-brand-purple/20 hover:bg-brand-purple/5 dark:hover:bg-brand-purple/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail size={20} />
                  </div>
                  <span className="text-xs font-medium text-charcoal-600 dark:text-slate-400 group-hover:text-brand-purple">Email</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
