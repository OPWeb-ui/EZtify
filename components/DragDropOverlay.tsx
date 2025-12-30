
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight, UploadCloud, ScanLine } from 'lucide-react';

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
  message = "STREAMING_DATA", 
  subMessage = "RELEASE_TO_INITIALIZE",
  icon,
  variant = 'slate' // Default changed to slate (Neutral)
}) => {
  
  // Mapped all legacy color variants to strictly defined palette colors or Neutral/Lime
  // To ensure visual consistency, we mostly force Neutral or Lime unless specific context demands warning/error.
  const getColorClasses = (v: OverlayVariant) => {
    switch (v) {
      case 'red': return { text: 'text-rose-600', border: 'border-rose-600', bg: 'bg-rose-50/95' };
      case 'green': return { text: 'text-emerald-600', border: 'border-emerald-600', bg: 'bg-emerald-50/95' };
      // All other variants map to Neutral/Black style for consistent "System" feel
      default: return { text: 'text-[#111111]', border: 'border-[#111111]', bg: 'bg-[#FAF9F6]/95' };
    }
  };

  const colors = getColorClasses(variant as OverlayVariant);

  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-xl overflow-hidden"
        >
          {/* Animated Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.05]" 
            style={{ 
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} 
          />

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
              relative p-16 rounded-[2.5rem] border-2 border-dashed
              flex flex-col items-center text-center max-w-lg w-full mx-4
              ${colors.text} ${colors.border} ${colors.bg} shadow-2xl
            `}
          >
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 -mt-1 -ml-1"><CornerUpLeft size={32} strokeWidth={3} /></div>
            <div className="absolute top-0 right-0 -mt-1 -mr-1"><CornerUpRight size={32} strokeWidth={3} /></div>
            <div className="absolute bottom-0 left-0 -mb-1 -ml-1"><CornerDownLeft size={32} strokeWidth={3} /></div>
            <div className="absolute bottom-0 right-0 -mb-1 -mr-1"><CornerDownRight size={32} strokeWidth={3} /></div>

            {/* Icon Pulse */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 relative"
            >
               <div className="absolute inset-0 bg-current opacity-20 blur-2xl rounded-full" />
               {icon || <UploadCloud size={80} strokeWidth={1.5} className="relative z-10" />}
            </motion.div>

            {/* Typography */}
            <h3 className="text-4xl font-heading font-black tracking-tighter mb-3 uppercase">
              {message}
            </h3>
            
            <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-[0.2em] opacity-80">
               <ScanLine size={18} className="animate-pulse" />
               <span>{subMessage}</span>
            </div>

            {/* Tech Data Overlay */}
            <div className="absolute bottom-6 right-8 text-[9px] font-mono opacity-40 text-right hidden sm:block uppercase tracking-widest font-bold">
               Runtime_Enc: Enabled<br/>
               Buffer_State: Listening<br/>
               I/O_Link: Established
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
