
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle2, Info, XCircle, Terminal } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    // If duration is Infinity, do not set a timer
    if (toast.duration === Infinity) return;

    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, toast.duration]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  let Icon = Info;
  // Visual config based on type
  let iconColor = "text-blue-500";
  let bgIcon = "bg-blue-50 dark:bg-blue-900/20";
  
  if (isError) { 
    Icon = XCircle; 
    iconColor = "text-rose-500"; 
    bgIcon = "bg-rose-50 dark:bg-rose-900/20";
  } else if (isSuccess) { 
    Icon = CheckCircle2; 
    iconColor = "text-emerald-500"; 
    bgIcon = "bg-emerald-50 dark:bg-emerald-900/20";
  } else if (isWarning) { 
    Icon = AlertTriangle; 
    iconColor = "text-amber-500"; 
    bgIcon = "bg-amber-50 dark:bg-amber-900/20";
  }

  // Animation variants: Slide up slightly + Fade
  const variants = {
    initial: { opacity: 0, y: 8, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { duration: 0.15, ease: "easeOut" } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.98, 
      transition: { duration: 0.15, ease: "easeIn" } 
    }
  };

  return (
    <motion.div
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="
        pointer-events-auto relative
        w-full max-w-[380px]
        bg-white dark:bg-charcoal-900 
        border border-slate-200 dark:border-charcoal-700
        shadow-xl shadow-black/5 dark:shadow-black/20
        rounded-xl overflow-hidden
        flex flex-row items-start gap-3 p-4
        backdrop-blur-sm
      "
    >
      {/* Icon Area */}
      <div className={`shrink-0 p-2 rounded-lg ${bgIcon} ${iconColor}`}>
         <Icon size={20} strokeWidth={2} />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-xs font-bold font-mono text-charcoal-900 dark:text-white leading-tight uppercase tracking-wide">
          {toast.title}
        </h4>
        <p className="mt-1 text-xs text-charcoal-500 dark:text-slate-400 leading-relaxed font-medium">
          {toast.message}
        </p>

        {toast.action && (
          <button 
            onClick={(e) => { e.stopPropagation(); toast.action?.onClick(); }}
            className="mt-2.5 text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-charcoal-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors flex items-center gap-2 w-fit border border-slate-200 dark:border-charcoal-600 text-charcoal-700 dark:text-slate-200"
          >
            <Terminal size={10} /> {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button 
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1.5 rounded-md text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors -mr-1 -mt-1"
        aria-label="Dismiss"
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
        fixed z-[2000] pointer-events-none 
        left-0 right-0 flex flex-col items-center justify-end gap-3
        px-4 pb-4 md:pb-6
      `}
      style={{ bottom: 'env(safe-area-inset-bottom)' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
