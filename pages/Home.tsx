
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight, Shield, Zap, Layout } from 'lucide-react';
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
      
      {/* --- HERO SECTION --- */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden bg-[#F7F9FC] dark:bg-charcoal-900 border-b border-slate-200 dark:border-charcoal-800">
        
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <motion.div 
              className="absolute top-[-20%] right-[-5%] w-[500px] h-[500px] bg-brand-purple/5 dark:bg-brand-purple/5 rounded-full blur-[80px]"
              animate={!shouldReduceMotion ? { scale: [1, 1.1, 1], x: [0, 20, 0] } : {}}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
           <motion.div 
             className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-blue/5 dark:bg-brand-blue/5 rounded-full blur-[100px]"
             animate={!shouldReduceMotion ? { scale: [1, 0.9, 1], y: [0, 20, 0] } : {}}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
            >
              Smart Tools for Your <span className="text-brand-purple">Digital Files.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-2xl text-charcoal-600 dark:text-charcoal-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
            >
              A collection of powerful utilities running entirely in your browser. Convert, edit, compress, and organize files without ever uploading them.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <motion.button 
                whileTap={buttonTap}
                onClick={scrollToTools}
                className="px-8 py-4 bg-brand-purple hover:bg-brand-purpleDark text-white font-bold text-lg rounded-xl shadow-lg shadow-brand-purple/20 transition-all w-full sm:w-auto"
              >
                Explore All Tools
              </motion.button>
              <Link to="/about" className="w-full sm:w-auto">
                <motion.button 
                  whileTap={buttonTap}
                  className="px-8 py-4 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white border border-slate-200 dark:border-charcoal-600 font-bold text-lg rounded-xl hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-all w-full sm:w-auto"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <AdSlot zone="hero" className="mb-0 border-b border-slate-100 dark:border-charcoal-800" />

      {/* --- TOOLS GRID --- */}
      <section id="tools-section" className="px-4 py-20 bg-white dark:bg-charcoal-950">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal-900 dark:text-white mb-4">
              Essential Utilities
            </h2>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-lg max-w-2xl mx-auto">
              Fast, secure tools to manage your documents, images, and code. No installation required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolCategories.map((cat) => (
              cat.tools.map((tool) => (
                <Link key={tool.id} to={tool.path} className="group outline-none">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    whileHover={{ y: -4 }}
                    className="
                      h-full flex items-center p-5 rounded-2xl 
                      bg-[#F7F9FC] dark:bg-charcoal-900 
                      border border-transparent hover:border-slate-200 dark:hover:border-charcoal-700
                      hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20
                      hover:bg-white dark:hover:bg-charcoal-800
                      transition-all duration-300 ease-out
                    "
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-5 shadow-sm ${tool.color}`}>
                      {React.cloneElement(tool.icon, { size: 24 })}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-lg text-charcoal-900 dark:text-white mb-1 group-hover:text-brand-purple transition-colors truncate">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 line-clamp-2 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-charcoal-300 dark:text-charcoal-600 group-hover:text-brand-purple transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </motion.div>
                </Link>
              ))
            ))}
          </div>

          <div className="mt-16 text-center">
             <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={buttonTap}
                onClick={() => setIsFeatureModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-brand-purple text-white rounded-full font-bold shadow-lg shadow-brand-purple/25 hover:bg-brand-purpleDark transition-colors"
              >
                Request a New Tool
              </motion.button>
          </div>

        </div>
      </section>

      {/* --- FEATURE / VALUE PROP SECTION --- */}
      <section className="py-24 px-6 bg-[#F7F9FC] dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-charcoal-900 dark:text-white mb-8">
            Keep Your Simple Tasks Simple
          </h2>
          <p className="text-lg md:text-xl text-charcoal-600 dark:text-charcoal-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            EZtify is the privacy-first utility platform you’ll love. We provide the essential tools you need to handle files, code, and data—all processed securely on your device.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-charcoal-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                   <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">100% Private</h3>
                <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                   Files never leave your browser. No server uploads means your sensitive data stays with you.
                </p>
             </div>
             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-charcoal-700">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                   <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">Instant Speed</h3>
                <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                   Powered by WebAssembly for native-like performance without waiting for uploads or downloads.
                </p>
             </div>
             <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-charcoal-700">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                   <Layout size={24} />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">Easy to Use</h3>
                <p className="text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                   A clean, distraction-free interface designed to get the job done in seconds.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-white dark:bg-charcoal-950 border-t border-slate-200 dark:border-charcoal-800 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="text-left">
              <h4 className="font-bold text-charcoal-900 dark:text-white text-lg mb-1">EZtify</h4>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">© 2024 EZtify. All rights reserved.</p>
           </div>
           <div className="flex items-center gap-6 text-sm font-medium text-charcoal-600 dark:text-charcoal-300">
              <Link to="/about" className="hover:text-brand-purple transition-colors">About Us</Link>
              <a href="mailto:eztifyapps@gmail.com" className="hover:text-brand-purple transition-colors">Contact</a>
              <Link to="/" className="hover:text-brand-purple transition-colors">Privacy Policy</Link>
           </div>
        </div>
      </footer>

      <FeatureRequestModal isOpen={isFeatureModalOpen} onClose={() => setIsFeatureModalOpen(false)} />
    </div>
  );
};
