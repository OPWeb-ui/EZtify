
import React from 'react';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { 
  ShieldCheck, Cpu, Database, Zap, Lock, Globe, FileStack, Terminal, Smartphone 
} from 'lucide-react';
import { IconBox } from '../components/IconBox';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

export const About: React.FC = () => {
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-nd-surface border border-nd-border text-[10px] font-bold font-mono text-nd-muted mb-8 uppercase tracking-widest">
             <Globe size={12} /> Privacy First
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-nd-primary mb-6 leading-[1.1]">
            Local tools for <br className="hidden md:block" />
            global privacy.
          </h1>
          
          <div className="max-w-xl">
            <p className="text-lg text-nd-secondary leading-relaxed mb-6">
              EZtify utilizes cutting-edge <strong>WebAssembly</strong> technology to process files directly in your browser's memory. 
              No servers, no uploads, no data collection.
            </p>
          </div>
        </motion.div>

        {/* 2. Philosophy / Architecture */}
        <div className="space-y-24">
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
          >
            <h3 className="text-xs font-semibold text-nd-muted uppercase tracking-wider mb-8 pl-1 flex items-center gap-3">
              <Cpu size={14} /> System Architecture
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
               <div>
                  <h4 className="text-sm font-medium text-nd-primary mb-3">Client-Side Core</h4>
                  <p className="text-sm text-nd-secondary leading-relaxed">
                    Traditional web tools upload your files to a remote server for processing. 
                    EZtify takes a different approach by porting powerful desktop libraries (like PDF.js and FFmpeg) to run natively inside your browser.
                  </p>
               </div>
               <div>
                  <h4 className="text-sm font-medium text-nd-primary mb-3">Zero Retention</h4>
                  <p className="text-sm text-nd-secondary leading-relaxed">
                    Because processing happens on your device, we physically cannot see, copy, or store your files. 
                    Once you close the tab, all application memory is cleared instantly.
                  </p>
               </div>
            </div>
          </motion.section>

          {/* 3. Security Grid */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            className="border-t border-nd-border pt-24"
          >
            <h3 className="text-xs font-semibold text-nd-muted uppercase tracking-wider mb-8 pl-1 flex items-center gap-3">
              <ShieldCheck size={14} /> Security Model
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-nd-surface border border-nd-border flex flex-col gap-4">
                <IconBox icon={<Lock />} size="sm" variant="success" />
                <div>
                    <h3 className="font-medium text-nd-primary text-sm mb-1.5">Local Only</h3>
                    <p className="text-xs text-nd-secondary leading-relaxed">Files never leave your device network.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-nd-surface border border-nd-border flex flex-col gap-4">
                <IconBox icon={<Database />} size="sm" variant="brand" />
                <div>
                    <h3 className="font-medium text-nd-primary text-sm mb-1.5">No Database</h3>
                    <p className="text-xs text-nd-secondary leading-relaxed">We maintain zero records of user activity.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-nd-surface border border-nd-border flex flex-col gap-4">
                <IconBox icon={<Zap />} size="sm" variant="warning" />
                <div>
                    <h3 className="font-medium text-nd-primary text-sm mb-1.5">Encrypted</h3>
                    <p className="text-xs text-nd-secondary leading-relaxed">Delivery via HTTPS with strict security headers.</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 4. Capabilities List */}
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            className="border-t border-nd-border pt-24"
          >
             <h3 className="text-xs font-semibold text-nd-muted uppercase tracking-wider mb-8 pl-1 flex items-center gap-3">
              <Terminal size={14} /> Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
               <div className="flex gap-4">
                  <div className="shrink-0 mt-1"><IconBox icon={<FileStack />} size="xs" variant="ghost" /></div>
                  <div>
                     <h4 className="text-sm font-medium text-nd-primary mb-1">PDF Engine</h4>
                     <p className="text-xs text-nd-secondary">
                        Powered by <code>pdf-lib</code> and <code>pdf.js</code>. Supports merging, splitting, compression, and format conversion.
                     </p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="shrink-0 mt-1"><IconBox icon={<Smartphone />} size="xs" variant="ghost" /></div>
                  <div>
                     <h4 className="text-sm font-medium text-nd-primary mb-1">Responsive Design</h4>
                     <p className="text-xs text-nd-secondary">
                        Fully adaptive UI built with Tailwind and Framer Motion. Installable as a PWA on iOS and Android.
                     </p>
                  </div>
               </div>
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
};
