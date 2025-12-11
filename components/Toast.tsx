
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  index: number;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss, index }) => {
  useEffect(() => {
    // Shorter duration for snappier feel
    const duration = toast.duration ?? 2800;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, toast.duration]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  let Icon = Info;
  let iconColor = "text-brand-blue";
  
  if (isError) { Icon = AlertCircle; iconColor = "text-rose-500"; }
  else if (isSuccess) { Icon = CheckCircle2; iconColor = "text-brand-green"; }
  else if (isWarning) { Icon = AlertTriangle; iconColor = "text-brand-orange"; }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      onClick={() => onDismiss(toast.id)}
      className={`
        pointer-events-auto cursor-pointer
        flex items-center gap-3 pl-3 pr-4
        h-[48px] /* slightly taller for native feel */
        rounded-[18px]
        bg-white dark:bg-charcoal-850 /* Solid elevated surface */
        border border-slate-100 dark:border-white/5
        shadow-layer-3 dark:shadow-layer-dark-3
        w-auto min-w-[280px] max-w-[360px]
        select-none group
      `}
      style={{
        zIndex: 2000 - index
      }}
    >
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[14px] font-semibold text-charcoal-900 dark:text-white leading-snug truncate">
          {toast.title}
          {toast.message && toast.message !== toast.title && (
             <span className="font-normal text-charcoal-500 dark:text-charcoal-400 ml-1.5 text-[13px]">
               {toast.message}
             </span>
          )}
        </p>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  isMobile: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const visibleToasts = toasts.slice(-3);

  return (
    <div 
      className={`
        fixed z-[200] pointer-events-none flex flex-col gap-2 items-center
        left-1/2 -translate-x-1/2
        bottom-28 md:bottom-12 /* Raised slightly to clear floating bars */
        w-full max-w-[400px]
      `}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast, index) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};
