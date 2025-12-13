
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid } from 'lucide-react';
import { modalOverlayVariants, modalContentVariants } from '../utils/animations';

interface FilmstripModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export const FilmstripModal: React.FC<FilmstripModalProps> = ({ isOpen, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm pointer-events-auto"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full h-[70vh] md:h-full md:max-h-[700px] md:max-w-4xl bg-white dark:bg-charcoal-900 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-charcoal-800 shrink-0">
              <div className="flex items-center gap-2 font-bold text-charcoal-800 dark:text-white">
                <LayoutGrid size={18} />
                <h3>{title}</h3>
              </div>
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-charcoal-800 rounded-lg hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors">
                Done
              </button>
            </div>
            
            {/* Filmstrip Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
