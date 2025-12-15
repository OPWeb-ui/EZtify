
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Terminal, Cpu, Shield, ArrowRight, 
  Maximize2, MessageSquare, ExternalLink, Zap, Lock, HelpCircle
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { FeatureRequestModal } from '../components/FeatureRequestModal';
import { buttonTap, staggerContainer, fadeInUp, cardHover, standardLayoutTransition } from '../utils/animations';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { toolCategories, Tool } from '../utils/tool-list';

// --- Components ---

const ToolEntry: React.FC<{ tool: Tool }> = ({ tool }) => (
  <Link to={tool.path} className="block w-full outline-none group">
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="
        flex items-start gap-4 p-5 h-full
        bg-white dark:bg-charcoal-850 
        border border-slate-200 dark:border-charcoal-700
        rounded-2xl transition-all duration-200
        hover:border-brand-purple/50 dark:hover:border-brand-purple/50
        hover:shadow-xl hover:shadow-brand-purple/5
      "
    >
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${tool.color} ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
        {React.cloneElement(tool.icon, { size: 24, strokeWidth: 1.5 })}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-heading font-bold text-base text-charcoal-900 dark:text-white group-hover:text-brand-purple transition-colors truncate">
            {tool.title}
          </h3>
          <ArrowRight size={16} className="text-charcoal-300 dark:text-charcoal-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed line-clamp-2 font-medium">
          {tool.desc}
        </p>
      </div>
    </motion.div>
  </Link>
);

export const Home: React.FC = () => {
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  const totalTools = toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-charcoal-950 flex flex-col">
      <PageReadyTracker />
      
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-32 pb-12">
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-xs font-bold font-mono mb-6 border border-brand-purple/20">
             <Shield size={12} /> 100% CLIENT-SIDE • PRIVACY FIRST
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-charcoal-900 dark:text-white tracking-tight mb-6 leading-tight">
             Private File Tools<span className="text-brand-purple">.</span>
          </h1>
          
          <p className="text-lg text-charcoal-500 dark:text-charcoal-400 leading-relaxed mb-10 max-w-2xl mx-auto">
             A suite of fast utilities running entirely in your browser. <br className="hidden md:inline"/>
             Convert, edit, and manage files without ever uploading them to a server.
          </p>
        </motion.div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {toolCategories.map((cat) => (
            <motion.div key={cat.category} variants={fadeInUp} className="space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-charcoal-800/50">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400">
                  <Terminal size={14} />
                </div>
                <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400">
                  {cat.category}
                </h2>
                <span className="ml-auto text-[10px] font-mono text-charcoal-400 dark:text-charcoal-600 bg-slate-100 dark:bg-charcoal-800 px-1.5 py-0.5 rounded">
                  {cat.tools.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cat.tools.map((tool) => (
                  <ToolEntry key={tool.id} tool={tool} />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer / Actions */}
        <motion.div 
          variants={fadeInUp}
          className="mt-20 pt-10 border-t border-slate-200 dark:border-charcoal-800 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Ad / System Notice */}
          <div className="md:col-span-2">
             <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 border border-slate-200 dark:border-charcoal-800 flex flex-col sm:flex-row items-start gap-5 shadow-sm">
                <div className="p-3 bg-brand-purple/10 rounded-xl text-brand-purple shrink-0">
                   <Zap size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-bold font-heading text-charcoal-900 dark:text-white mb-2">Performance Note</h4>
                   <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed max-w-lg">
                      EZtify operates entirely within your browser's allocated memory. 
                      Processing speed depends on your device's CPU. 
                      Large files (>500MB) may require additional time but remain private.
                   </p>
                </div>
             </div>
          </div>

          {/* Functional Links */}
          <div className="flex flex-col gap-3">
             <button 
               onClick={() => setIsFeatureModalOpen(true)}
               className="flex items-center justify-between p-4 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 rounded-2xl hover:border-brand-purple/50 hover:shadow-md transition-all group text-left"
             >
                <div className="flex items-center gap-3">
                   <MessageSquare size={18} className="text-charcoal-400 group-hover:text-brand-purple transition-colors" />
                   <span className="text-xs font-bold font-mono text-charcoal-700 dark:text-slate-300">Submit Feature Request</span>
                </div>
                <ArrowRight size={16} className="text-charcoal-300" />
             </button>
             
             <Link 
               to="/faq"
               className="flex items-center justify-between p-4 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 rounded-2xl hover:border-brand-purple/50 hover:shadow-md transition-all group"
             >
                <div className="flex items-center gap-3">
                   <HelpCircle size={18} className="text-charcoal-400 group-hover:text-brand-purple transition-colors" />
                   <span className="text-xs font-bold font-mono text-charcoal-700 dark:text-slate-300">FAQ & Troubleshooting</span>
                </div>
                <ArrowRight size={16} className="text-charcoal-300" />
             </Link>

             <Link 
               to="/about"
               className="flex items-center justify-between p-4 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 rounded-2xl hover:border-brand-purple/50 hover:shadow-md transition-all group"
             >
                <div className="flex items-center gap-3">
                   <Cpu size={18} className="text-charcoal-400 group-hover:text-brand-purple transition-colors" />
                   <span className="text-xs font-bold font-mono text-charcoal-700 dark:text-slate-300">System Documentation</span>
                </div>
                <ArrowRight size={16} className="text-charcoal-300" />
             </Link>
          </div>
        </motion.div>
        
        <div className="mt-12 text-center">
           <span className="text-[10px] font-mono text-charcoal-400 dark:text-charcoal-600 uppercase tracking-widest">
              Total Modules: {totalTools} // Build v1.0.0
           </span>
        </div>
      </div>

      <FeatureRequestModal isOpen={isFeatureModalOpen} onClose={() => setIsFeatureModalOpen(false)} />
    </div>
  );
};
