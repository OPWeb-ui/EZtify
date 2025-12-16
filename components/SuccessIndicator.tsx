
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="
              flex items-center justify-center
              w-24 h-24
              text-brand-purple
              filter drop-shadow-sm
            "
          >
            <Check size={64} strokeWidth={3} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
