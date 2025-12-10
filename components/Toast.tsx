import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration ?? 2000; // Default 2 seconds
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, toast.duration]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  let accentColor = 'bg-brand-orange';
  let iconColor = 'text-brand-orange';
  let glowColor = 'bg-brand-orange/30';
  let icon = <AlertTriangle className={`relative w-4 h-4 ${iconColor}`} />;

  if (isError) {
    accentColor = 'bg-rose-500';
    iconColor = 'text-rose-500';
    glowColor = 'bg-rose-500/30';
    icon = <AlertCircle className={`relative w-4 h-4 ${iconColor}`} />;
  } else if (isSuccess) {
    accentColor = 'bg-brand-green';
    iconColor = 'text-brand-green';
    glowColor = 'bg-brand-green/30';
    icon = <CheckCircle2 className={`relative w-4 h-4 ${iconColor}`} />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        x: isError ? [0, -10, 10, -10, 10, 0] : 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5, 
        transition: { duration: 0.2 } 
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        x: { duration: 0.4, ease: "easeInOut" }
      }}
      className="pointer-events-auto w-full max-w-md ml-auto px-4 md:px-0"
    >
      <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border border-slate-200 dark:border-charcoal-700 shadow-xl shadow-brand-purple/10 p-3 flex items-start gap-3 group">
        
        {/* Animated Gradient Glow Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
        
        {/* Subtle Background Tint */}
        <div className={`absolute inset-0 opacity-[0.03] ${accentColor} pointer-events-none`} />

        {/* Icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className={`absolute inset-0 rounded-full blur-md animate-pulse ${glowColor}`} />
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold tracking-wide text-charcoal-800 dark:text-slate-100 leading-tight">
            {toast.title}
          </h3>
          <p className="text-[11px] text-charcoal-500 dark:text-slate-400 leading-tight mt-0.5 font-medium">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <motion.button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="relative z-10 -mr-1 -mt-1 p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand-purple/20"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  isMobile: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, isMobile }) => {
  // Only show the last 3 toasts
  const visibleToasts = toasts.slice(-3);

  return (
    <div 
      className={`
        fixed z-[100] pointer-events-none flex flex-col justify-end gap-2
        ${isMobile ? 'inset-x-0 bottom-6 px-4' : 'bottom-6 right-6 w-[300px]'}
      `}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};