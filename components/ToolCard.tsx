import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

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

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <motion.div
      variants={itemVariants}
      className="relative flex-shrink-0 w-[280px] md:w-[320px] h-[360px] snap-center group"
    >
      <Link to={tool.path} className="block h-full w-full outline-none focus:ring-4 focus:ring-brand-purple/30 rounded-3xl">
        <motion.div
          className="h-full w-full bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-charcoal-700 overflow-hidden relative shadow-lg"
          whileHover={{ 
            scale: 1.05,
            y: -10,
            zIndex: 10,
            boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Gradient Layer */}
          <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Subtle Permanent Glow */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.gradient} opacity-10 blur-3xl rounded-full`} />

          <div className="relative z-10 flex flex-col h-full p-6">
            
            {/* Icon Header */}
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center border border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {tool.icon}
              </div>
              
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-charcoal-800 flex items-center justify-center text-charcoal-400 group-hover:bg-brand-purple group-hover:text-white transition-all duration-300 transform group-hover:rotate-[-45deg]">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-charcoal-900 dark:text-white mb-3 group-hover:text-brand-purple transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {tool.desc}
              </p>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-charcoal-700/50 flex items-center gap-2 text-xs font-bold text-charcoal-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-charcoal-600 dark:group-hover:text-slate-300 transition-colors">
              <Sparkles className="w-3 h-3 text-brand-purple" />
              <span>Open Tool</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};