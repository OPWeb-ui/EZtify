
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toolCategories } from '../utils/tool-list';
import { ToolLink } from './ToolLink';

interface ToolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const ToolDrawer: React.FC<ToolDrawerProps> = ({ isOpen, onClose, isMobile }) => {
  // Lock Scroll
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Animation Variants (Refined OS-style)
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.25 } }
  };

  const modalVariants = isMobile
    ? {
        hidden: { y: '100%' },
        visible: { y: 0, transition: { type: 'spring', damping: 28, stiffness: 300, mass: 0.8 } },
        exit: { y: '100%', transition: { duration: 0.25, ease: 'easeInOut' } }
      }
    : {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.2 } }
      };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`
            fixed inset-0 z-[1200] flex flex-col items-center p-0 sm:p-6 pointer-events-none
            ${isMobile ? 'justify-end' : 'justify-center'}
          `}
        >
          
          {/* Backdrop - iOS style black-tinted blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-xl pointer-events-auto"
            aria-hidden="true"
          />

          {/* Modal Container - Dark Frosted Glass Shell */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              pointer-events-auto flex flex-col overflow-hidden relative
              bg-[#0D0D0D]/85 backdrop-blur-3xl border-white/5
              shadow-[0_20px_100px_rgba(0,0,0,0.6)]
              w-full
              ${isMobile 
                ? 'h-[85vh] rounded-t-[2.5rem] border-t border-white/10' 
                : 'max-w-4xl max-h-[80vh] rounded-[2.5rem] border'
              }
            `}
          >
            {/* Header */}
            <div className="shrink-0 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-transparent z-20">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
                <h2 className="text-xs font-bold text-white/90 uppercase tracking-[0.25em] font-mono">System Modules</h2>
              </div>
              
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div 
              className="flex-1 overflow-y-auto custom-scrollbar p-8 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-12"
              >
                {toolCategories.map((cat) => (
                  <div key={cat.category}>
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-6 pl-1">
                      {cat.category}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.tools.map((tool) => (
                        <ToolLink 
                          key={tool.id} 
                          tool={tool} 
                          onClose={onClose} 
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
              
              <div className="h-12" />
            </div>

            {/* Footer Status Bar */}
            {!isMobile && (
              <div className="shrink-0 h-10 flex items-center justify-between px-8 border-t border-white/5 bg-transparent text-[9px] font-mono text-white/10 uppercase tracking-[0.2em] select-none">
                 <span>EZ_RUNTIME_LOADED</span>
                 <span className="flex items-center gap-1.5">
                   <span className="w-1 h-1 rounded-full bg-white/20" />
                   SECURE_LOCAL_SESSION
                 </span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
