
import React from 'react';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { staggerContainer, fadeInUp, buttonTap } from '../utils/animations';
import { Zap, Wifi, Cpu, Layers, Globe, Mail, ArrowRight, Layout, MonitorSmartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <motion.div 
    variants={fadeInUp}
    className="bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-md border border-slate-200 dark:border-charcoal-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 flex items-center justify-center mb-4 text-charcoal-700 dark:text-slate-200 group-hover:text-brand-purple group-hover:scale-110 transition-all duration-300">
      {icon}
    </div>
    <h3 className="font-heading font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed">{desc}</p>
  </motion.div>
);

export const About: React.FC = () => {
  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-pastel-bg dark:bg-charcoal-950 relative">
      <PageReadyTracker />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
         <div className="absolute bottom-[20%] right-[-5%] w-[50%] h-[50%] bg-brand-purple/5 dark:bg-brand-purple/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-6 border border-slate-200 dark:border-charcoal-700">
            <Cpu size={14} className="text-brand-purple" />
            <span>Next-Gen Architecture</span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-6 tracking-tight">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-indigo-500">Efficiency.</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-charcoal-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            EZtify leverages modern browser capabilities to deliver a responsive, desktop-grade experience for all your file utilities.
          </motion.p>
        </motion.div>

        {/* Core Values Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
        >
          <FeatureCard 
            icon={<Zap />}
            title="Instant Processing"
            desc="Operations are performed immediately on your device. No waiting for uploads or server queues."
          />
          <FeatureCard 
            icon={<MonitorSmartphone />}
            title="Cross-Platform"
            desc="Designed to work seamlessly on desktops, tablets, and mobile devices with a responsive interface."
          />
          <FeatureCard 
            icon={<Wifi />}
            title="Offline Capable"
            desc="Install EZtify as a Progressive Web App (PWA) to use all features even without an internet connection."
          />
        </motion.div>

        {/* Technical Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-heading font-bold text-charcoal-900 dark:text-white">
              Powered by WebAssembly
            </h2>
            <div className="space-y-4 text-charcoal-600 dark:text-slate-300 leading-relaxed">
              <p>
                The web has evolved. EZtify utilizes cutting-edge technologies like <strong>WebAssembly (WASM)</strong> and <strong>Service Workers</strong> to run complex logic efficiently right in your browser.
              </p>
              <p>
                By leveraging your device's processing power, we ensure that converting files, editing code, and compressing data is as fast as your hardware allows. This eliminates network latency and keeps your data completely private.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700">
                  <div className="text-2xl font-bold text-brand-purple mb-1">Zero</div>
                  <div className="text-xs font-bold text-charcoal-500 uppercase tracking-wide">Network Lag</div>
               </div>
               <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700">
                  <div className="text-2xl font-bold text-indigo-500 mb-1">100%</div>
                  <div className="text-xs font-bold text-charcoal-500 uppercase tracking-wide">Browser Based</div>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-brand-purple/10 rounded-3xl blur-2xl rotate-2" />
            <div className="relative bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 rounded-3xl p-8 shadow-xl">
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
                <Layers className="text-brand-purple" size={20} />
                Technology Stack
              </h3>
              <div className="space-y-3">
                {[
                  { name: "React 19", desc: "User Interface Library", icon: <Globe size={16} /> },
                  { name: "PDF-Lib", desc: "PDF Manipulation Engine", icon: <Layout size={16} /> },
                  { name: "Web Workers", desc: "Background Processing", icon: <Cpu size={16} /> },
                  { name: "Framer Motion", desc: "Fluid Animations", icon: <Zap size={16} /> }
                ].map((tech, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 hover:border-slate-300 dark:hover:border-charcoal-600 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-charcoal-700 flex items-center justify-center text-charcoal-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-charcoal-600">
                      {tech.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-charcoal-800 dark:text-slate-200">{tech.name}</h4>
                      <p className="text-xs text-charcoal-500 dark:text-slate-400">{tech.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer / Contact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-12 border-t border-slate-200 dark:border-charcoal-800"
        >
          <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-4">Start Working Smarter</h2>
          <p className="text-charcoal-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Ready to enhance your workflow? Head back to the dashboard to use our suite of tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <motion.button 
                whileTap={buttonTap}
                className="px-8 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold rounded-xl shadow-lg hover:bg-brand-purple dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight size={16} />
              </motion.button>
            </Link>
            <a href="mailto:eztifyapps@gmail.com">
              <motion.button 
                whileTap={buttonTap}
                className="px-8 py-3 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-slate-200 border border-slate-200 dark:border-charcoal-700 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-colors flex items-center gap-2"
              >
                <Mail size={16} /> Contact Support
              </motion.button>
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
