
import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

export const FileProcessingLoader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-charcoal-950/80 rounded-[24px]"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-12px] border-2 border-dashed border-brand-purple/40 rounded-full"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white dark:bg-charcoal-900 p-6 rounded-full shadow-2xl shadow-brand-purple/20 relative z-10"
        >
           <Logo size="mono" />
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center space-y-2"
      >
        <h3 className="text-xl font-heading font-bold text-charcoal-900 dark:text-white">
          Processing...
        </h3>
        <p className="text-sm text-charcoal-500 dark:text-slate-400 font-medium animate-pulse">
          Preparing your files
        </p>
      </motion.div>
    </motion.div>
  );
};
