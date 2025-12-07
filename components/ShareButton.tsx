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
        className="
          relative overflow-hidden group
          flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-1.5
          bg-transparent hover:bg-slate-100 dark:hover:bg-charcoal-800
          text-charcoal-500 hover:text-charcoal-800 dark:text-slate-400 dark:hover:text-white rounded-full
          border border-slate-200/60 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20
          transition-all cursor-pointer outline-none 
          focus:ring-2 focus:ring-brand-purple/20
        "
        whileHover={{ 
          scale: 1.02,
          backgroundColor: "rgba(241, 245, 249, 0.8)" 
        }}
        whileTap={{ scale: 0.96 }}
      >
        <div className="relative z-10 text-charcoal-400 dark:text-slate-500 group-hover:text-brand-purple transition-colors duration-300">
          <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
        
        <span className="relative z-10 text-xs font-bold tracking-wide hidden md:inline transition-colors duration-300">
          Share
        </span>
      </motion.button>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url={url} 
      />
    </>
  );
};