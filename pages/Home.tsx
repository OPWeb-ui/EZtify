
import React from 'react';
import { motion } from 'framer-motion';
import { toolCategories } from '../utils/tool-list';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { ToolLink } from '../components/ToolLink';
import { ArrowRight, Cpu, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IconBox } from '../components/IconBox';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

const subtextVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.2, ease: "easeOut" } }
};

export const Home: React.FC = () => {
  return (
    <div className="flex-1 w-full overflow-y-auto bg-nd-base flex flex-col pt-24 pb-20 px-6 font-sans">
      <PageReadyTracker />
      
      <div className="max-w-3xl mx-auto w-full">
        
        {/* 1. Hero */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          className="mb-24 md:mb-32"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-nd-primary mb-6 leading-[1.1]">
            Engineered for <br className="hidden md:block" />
            private file processing.
          </h1>
          
          <div className="max-w-xl">
            <p className="text-lg text-nd-secondary leading-relaxed mb-6">
              A precision suite of local-first utilities. 
              Process PDFs, images, and archives directly in your browser.
            </p>

            <motion.div 
              variants={subtextVariants}
              className="flex items-center gap-2.5 text-sm font-mono text-nd-muted"
            >
              <div className="flex items-center justify-center w-2 h-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span>Runs locally. No servers. No uploads.</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Capability Bridge */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 text-[10px] font-mono font-medium text-nd-muted uppercase tracking-widest flex items-center gap-4 opacity-60 pl-1"
        >
           <span>Convert</span>
           <span className="w-px h-2 bg-current opacity-30"></span>
           <span>Edit</span>
           <span className="w-px h-2 bg-current opacity-30"></span>
           <span>Organize</span>
           <span className="w-px h-2 bg-current opacity-30"></span>
           <span>Secure</span>
        </motion.div>

        {/* 2. Tools Directory */}
        <div className="space-y-20">
          {toolCategories.map((cat) => (
            <motion.section 
              key={cat.category}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={itemVariants}
            >
              <h3 className="text-xs font-semibold text-nd-muted uppercase tracking-wider mb-6 pl-1">
                {cat.category}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {cat.tools.map((tool) => (
                  <ToolLink key={tool.id} tool={tool} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* 3. Architecture */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
          className="mt-32 border-t border-nd-border pt-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12">
            <h3 className="text-sm font-medium text-nd-primary">System Architecture</h3>
            <div className="space-y-8">
              <p className="text-base text-nd-secondary leading-relaxed">
                EZtify is built on a <strong className="text-nd-primary font-medium">local-first</strong> architecture. 
                Unlike traditional web tools that upload files to a remote server, EZtify processes everything directly within your browser using WebAssembly.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-nd-primary">
                       <IconBox icon={<ShieldCheck />} size="sm" variant="success" />
                       <span className="text-sm font-bold">Zero Knowledge</span>
                    </div>
                    <p className="text-xs text-nd-muted leading-relaxed pl-1">Files never leave your device. Memory is cleared on tab close.</p>
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-nd-primary">
                       <IconBox icon={<Cpu />} size="sm" variant="brand" />
                       <span className="text-sm font-bold">Native Performance</span>
                    </div>
                    <p className="text-xs text-nd-muted leading-relaxed pl-1">Leverages multi-core processing for instant operations.</p>
                 </div>
              </div>
              <div className="pt-4">
                <Link to="/about" className="text-sm font-medium text-nd-primary hover:text-zinc-500 inline-flex items-center gap-1 transition-colors group">
                  System specifications <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
