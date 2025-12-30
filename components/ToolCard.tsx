
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
            bg-white dark:bg-gray-900 rounded-3xl 
            border border-gray-100 dark:border-gray-800 
            relative overflow-hidden aspect-square flex flex-col justify-between p-6
            shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20
            transition-all duration-300
          "
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
             <IconBox 
                icon={tool.icon} 
                size="md" 
                active={isHovered} 
                toolAccentColor={accentColor}
                variant="tool"
             />
             
             <div className={`p-2 rounded-full transition-colors duration-200 ${isHovered ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'}`}>
                 <ArrowRight 
                    className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300" 
                    size={20} 
                    strokeWidth={2}
                 />
             </div>
          </div>

          {/* Body */}
          <div className="mt-4 relative z-10 flex-1">
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2 tracking-tight">
                  {tool.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 font-medium">
                   {tool.desc}
              </p>
          </div>

          {/* Usage Stat */}
          {usageCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <Activity size={12} />
                <span>{formatUsageCount(usageCount)} runs</span>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
};
