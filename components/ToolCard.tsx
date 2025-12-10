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
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative flex-shrink-0 snap-center group ${className || "w-full h-full"}`}
    >
      <Link to={tool.path} className="block h-full w-full outline-none">
        <motion.div
          className="h-full w-full bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden transition-all duration-300"
          whileHover={{ 
            y: -4,
            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Founder Signature: Focus Ring on Hover */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-brand-purple/10 dark:group-hover:border-brand-purple/20 transition-colors duration-300 pointer-events-none z-20" />
          
          {/* OLED Ambient Glow (Dark Mode Only) */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-brand-purple/5 dark:to-brand-purple/10 pointer-events-none z-0" />
          
          <div className="relative z-10 flex flex-col justify-between h-full p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center border border-white/10 dark:border-white/5 shadow-sm`}>
                {React.isValidElement(tool.icon) 
                  ? React.cloneElement(tool.icon as React.ReactElement, { className: "w-6 h-6" }) 
                  : tool.icon}
              </div>
              
              {/* Subtle Arrow Reveal */}
              <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-charcoal-400 dark:text-charcoal-500">
                <ArrowRight size={18} />
              </div>
            </div>
            
            {/* Content */}
            <div className="mt-4">
              <h3 className="text-lg font-heading font-bold text-charcoal-900 dark:text-charcoal-200 mb-2 tracking-tight group-hover:text-brand-purple transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed line-clamp-2">
                {tool.desc}
              </p>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};