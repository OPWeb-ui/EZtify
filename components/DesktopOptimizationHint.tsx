
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X } from 'lucide-react';
import { useLayoutContext } from './Layout';

export const DesktopOptimizationHint: React.FC = () => {
  const { isMobile } = useLayoutContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile
    if (!isMobile) return;

    // Check if previously dismissed
    const dismissed = localStorage.getItem('eztify-desktop-hint-dismissed');
    if (!dismissed) {
      // Small delay to appear after UI settles, enhancing "system note" feel
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('eztify-desktop-hint-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="w-full px-4 overflow-hidden z-40 block md:hidden"
        >
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg shadow-sm">
            <div className="flex items-start gap-2.5 text-[10px] font-mono font-medium text-charcoal-600 dark:text-slate-300 leading-tight">
              <Monitor size={14} className="text-brand-purple shrink-0 mt-px" />
              <span>For complex workflows, desktop provides the most advanced controls.</span>
            </div>
            <button 
              onClick={dismiss}
              className="p-1.5 -mr-1 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-200 bg-transparent"
              aria-label="Dismiss hint"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
