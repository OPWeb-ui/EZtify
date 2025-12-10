import React from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface PwaInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-6 z-[100] w-full max-w-sm pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border border-slate-200 dark:border-charcoal-700 shadow-2xl shadow-brand-purple/10 p-4 flex items-start gap-4 group">
        
        {/* Subtle Background Tint */}
        <div className="absolute inset-0 opacity-[0.03] bg-brand-purple pointer-events-none" />

        {/* Icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Download className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-bold tracking-wide mb-1 text-charcoal-800 dark:text-slate-100">
            Install EZtify
          </h3>
          <p className="text-xs text-charcoal-500 dark:text-slate-400 leading-relaxed font-medium">
            Add EZtify to your device for faster, offline access.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <motion.button
              whileTap={buttonTap}
              onClick={onInstall}
              className="px-3 py-1.5 bg-brand-purple text-white text-xs font-bold rounded-lg shadow-md shadow-brand-purple/20 hover:bg-brand-purpleDark transition-colors"
            >
              Install
            </motion.button>
            <motion.button
              whileTap={buttonTap}
              onClick={onDismiss}
              className="px-3 py-1.5 text-charcoal-500 dark:text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors"
            >
              Not now
            </motion.button>
          </div>
        </div>

        {/* Close Button */}
        <motion.button 
          onClick={onDismiss}
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-1 right-1 z-10 p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer outline-none"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
};