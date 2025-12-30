
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tool } from '../utils/tool-list';
import { ArrowRight } from 'lucide-react';

interface ToolLinkProps {
  tool: Tool;
  onClose?: () => void;
  variant?: 'full' | 'compact';
}

export const ToolLink: React.FC<ToolLinkProps> = ({ tool, onClose, variant = 'full' }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Cards are clean monochrome (White on Dark Launcher)
  return (
    <motion.div variants={itemVariants}>
      <Link
        to={tool.path}
        onClick={onClose}
        className="group block w-full outline-none"
      >
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="
            relative flex items-center gap-4 p-4 rounded-2xl border border-transparent
            bg-white shadow-sm transition-all duration-300
            hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:border-stone-200
          "
        >
          {/* Icon - High contrast, strictly neutral */}
          <div className="shrink-0 w-11 h-11 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#111111] group-hover:text-white transition-colors duration-300">
             {React.cloneElement(tool.icon, { size: 20, strokeWidth: 2.2 })}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-[#111111] leading-tight tracking-tight truncate">
                {tool.title}
              </h3>
              <ArrowRight 
                size={14} 
                className="text-[#111111] opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300" 
                strokeWidth={3}
              />
            </div>
            <p className="text-[10px] text-stone-500 font-medium truncate mt-1">
              {tool.desc}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};
