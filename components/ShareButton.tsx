import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

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
        whileTap={{ scale: 0.95 }}
        className="
          group relative flex items-center gap-2 h-9 px-3 md:pl-3 md:pr-4 rounded-full
          bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10
          hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10
          text-charcoal-600 dark:text-slate-300
          text-sm font-medium transition-all duration-200
          outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50
        "
      >
        <Share2 className="w-4 h-4 text-charcoal-400 dark:text-slate-400 group-hover:text-brand-purple transition-colors" />
        <span className="hidden md:inline">Share</span>
      </motion.button>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url={url} 
      />
    </>
  );
};