
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import { cardHover } from '../utils/animations'; 
import { Tool } from '../utils/tool-list'; 
import { IconBox } from './IconBox';
import { getToolUsage, formatUsageCount } from '../services/usageTracker';

interface ToolCardProps {
  tool: Tool; 
  className?: string;
}

const localItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  // Load usage stats on mount
  useEffect(() => {
    setUsageCount(getToolUsage(tool.id));
  }, [tool.id]);

  // Determine accent color safely
  const accentColor = (tool as any).accentColor || '#71717a';

  return (
    <motion.div
      variants={localItemVariants}
      className={`relative group ${className || "w-full"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={tool.path} className="block w-full h-full outline-none">
        <motion.div
          className="
            bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 
            relative overflow-hidden aspect-square flex flex-col justify-between p-5
            transition-colors duration-200
          "
          whileHover={cardHover}
          whileTap={{ scale: 0.98 }}
          style={{ borderColor: isHovered ? accentColor : '' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
             <IconBox 
                icon={tool.icon} 
                size="md" 
                active={isHovered} 
                toolAccentColor={accentColor}
             />
             
             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-2 -mt-2">
                 <ArrowRight 
                    className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" 
                    size={20} 
                    strokeWidth={1.5} 
                    style={{ color: accentColor }}
                 />
             </div>
          </div>

          {/* Body */}
          <div className="mt-4 relative z-10 flex-1">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-white mb-2 transition-colors">
                  {tool.title}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                   {tool.desc}
              </p>
          </div>

          {/* Usage Stat (Subtle Footer) */}
          {usageCount > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                <Activity size={10} />
                <span>{formatUsageCount(usageCount)} runs</span>
            </div>
          )}
          
          {/* Subtle Background Tint on Hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
};
