
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { buttonTap } from '../utils/animations';

export const ShareButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : 'https://eztify.com';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EZtify — Private PDF Tools',
          text: 'Try EZtify — simple, private PDF tools in your browser.',
          url: url,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setIsModalOpen(true);
        }
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleShare}
        aria-label="Share EZtify"
        whileTap={buttonTap}
        whileHover={{ scale: 1.05 }}
        className="
          group relative flex items-center gap-2 h-9 px-3 rounded-md
          bg-white dark:bg-charcoal-800 
          text-charcoal-700 dark:text-slate-300
          border border-slate-200 dark:border-charcoal-700
          hover:border-brand-purple/50 hover:text-brand-purple
          text-xs font-mono font-bold transition-all duration-200
          shadow-sm
        "
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden md:inline">[ SHARE ]</span>
      </motion.button>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url={url} 
      />
    </>
  );
};
