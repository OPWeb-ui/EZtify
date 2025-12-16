
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction: () => void;
  actionLabel: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "Workspace Empty", 
  description = "Add files to continue working.", 
  onAction, 
  actionLabel,
  icon
}) => {
  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center max-w-sm"
      >
        <div className="w-20 h-20 bg-white dark:bg-charcoal-800 rounded-3xl flex items-center justify-center mb-6 text-charcoal-300 dark:text-charcoal-600 shadow-sm border border-slate-100 dark:border-charcoal-700">
           {icon || <Layers size={40} strokeWidth={1.5} />}
        </div>
        
        <h3 className="text-xl font-bold font-heading text-charcoal-800 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-8 leading-relaxed font-medium">
          {description}
        </p>
        
        <motion.button
          whileTap={buttonTap}
          whileHover={{ scale: 1.02 }}
          onClick={onAction}
          className="px-8 py-3.5 bg-brand-purple text-white font-bold font-mono rounded-xl shadow-lg shadow-brand-purple/20 hover:bg-brand-purpleDark transition-all flex items-center gap-2.5 text-sm uppercase tracking-wide"
        >
          <Plus size={18} /> {actionLabel}
        </motion.button>
      </motion.div>
    </div>
  );
};
