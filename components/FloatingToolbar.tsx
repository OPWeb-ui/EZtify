
import React from 'react';
import { motion } from 'framer-motion';

interface FloatingToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ children, className = '' }) => {
  return (
    <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none ${className}`}>
      <div className="pointer-events-auto bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md shadow-lg border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2 flex items-center gap-4">
        {children}
      </div>
    </div>
  );
};
