import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  hidden: { opacity: 0, scale: 0.9, x: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative flex-shrink-0 snap-center group ${className || "w-full h-full"}`}
    >
      <Link to={tool.path} className="block h-full w-full outline-none focus:ring-4 focus:ring-brand-purple/30 rounded-3xl">
        <motion.div
          className="h-full w-full bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-charcoal-700 overflow-hidden relative shadow-lg"
          whileHover={{ 
            scale: 1.02,
            y: -5,
            zIndex: 10,
            boxShadow: "0 20px 40px -12px rgba(139, 92, 246, 0.2)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {/* Background Gradient Layer */}
          <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Subtle Permanent Glow */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.gradient} opacity-5 blur-3xl rounded-full`} />

          <div className="relative z-10 flex flex-col justify-between h-full p-6 md:p-5">
            
            {/* Icon Header */}
            <div className={`w-12 h-12 md:w-10 md:h-10 rounded-2xl ${tool.color} flex items-center justify-center border border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              {/* Clone element to force size prop if it's an icon, or just wrap it */}
              {React.isValidElement(tool.icon) 
                ? React.cloneElement(tool.icon as React.ReactElement, { className: "w-6 h-6 md:w-5 md:h-5" }) 
                : tool.icon}
            </div>
            
            {/* Content */}
            <div className="min-h-0">
              <h3 className="text-lg md:text-base font-bold text-charcoal-900 dark:text-white mb-2 group-hover:text-brand-purple transition-colors truncate">
                {tool.title}
              </h3>
              <p className="text-sm md:text-xs text-charcoal-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {tool.desc}
              </p>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};