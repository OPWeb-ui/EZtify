
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
      <Link to={tool.path} className="block w-full h-full outline-none ui-element">
        <motion.div
          className="bg-white dark:bg-charcoal-900 rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all duration-300 shadow-layer-1 aspect-square"
          whileHover={{ 
            y: -4,
            boxShadow: "0 16px 32px -8px rgba(0, 0, 0, 0.08)",
            borderColor: "rgba(124, 58, 237, 0.2)" 
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Arrow */}
          <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-50 dark:bg-charcoal-800 flex items-center justify-center text-slate-300 dark:text-charcoal-600 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300 z-20">
            <ArrowRight size={14} />
          </div>

          {/* Content that moves up */}
          <div className="absolute inset-0 p-5 flex flex-col justify-start items-start text-left transition-transform duration-300 ease-out group-hover:-translate-y-6">
              <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center border border-black/5 dark:border-white/5 mb-3`}>
                  {React.isValidElement(tool.icon) 
                      ? React.cloneElement(tool.icon as React.ReactElement, { className: "w-6 h-6" }) 
                      : tool.icon}
              </div>
              <h3 className="text-base font-bold text-charcoal-900 dark:text-white leading-tight">
                  {tool.title}
              </h3>
          </div>
          
          {/* Description that fades in */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 p-5 pt-12 flex items-end bg-gradient-to-t from-white via-white/90 to-transparent dark:from-charcoal-900 dark:via-charcoal-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
               <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed line-clamp-3">
                   {tool.desc}
               </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};
