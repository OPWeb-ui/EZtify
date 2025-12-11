
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, UploadCloud } from 'lucide-react';

export type OverlayVariant = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'amber' | 'mint' | 'violet' | 'indigo' | 'pink' | 'wordBlue' | 'pptOrange';

interface DragDropOverlayProps {
  isDragActive: boolean;
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
  variant?: OverlayVariant;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ 
  isDragActive, 
  message = "Drop files here", 
  subMessage,
  icon,
  variant = 'purple' 
}) => {
  // Map variant to classes
  const colorMap: Record<OverlayVariant, string> = {
    purple: 'text-brand-purple border-brand-purple bg-brand-purple/10',
    mint: 'text-brand-mint border-brand-mint bg-brand-mint/10',
    violet: 'text-brand-violet border-brand-violet bg-brand-violet/10',
    orange: 'text-brand-orange border-brand-orange bg-brand-orange/10',
    blue: 'text-brand-blue border-brand-blue bg-brand-blue/10',
    green: 'text-brand-green border-brand-green bg-brand-green/10',
    amber: 'text-amber-500 border-amber-500 bg-amber-500/10',
    indigo: 'text-indigo-500 border-indigo-500 bg-indigo-500/10',
    red: 'text-rose-500 border-rose-500 bg-rose-500/10',
    pink: 'text-pink-500 border-pink-500 bg-pink-500/10',
    wordBlue: 'text-blue-600 border-blue-600 bg-blue-600/10',
    pptOrange: 'text-orange-600 border-orange-600 bg-orange-600/10'
  };

  const colorClass = colorMap[variant] || colorMap.purple;

  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`absolute inset-0 z-[100] backdrop-blur-md flex items-center justify-center border-4 border-dashed rounded-3xl pointer-events-none ${colorClass} m-2`}
        >
          <div className="text-center p-8 bg-white/80 dark:bg-charcoal-900/80 rounded-3xl backdrop-blur-md shadow-2xl transform transition-transform">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-charcoal-800 shadow-md"
            >
              {icon || <Plus size={40} strokeWidth={2.5} />}
            </motion.div>
            <h3 className="text-2xl font-heading font-bold tracking-tight mb-2">{message}</h3>
            {subMessage && <p className="text-sm font-medium opacity-80">{subMessage}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
