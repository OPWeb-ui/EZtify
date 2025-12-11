
import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

export const FileProcessingLoader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-pastel-bg/90 dark:bg-charcoal-950/90 backdrop-blur-sm rounded-[24px]"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-10px] border-2 border-dashed border-brand-purple/30 rounded-full"
        />
        <div className="bg-white dark:bg-charcoal-900 p-6 rounded-full shadow-xl shadow-brand-purple/10 relative z-10">
           <Logo size="mono" />
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center"
      >
        <h3 className="text-lg font-heading font-bold text-charcoal-900 dark:text-white mb-1">
          Preparing Files...
        </h3>
        <p className="text-sm text-charcoal-500 dark:text-slate-400 font-medium">
          Just a moment
        </p>
      </motion.div>
    </motion.div>
  );
};
