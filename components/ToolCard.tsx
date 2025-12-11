
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export interface ToolData {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  gradient: string;
}

interface ToolCardProps {
  tool: ToolData;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative group ${className || "w-full"}`}
    >
      <Link to={tool.path} className="block w-full outline-none ui-element">
        <motion.div
          className="bg-white dark:bg-charcoal-900 rounded-[20px] border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all duration-300 shadow-layer-1"
          whileHover={{ 
            y: -4,
            boxShadow: "0 16px 32px -8px rgba(0, 0, 0, 0.08)",
            borderColor: "rgba(124, 58, 237, 0.2)" 
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex items-start justify-between mb-5">
              <div className={`w-12 h-12 rounded-2xl ${tool.color} flex items-center justify-center border border-black/5 dark:border-white/5`}>
                {React.isValidElement(tool.icon) 
                  ? React.cloneElement(tool.icon as React.ReactElement, { className: "w-6 h-6" }) 
                  : tool.icon}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-charcoal-800 flex items-center justify-center text-slate-300 dark:text-charcoal-600 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                 <ArrowRight size={14} />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 leading-tight">
              {tool.title}
            </h3>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
              {tool.desc}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};
