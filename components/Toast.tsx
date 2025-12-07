import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, AlertCircle } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration ?? 6000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1 
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5, 
        transition: { duration: 0.2 } 
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="pointer-events-auto w-full max-w-md mx-auto mb-3 px-4 md:px-0"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border border-slate-200 dark:border-charcoal-700 shadow-2xl shadow-brand-purple/10 p-4 flex items-start gap-4 group">
        
        {/* Animated Gradient Glow Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-brand-orange'}`} />
        
        {/* Subtle Background Tint */}
        <div className={`absolute inset-0 opacity-[0.03] ${toast.type === 'error' ? 'bg-rose-500' : 'bg-brand-orange'} pointer-events-none`} />

        {/* Icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className={`absolute inset-0 rounded-full blur-md animate-pulse ${toast.type === 'error' ? 'bg-rose-500/30' : 'bg-brand-orange/30'}`} />
          {toast.type === 'error' ? (
             <AlertCircle className="relative w-6 h-6 text-rose-500" />
          ) : (
             <AlertTriangle className="relative w-6 h-6 text-brand-orange" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-bold tracking-wide mb-1 text-charcoal-800 dark:text-slate-100">
            {toast.title}
          </h3>
          <p className="text-xs md:text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed font-medium">
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
          className="relative z-10 -mr-1 -mt-1 p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand-purple/20"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
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
        fixed z-[100] pointer-events-none flex flex-col justify-end
        ${isMobile ? 'inset-x-0 bottom-20 px-2' : 'bottom-24 right-8 w-[400px]'}
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