
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle2, Info, Terminal } from 'lucide-react';
import { ToastMessage } from '../types';
import { toastVariants } from '../utils/animations';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  index: number;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss, index }) => {
  useEffect(() => {
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
  let accentColor = "bg-blue-500";
  let textColor = "text-blue-500";
  
  if (isError) { Icon = AlertTriangle; accentColor = "bg-rose-500"; textColor = "text-rose-500"; }
  else if (isSuccess) { Icon = CheckCircle2; accentColor = "bg-green-500"; textColor = "text-green-500"; }
  else if (isWarning) { Icon = AlertTriangle; accentColor = "bg-amber-500"; textColor = "text-amber-500"; }

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        pointer-events-auto relative
        w-full max-w-[340px]
        bg-white dark:bg-charcoal-900 
        border border-slate-200 dark:border-charcoal-700
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        rounded-lg overflow-hidden
        flex flex-col
        group select-none
      `}
      style={{ zIndex: 2000 - index }}
    >
      {/* Tech Header Strip */}
      <div className={`h-1 w-full ${accentColor}`} />
      
      <div className="flex p-4 gap-4 items-start">
        <div className={`shrink-0 mt-0.5 p-2 rounded-md bg-slate-50 dark:bg-charcoal-800 ${textColor}`}>
           <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between gap-2">
             <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-charcoal-900 dark:text-white leading-none">
               {toast.title}
             </h4>
             <span className="text-[10px] text-charcoal-400 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: false })}</span>
          </div>
          
          <p className="mt-2 text-xs font-mono text-charcoal-600 dark:text-slate-300 leading-relaxed break-words">
            {toast.message}
          </p>

          {toast.action && (
            <button 
              onClick={(e) => { e.stopPropagation(); toast.action?.onClick(); }}
              className="mt-3 text-[10px] font-bold uppercase tracking-wide bg-charcoal-100 dark:bg-charcoal-800 px-3 py-1.5 rounded hover:bg-charcoal-200 dark:hover:bg-charcoal-700 transition-colors flex items-center gap-2"
            >
              <Terminal size={10} /> {toast.action.label}
            </button>
          )}
        </div>

        <button 
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-charcoal-400 hover:text-rose-500 transition-colors p-1 -mr-2 -mt-2"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress Bar */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (toast.duration || 3000) / 1000, ease: "linear" }}
        className={`h-0.5 w-full ${accentColor} opacity-20`}
      />
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
        flex flex-col gap-3 items-end
        right-0 bottom-0 p-4 md:p-6
        max-h-screen overflow-hidden
      `}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};
