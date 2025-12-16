
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, X, ArrowRight, Undo2 } from 'lucide-react';
import { ToastMessage } from '../types';
import { toastVariants } from '../utils/animations';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  // Auto-dismiss logic only for Warnings (and Undo which is treated as actionable warning)
  // Errors do NOT auto-dismiss (require acknowledgement) unless explicit duration provided (legacy support)
  const isError = toast.type === 'error';
  const shouldAutoDismiss = !isError || (toast.duration && toast.duration !== Infinity);

  useEffect(() => {
    if (!shouldAutoDismiss) return;
    
    // Warnings linger a bit to be read (e.g. 4s), Errors if timed (rare) maybe longer.
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, toast.duration, shouldAutoDismiss]);

  // Icon & Style Selection
  let Icon = AlertTriangle;
  let containerClass = "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100";
  let iconClass = "text-amber-500 dark:text-amber-400";

  if (toast.type === 'error') {
    Icon = XCircle;
    containerClass = "bg-white dark:bg-charcoal-800 border-rose-100 dark:border-rose-900/50 text-rose-900 dark:text-rose-100 shadow-xl shadow-rose-900/5";
    iconClass = "text-rose-500 dark:text-rose-400";
  } else if (toast.type === 'undo') {
    Icon = Undo2;
    // Undo is a form of warning/action
    containerClass = "bg-white dark:bg-charcoal-800 border-charcoal-200 dark:border-charcoal-700 text-charcoal-900 dark:text-white";
    iconClass = "text-charcoal-500 dark:text-charcoal-400";
  }

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        pointer-events-auto
        w-full max-w-[340px]
        border rounded-xl
        flex items-start gap-3 p-4
        shadow-sm backdrop-blur-sm
        select-none
        ${containerClass}
      `}
    >
      <div className={`shrink-0 mt-0.5 ${iconClass}`}>
        <Icon size={18} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold leading-tight mb-0.5">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            {toast.message}
          </p>
        )}
        
        {/* Action Button */}
        {toast.action && (
          <button 
            onClick={(e) => { e.stopPropagation(); toast.action?.onClick(); onDismiss(toast.id); }}
            className="mt-2 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            {toast.action.label} <ArrowRight size={12} />
          </button>
        )}
      </div>

      <button 
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  isMobile: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, isMobile }) => {
  return (
    <div 
      className={`
        fixed z-[2000] pointer-events-none flex flex-col gap-2
        ${isMobile 
          ? 'bottom-4 left-4 right-4 items-center' 
          : 'bottom-8 right-8 items-end'
        }
      `}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
