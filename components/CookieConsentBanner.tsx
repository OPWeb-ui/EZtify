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
      // Increased z-index to 150 to ensure it sits above the StickyBar (z-100) on mobile
      className="fixed bottom-0 left-0 right-0 z-[150] p-4 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-xl border border-slate-200 dark:border-charcoal-700 shadow-2xl shadow-brand-purple/10 flex flex-col md:flex-row items-center gap-4 pointer-events-auto">
        
        {/* Icon and Text */}
        <div className="flex-1 flex items-center gap-3 w-full text-left">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Cookie className="w-5 h-5" />
          </div>
          <p className="text-xs md:text-sm text-charcoal-600 dark:text-slate-300 leading-relaxed flex-1">
            EZtify uses local storage to save your preferences and improve your experience. We never collect personal data.
          </p>
        </div>

        {/* Actions - Full width on mobile for easier tapping */}
        <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto">
          <motion.button
            whileTap={buttonTap}
            onClick={onReject}
            className="flex-1 md:flex-none justify-center px-4 py-2 text-charcoal-500 dark:text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors flex items-center"
          >
            Reject
          </motion.button>
          <motion.button
            whileTap={buttonTap}
            onClick={onAccept}
            className="flex-1 md:flex-none justify-center px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-lg shadow-md shadow-brand-purple/20 hover:bg-brand-purpleDark transition-colors flex items-center"
          >
            Accept
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};