import React from 'react';
import { motion } from 'framer-motion';

interface HeroPillProps {
  children: React.ReactNode;
}

export const HeroPill: React.FC<HeroPillProps> = ({ children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/60 dark:bg-charcoal-800/60 backdrop-blur-md border border-slate-200 dark:border-charcoal-700 rounded-2xl p-4 mb-8 max-w-lg mx-auto text-sm text-charcoal-600 dark:text-slate-300 leading-relaxed shadow-sm text-center"
    >
      <p>{children}</p>
    </motion.div>
  );
};