
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessIndicatorProps {
  visible: boolean;
}

export const SuccessIndicator: React.FC<SuccessIndicatorProps> = ({ visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="
              flex items-center justify-center
              w-20 h-20 rounded-[1.75rem]
              bg-[#111111] dark:bg-white
              shadow-2xl shadow-black/10 dark:shadow-black/30
              border border-stone-800 dark:border-stone-200
            "
          >
            <Check 
              className="text-[#84CC16] dark:text-[#111111]" 
              size={40} 
              strokeWidth={4} 
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
