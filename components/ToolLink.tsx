
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tool } from '../utils/tool-list';
import { IconBox } from './IconBox';

interface ToolLinkProps {
  tool: Tool;
  onClose?: () => void;
  variant?: 'full' | 'compact';
}

export const ToolLink: React.FC<ToolLinkProps> = ({ tool, onClose, variant = 'full' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Compact variant (Drawer/Menu) - Slightly refined
  if (variant === 'compact') {
    return (
      <Link
        to={tool.path}
        onClick={onClose}
        className="group block w-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white rounded-xl"
        aria-label={tool.title}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200">
          <div className="mb-3">
             <IconBox 
               icon={tool.icon} 
               size="md" 
               active={isHovered} 
               toolAccentColor={tool.accentColor} 
             />
          </div>
          <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 text-center leading-tight">
            {tool.title}
          </span>
        </div>
      </Link>
    );
  }

  // Full variant (Landing Page) - Module Style
  return (
    <Link
      to={tool.path}
      onClick={onClose}
      className="group block w-full outline-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`
          flex flex-row items-start gap-4 p-4 rounded-xl border transition-all duration-200 h-full
          ${isHovered 
            ? 'bg-white dark:bg-charcoal-800 border-zinc-300 dark:border-charcoal-600 shadow-sm shadow-zinc-200/50 dark:shadow-black/20' 
            : 'bg-white/40 dark:bg-charcoal-900/40 border-zinc-200 dark:border-charcoal-800'
          }
        `}
      >
        {/* Icon Module */}
        <div className="shrink-0">
           <IconBox 
              icon={tool.icon} 
              size="md" 
              active={isHovered} 
              toolAccentColor={tool.accentColor} 
           />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 transition-colors">
              {tool.title}
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {tool.desc}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};
