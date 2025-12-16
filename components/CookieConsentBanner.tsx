
import React from 'react';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onReject }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      // Increased z-index to ensure it is on top of all other elements like the StickyBar.
      className="fixed bottom-0 left-0 right-0 z-[1100] p-4 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-black/5 dark:shadow-black/20 flex flex-col md:flex-row items-center gap-4 pointer-events-auto">
        
        {/* Icon and Text */}
        <div className="flex-1 flex items-center gap-3 w-full text-left">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Cookie className="w-5 h-5" />
          </div>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed flex-1">
            EZtify uses local storage to save your preferences and improve your experience. We never collect personal data.
          </p>
        </div>

        {/* Actions - Full width on mobile for easier tapping */}
        <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto">
          <motion.button
            whileTap={buttonTap}
            onClick={onReject}
            className="flex-1 md:flex-none justify-center px-4 py-2 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center"
          >
            Reject
          </motion.button>
          <motion.button
            whileTap={buttonTap}
            onClick={onAccept}
            className="flex-1 md:flex-none justify-center px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-lg shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center"
          >
            Accept
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
