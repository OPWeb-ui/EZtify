import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ isVisible, onClick }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className="
            fixed z-50 
            bottom-6 right-6 md:bottom-8 md:right-8
            w-12 h-12 md:w-14 md:h-14
            flex items-center justify-center
            rounded-full 
            bg-brand-purple text-white 
            shadow-lg shadow-brand-purple/40
            border border-white/20
            cursor-pointer
            outline-none
          "
          aria-label="Scroll to top"
        >
          {/* Ripple/Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          
          <ArrowUp className="w-6 h-6 md:w-7 md:h-7 relative z-10" strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
