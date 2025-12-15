
import React from 'react';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { 
  ShieldCheck, Cpu, Database, Zap, Lock, FileStack, Layers, Globe 
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-charcoal-950 overflow-y-auto custom-scrollbar">
      <PageReadyTracker />
      
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        {/* 1. Intro */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-xs font-bold font-mono mb-6 border border-brand-purple/20">
             <Globe size={12} /> PRIVATE FILE UTILITIES
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-charcoal-900 dark:text-white tracking-tight mb-6">
            Local tools for global privacy.
          </h1>
          <p className="text-lg text-charcoal-500 dark:text-charcoal-400 max-w-2xl mx-auto leading-relaxed">
            EZtify provides essential file manipulation tools that run entirely in your browser. No servers, no uploads, no data collection.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-16"
        >
          {/* 2. What You Can Do */}
          <section>
            <motion.h2 variants={fadeInUp} className="text-sm font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500 mb-6 font-mono">
              Capabilities
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={fadeInUp} className="p-6 bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-brand-purple">
                  <Layers size={20} />
                  <h3 className="font-bold text-charcoal-900 dark:text-white">PDF Management</h3>
                </div>
                <ul className="space-y-2 text-sm text-charcoal-600 dark:text-slate-400">
                  <li>• Merge multiple documents</li>
                  <li>• Split into individual pages</li>
                  <li>• Compress file size</li>
                  <li>• Rotate and reorder pages</li>
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="p-6 bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-brand-blue">
                  <FileStack size={20} />
                  <h3 className="font-bold text-charcoal-900 dark:text-white">Format Conversion</h3>
                </div>
                <ul className="space-y-2 text-sm text-charcoal-600 dark:text-slate-400">
                  <li>• Images (JPG, PNG) to PDF</li>
                  <li>• PDF to Word / PPTX</li>
                  <li>• Office formats to PDF</li>
                  <li>• Encrypted ZIP creation</li>
                </ul>
              </motion.div>
            </div>
          </section>

          {/* 3. How It Works */}
          <motion.section variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-6">
              <Cpu size={16} className="text-charcoal-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500 font-mono">
                Architecture
              </h2>
            </div>
            <div className="bg-slate-100 dark:bg-charcoal-900 p-8 rounded-2xl border border-slate-200 dark:border-charcoal-800">
              <p className="text-charcoal-700 dark:text-slate-300 leading-relaxed mb-4">
                EZtify utilizes <strong className="text-charcoal-900 dark:text-white">WebAssembly (WASM)</strong> technology to port powerful desktop libraries (like ffmpeg and pdf-lib) directly into the browser runtime.
              </p>
              <p className="text-charcoal-600 dark:text-slate-400 text-sm">
                This allows your device's CPU to process files locally, eliminating the need to send data to a remote server for computation. It works even if you disconnect from the internet after loading the page.
              </p>
            </div>
          </motion.section>

          {/* 4. Privacy & Security */}
          <motion.section variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={16} className="text-charcoal-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-500 font-mono">
                Privacy Model
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                <Lock className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="font-bold text-charcoal-900 dark:text-white text-sm mb-1">Local Only</h3>
                <p className="text-xs text-charcoal-600 dark:text-slate-400">Files are never uploaded to any server or cloud storage.</p>
              </div>
              <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-bold text-charcoal-900 dark:text-white text-sm mb-1">No Retention</h3>
                <p className="text-xs text-charcoal-600 dark:text-slate-400">We do not store logs, metadata, or file copies.</p>
              </div>
              <div className="p-5 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-3" />
                <h3 className="font-bold text-charcoal-900 dark:text-white text-sm mb-1">Encrypted</h3>
                <p className="text-xs text-charcoal-600 dark:text-slate-400">Standard HTTPS encryption protects the app delivery.</p>
              </div>
            </div>
          </motion.section>

          {/* 5. Limitations */}
          <motion.section variants={fadeInUp}>
            <div className="border-l-4 border-slate-200 dark:border-charcoal-700 pl-6 py-2">
              <h3 className="font-bold text-charcoal-900 dark:text-white mb-2">System Limitations</h3>
              <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-charcoal-600 dark:text-slate-400">
                <li>Performance depends on your device's RAM and CPU.</li>
                <li>Very large files (e.g., 500MB+ PDFs) may cause browser tab crashes on devices with low memory.</li>
                <li>Mobile browsers may be stricter with memory usage than desktop browsers.</li>
              </ul>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </div>
  );
};
