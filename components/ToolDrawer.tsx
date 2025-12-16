
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash } from 'lucide-react';
import { toolCategories } from '../utils/tool-list';
import { ToolLink } from './ToolLink';

interface ToolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const ToolDrawer: React.FC<ToolDrawerProps> = ({ isOpen, onClose, isMobile }) => {
  // Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Animation Variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const drawerVariants = isMobile
    ? {
        hidden: { y: '100%' },
        visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
        exit: { y: '100%', transition: { ease: 'easeIn', duration: 0.2 } }
      }
    : {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex flex-col items-center justify-end md:justify-center pointer-events-none">
          
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-charcoal-900/20 dark:bg-black/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer Container */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              pointer-events-auto flex flex-col overflow-hidden 
              bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl
              ${isMobile 
                ? 'w-full h-[90dvh] rounded-t-[32px] shadow-2xl pb-[env(safe-area-inset-bottom)]' 
                : 'w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-charcoal-700'
              }
            `}
          >
            {/* Header */}
            <div className="shrink-0 p-6 border-b border-slate-200 dark:border-charcoal-700 flex items-center justify-between bg-white/50 dark:bg-charcoal-900/50 relative z-20">
              <div>
                <h2 className="text-xl font-heading font-bold text-charcoal-900 dark:text-white tracking-tight">System Modules</h2>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-mono mt-1">Select a tool to launch</p>
              </div>
              
              <div className="flex items-center gap-3">
                 {!isMobile && (
                    <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-charcoal-800 text-[10px] font-mono font-bold text-charcoal-500 dark:text-charcoal-400 border border-slate-200 dark:border-charcoal-700">
                        ESC
                    </kbd>
                 )}
                 <button 
                    onClick={onClose}
                    className="p-2 rounded-full bg-slate-100 dark:bg-charcoal-800 text-charcoal-500 hover:bg-slate-200 dark:hover:bg-charcoal-700 hover:text-charcoal-900 dark:hover:text-white transition-colors"
                    aria-label="Close Drawer"
                 >
                    <X size={20} />
                 </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div 
              className="flex-1 w-full min-h-0 overflow-y-auto custom-scrollbar p-6 md:p-8 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div className="flex flex-col gap-10 pb-12">
                  {toolCategories.map((cat, idx) => (
                    <motion.div 
                      key={cat.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-5 opacity-70">
                        <Hash size={14} className="text-brand-purple" />
                        <h3 className="text-xs font-bold font-mono text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest">
                          {cat.category}
                        </h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-charcoal-700 ml-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {cat.tools.map((tool) => (
                          <ToolLink 
                            key={tool.id} 
                            tool={tool} 
                            onClose={onClose} 
                            variant="compact"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>

            {/* Footer Status Bar (Desktop) */}
            {!isMobile && (
              <div className="shrink-0 px-6 py-3 bg-slate-50 dark:bg-charcoal-950 border-t border-slate-200 dark:border-charcoal-800 flex justify-between items-center text-[10px] font-mono text-charcoal-400 relative z-20">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  SYSTEM_READY
                </span>
                <span className="opacity-50">EZTIFY_OS v1.0.0</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
