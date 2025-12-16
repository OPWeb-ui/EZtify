import React from 'react';
import { motion } from 'framer-motion';

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-charcoal-950 text-charcoal-900 dark:text-white font-mono">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="text-2xl md:text-4xl font-bold tracking-tighter"
        >
          EZTIFY<span className="text-brand-purple">_OS</span>
        </motion.div>
        <div className="flex items-center gap-2 mt-4 text-xs text-charcoal-500 dark:text-charcoal-400">
           <span>BOOT_SEQUENCE_INIT</span>
           <motion.span
             animate={{ opacity: [0, 1, 0] }}
             transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
             className="w-2 h-4 bg-brand-purple block"
           />
        </div>
      </div>
    </div>
  );
};