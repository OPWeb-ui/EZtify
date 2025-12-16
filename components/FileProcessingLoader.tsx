
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STATES = [
  "Initializing runtime...",
  "Allocating buffers...",
  "Processing stream...",
  "Finalizing output..."
];

export const FileProcessingLoader: React.FC = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => (prev + 1) % LOADING_STATES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-nd-base/90 backdrop-blur-md"
    >
      <div className="w-full max-w-xs flex flex-col items-center">
        
        {/* Spinner / Icon */}
        <div className="mb-6 relative">
           <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 rounded-full" />
           <motion.div 
             className="absolute inset-0 border-2 border-t-zinc-800 dark:border-t-zinc-200 rounded-full"
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           />
        </div>

        {/* Text */}
        <div className="h-6 flex items-center justify-center overflow-hidden relative w-full">
           <AnimatePresence mode="wait">
             <motion.span 
               key={stage}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               transition={{ duration: 0.2 }}
               className="text-sm font-medium text-nd-primary"
             >
               {LOADING_STATES[stage]}
             </motion.span>
           </AnimatePresence>
        </div>
        
        <p className="mt-2 text-xs text-nd-muted">Please wait...</p>

      </div>
    </motion.div>
  );
};
