
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight, Shield, Zap, Layout, Terminal, Activity, Cpu, Code, Server, Lock } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { FeatureRequestModal } from '../components/FeatureRequestModal';
import { Link } from 'react-router-dom';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { toolCategories } from '../utils/tool-list';

export const Home: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  const scrollToTools = () => {
    document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-white dark:bg-charcoal-950">
      <PageReadyTracker />
      
      {/* --- TECH HERO SECTION --- */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden bg-slate-50 dark:bg-charcoal-950 border-b border-slate-200 dark:border-charcoal-800">
        
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-mono font-bold uppercase tracking-wider mb-6">
                <Terminal size={12} />
                <span>Client-Side v1.0.0</span>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
              >
                Local.<br/>
                Private.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-indigo-500">Powerful.</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-charcoal-600 dark:text-charcoal-400 max-w-xl mb-10 leading-relaxed font-mono"
              >
                // Execute advanced file operations directly in your browser. No servers. No latency. 100% privacy.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileTap={buttonTap}
                  onClick={scrollToTools}
                  className="px-8 py-4 bg-charcoal-900 dark:bg-white hover:bg-charcoal-800 dark:hover:bg-slate-200 text-white dark:text-charcoal-900 font-bold text-sm uppercase tracking-wide rounded-lg shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Launch Tools <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <Link to="/about">
                  <motion.button 
                    whileTap={buttonTap}
                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white border border-slate-200 dark:border-charcoal-700 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-slate-50 dark:hover:bg-charcoal-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Code size={16} /> Documentation
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Dashboard Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
               <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple to-indigo-500 rounded-2xl blur opacity-20 dark:opacity-30" />
               <div className="relative bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 rounded-xl shadow-2xl overflow-hidden">
                  {/* Fake Browser Header */}
                  <div className="h-8 bg-slate-100 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 flex items-center px-3 gap-2">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                     </div>
                     <div className="flex-1 text-center">
                        <div className="inline-block px-2 py-0.5 bg-white dark:bg-charcoal-900 rounded text-[10px] text-charcoal-400 font-mono">eztify.local</div>
                     </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6 grid grid-cols-2 gap-4 font-mono text-xs">
                     <div className="col-span-2 bg-slate-50 dark:bg-charcoal-850 p-4 rounded-lg border border-slate-100 dark:border-charcoal-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Activity className="text-green-500" size={16} />
                           <span className="text-charcoal-600 dark:text-slate-300 font-bold">System Status</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">ONLINE</span>
                     </div>
                     
                     <div className="bg-slate-50 dark:bg-charcoal-850 p-4 rounded-lg border border-slate-100 dark:border-charcoal-700">
                        <div className="text-charcoal-400 mb-1">Architecture</div>
                        <div className="text-charcoal-800 dark:text-white font-bold text-lg flex items-center gap-2"><Cpu size={16}/> WASM</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-charcoal-850 p-4 rounded-lg border border-slate-100 dark:border-charcoal-700">
                        <div className="text-charcoal-400 mb-1">Privacy</div>
                        <div className="text-charcoal-800 dark:text-white font-bold text-lg flex items-center gap-2"><Lock size={16}/> Local</div>
                     </div>
                     
                     <div className="col-span-2 bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-[10px] leading-relaxed overflow-hidden">
                        <div className="flex gap-2"><span className="text-blue-400">➜</span> <span>Initializing secure environment...</span></div>
                        <div className="flex gap-2"><span className="text-blue-400">➜</span> <span>Loading WebAssembly modules...</span></div>
                        <div className="flex gap-2"><span className="text-blue-400">➜</span> <span className="text-green-400">Ready.</span> Waiting for input.</div>
                        <div className="mt-2 h-1 w-3 bg-slate-500 animate-pulse" />
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      <AdSlot zone="hero" className="mb-0 border-b border-slate-100 dark:border-charcoal-800" />

      {/* --- TOOLS GRID --- */}
      <section id="tools-section" className="px-4 py-20 bg-white dark:bg-charcoal-950">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-end justify-between mb-12 border-b border-slate-200 dark:border-charcoal-800 pb-4">
            <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal-900 dark:text-white mb-2">
                Utility Belt
                </h2>
                <p className="text-charcoal-500 dark:text-charcoal-400 font-mono text-sm">
                / Select a module to execute
                </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolCategories.map((cat) => (
              cat.tools.map((tool) => (
                <Link key={tool.id} to={tool.path} className="group outline-none">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    whileHover={{ y: -2 }}
                    className="
                      h-full flex items-center p-4 rounded-xl 
                      bg-slate-50 dark:bg-charcoal-900 
                      border border-slate-200 dark:border-charcoal-800
                      hover:border-brand-purple dark:hover:border-brand-purple
                      hover:bg-white dark:hover:bg-charcoal-850
                      transition-all duration-200
                    "
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-sm ${tool.color}`}>
                      {React.cloneElement(tool.icon, { size: 20 })}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-sm text-charcoal-900 dark:text-white mb-0.5 group-hover:text-brand-purple transition-colors truncate font-mono">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 line-clamp-1">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="w-6 h-6 flex items-center justify-center text-charcoal-300 dark:text-charcoal-600 group-hover:text-brand-purple transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                </Link>
              ))
            ))}
          </div>

          <div className="mt-16 text-center">
             <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={buttonTap}
                onClick={() => setIsFeatureModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 rounded-lg font-mono text-xs font-bold border border-charcoal-200 dark:border-charcoal-700 hover:border-brand-purple transition-colors"
              >
                <Server size={14} /> // REQUEST_NEW_MODULE
              </motion.button>
          </div>

        </div>
      </section>

      {/* --- FEATURE / VALUE PROP SECTION --- */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-charcoal-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 font-mono">01. Privacy_Core</h3>
                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                    Client-side sandbox execution ensures data sovereignty. Zero bytes transferred to external servers.
                    </p>
                </div>
             </div>
             
             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-charcoal-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 font-mono">02. Velocity_Engine</h3>
                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                    Native WASM modules eliminate network latency overhead. Instantaneous feedback loop.
                    </p>
                </div>
             </div>

             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-charcoal-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Layout size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2 font-mono">03. UX_Optimized</h3>
                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                    Responsive, distraction-free interface engineered for maximum workflow efficiency.
                    </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-white dark:bg-charcoal-950 border-t border-slate-200 dark:border-charcoal-800 text-center font-mono text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="text-left">
              <h4 className="font-bold text-charcoal-900 dark:text-white mb-1">EZtify_Systems</h4>
              <p className="text-charcoal-500 dark:text-charcoal-400">© 2025 Build v2.0. All systems nominal.</p>
           </div>
           <div className="flex items-center gap-6 text-charcoal-600 dark:text-charcoal-300">
              <Link to="/about" className="hover:text-brand-purple transition-colors">[ About ]</Link>
              <a href="mailto:eztifyapps@gmail.com" className="hover:text-brand-purple transition-colors">[ Contact ]</a>
              <Link to="/" className="hover:text-brand-purple transition-colors">[ Privacy ]</Link>
           </div>
        </div>
      </footer>

      <FeatureRequestModal isOpen={isFeatureModalOpen} onClose={() => setIsFeatureModalOpen(false)} />
    </div>
  );
};
