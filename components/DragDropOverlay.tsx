import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight, FileInput, ScanLine, HardDrive } from 'lucide-react';

export type OverlayVariant = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'amber' | 'mint' | 'violet' | 'indigo' | 'pink' | 'wordBlue' | 'pptOrange' | 'cyan' | 'slate';

interface DragDropOverlayProps {
  isDragActive: boolean;
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
  variant?: OverlayVariant;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ 
  isDragActive, 
  message = "INCOMING_DATA_STREAM", 
  subMessage = "RELEASE_TO_MOUNT",
  icon,
  variant = 'purple' 
}) => {
  
  const getColor = (v: OverlayVariant) => {
    switch (v) {
      case 'purple': return 'text-brand-purple border-brand-purple bg-brand-purple/5';
      case 'blue': return 'text-blue-500 border-blue-500 bg-blue-500/5';
      case 'green': return 'text-emerald-500 border-emerald-500 bg-emerald-500/5';
      case 'orange': return 'text-orange-500 border-orange-500 bg-orange-500/5';
      case 'red': return 'text-rose-500 border-rose-500 bg-rose-500/5';
      case 'amber': return 'text-amber-500 border-amber-500 bg-amber-500/5';
      case 'mint': return 'text-teal-500 border-teal-500 bg-teal-500/5';
      case 'violet': return 'text-violet-500 border-violet-500 bg-violet-500/5';
      case 'indigo': return 'text-indigo-500 border-indigo-500 bg-indigo-500/5';
      case 'pink': return 'text-pink-500 border-pink-500 bg-pink-500/5';
      case 'wordBlue': return 'text-blue-600 border-blue-600 bg-blue-600/5';
      case 'pptOrange': return 'text-orange-600 border-orange-600 bg-orange-600/5';
      case 'cyan': return 'text-cyan-500 border-cyan-500 bg-cyan-500/5';
      case 'slate': return 'text-slate-500 border-slate-500 bg-slate-500/5';
      default: return 'text-brand-purple border-brand-purple bg-brand-purple/5';
    }
  };

  const colorClass = getColor(variant as OverlayVariant);

  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-charcoal-950/90 backdrop-blur-xl overflow-hidden"
        >
          {/* Animated Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
            style={{ 
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} 
          />
          <motion.div 
             className={`absolute inset-0 ${colorClass} opacity-10`}
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1.5, opacity: 0.1 }}
             transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
             style={{ borderRadius: '50%' }}
          />

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
              relative p-12 rounded-3xl border-2 border-dashed
              flex flex-col items-center text-center max-w-lg w-full mx-4
              ${colorClass}
            `}
          >
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 -mt-1 -ml-1"><CornerUpLeft size={24} strokeWidth={3} /></div>
            <div className="absolute top-0 right-0 -mt-1 -mr-1"><CornerUpRight size={24} strokeWidth={3} /></div>
            <div className="absolute bottom-0 left-0 -mb-1 -ml-1"><CornerDownLeft size={24} strokeWidth={3} /></div>
            <div className="absolute bottom-0 right-0 -mb-1 -mr-1"><CornerDownRight size={24} strokeWidth={3} /></div>

            {/* Icon Pulse */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6 relative"
            >
               <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full" />
               {icon || <UploadCloud size={64} strokeWidth={1.5} className="relative z-10" />}
            </motion.div>

            {/* Typography */}
            <h3 className="text-3xl font-heading font-black tracking-tighter mb-2 uppercase">
              {message}
            </h3>
            
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest opacity-70">
               <ScanLine size={14} className="animate-pulse" />
               <span>{subMessage}</span>
            </div>

            {/* Fake System Stats */}
            <div className="absolute bottom-4 right-6 text-[8px] font-mono opacity-40 text-right hidden sm:block">
               PORT: 8080<br/>
               STATUS: LISTENING<br/>
               BUFFER: READY
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};