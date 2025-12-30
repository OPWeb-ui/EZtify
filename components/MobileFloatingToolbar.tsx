
import React from 'react';
import { motion } from 'framer-motion';

interface MobileFloatingToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileFloatingToolbar: React.FC<MobileFloatingToolbarProps> = ({ children, className = '' }) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`absolute top-4 left-4 right-4 z-30 flex justify-center pointer-events-none ${className}`}
    >
      <div className="pointer-events-auto w-full max-w-md bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-lg border border-slate-200/50 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/5 flex items-center justify-between gap-3">
        {children}
      </div>
    </motion.div>
  );
};
