
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CornerDownRight } from 'lucide-react';
import { cardHover } from '../utils/animations'; 

export interface ToolData {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface ToolCardProps {
  tool: ToolData;
  className?: string;
}

const localItemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  return (
    <motion.div
      variants={localItemVariants}
      className={`relative group ${className || "w-full"}`}
    >
      <Link to={tool.path} className="block w-full h-full outline-none">
        <motion.div
          className="
            bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-700 
            relative overflow-hidden aspect-square flex flex-col justify-between p-5
            transition-colors duration-150 ease-linear
          "
          whileHover={cardHover}
          whileTap={{ scale: 0.98 }}
        >
          {/* Tech Corner Markers (Decor) */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-transparent group-hover:border-brand-purple transition-colors duration-200" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-transparent group-hover:border-brand-purple transition-colors duration-200" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-transparent group-hover:border-brand-purple transition-colors duration-200" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-transparent group-hover:border-brand-purple transition-colors duration-200" />

          {/* Header */}
          <div className="flex justify-between items-start">
             <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center border border-black/5 dark:border-white/10`}>
                  {React.isValidElement(tool.icon) 
                      ? React.cloneElement(tool.icon as React.ReactElement, { size: 20 }) 
                      : tool.icon}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-2 -mt-2">
                 <ArrowRight className="text-brand-purple -rotate-45 group-hover:rotate-0 transition-transform duration-300" size={20} />
              </div>
          </div>

          {/* Body */}
          <div className="mt-4">
              <h3 className="font-mono font-bold text-sm text-charcoal-900 dark:text-white mb-2 group-hover:text-brand-purple transition-colors">
                  {tool.title}
              </h3>
              <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 leading-relaxed line-clamp-3 font-mono">
                   {tool.desc}
              </p>
          </div>
          
          {/* Background Scanline (Subtle) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-purple/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-700 ease-linear pointer-events-none" />
        </motion.div>
      </Link>
    </motion.div>
  );
};
