import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Image as ImageIcon, Minimize2, FileOutput, Scissors, Shield, Zap, Globe, Plus, FolderArchive, ArrowRight } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { Logo } from '../components/Logo';
import { FAQ } from '../components/FAQ';
import { ToolCard, ToolData } from '../components/ToolCard';
import { FeatureRequestModal } from '../components/FeatureRequestModal';
import { useLayoutContext } from '../components/Layout';
import { Link } from 'react-router-dom';
import { buttonTap, staggerContainer, fadeInUp } from '../utils/animations';
import { PageReadyTracker } from '../components/PageReadyTracker';

export const Home: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useLayoutContext();
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  const tools: ToolData[] = [
    {
      id: 'image-to-pdf',
      title: 'Images to PDF',
      desc: 'Convert JPG, PNG, and WebP images into a single, high-quality PDF document instantly.',
      icon: <Layers />,
      path: '/images-to-pdf',
      color: 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple',
      gradient: 'from-brand-purple/20 to-brand-blue/20'
    },
    {
      id: 'pdf-to-image',
      title: 'PDF to Images',
      desc: 'Extract pages from your PDF and save them as separate high-res images.',
      icon: <ImageIcon />,
      path: '/pdf-to-images',
      color: 'bg-brand-mint/10 border-brand-mint/20 text-brand-mint',
      gradient: 'from-brand-mint/20 to-brand-blue/20'
    },
    {
      id: 'compress-pdf',
      title: 'Compress PDF',
      desc: 'Reduce the file size of your PDF documents while maintaining quality.',
      icon: <Minimize2 />,
      path: '/compress-pdf',
      color: 'bg-brand-violet/10 border-brand-violet/20 text-brand-violet',
      gradient: 'from-brand-violet/20 to-brand-purple/20'
    },
    {
      id: 'merge-pdf',
      title: 'Merge PDF',
      desc: 'Combine multiple PDF files into one organized document in seconds.',
      icon: <FileOutput />, // Using FileOutput as abstract merge/output
      path: '/merge-pdf',
      color: 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange',
      gradient: 'from-brand-orange/20 to-brand-purple/20'
    },
    {
      id: 'split-pdf',
      title: 'Split PDF',
      desc: 'Extract specific pages or split a document into multiple separate files.',
      icon: <Scissors />,
      path: '/split-pdf',
      color: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-mint/20'
    },
    {
      id: 'zip-files',
      title: 'Zip It!',
      desc: 'Create secure ZIP archives from your files locally in your browser.',
      icon: <FolderArchive />,
      path: '/zip-it',
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      gradient: 'from-amber-500/20 to-orange-500/20'
    }
  ];

  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-pastel-bg dark:bg-charcoal-950">
      <PageReadyTracker />
      
      {/* 1. Hero & Tools Grid */}
      <section className="relative px-4 pt-10 pb-16 md:pt-12 md:pb-20 overflow-hidden">
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <motion.div 
              className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-purple/10 dark:bg-brand-purple/5 rounded-full blur-[100px]"
              animate={!shouldReduceMotion ? { scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] } : {}}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
           <motion.div 
             className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/10 dark:bg-brand-blue/5 rounded-full blur-[100px]"
             animate={!shouldReduceMotion ? { scale: [1, 0.9, 1], x: [0, -20, 0], y: [0, 20, 0] } : {}}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center mb-10 md:mb-12"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-4 tracking-tight"
            >
              EZ<span className="text-brand-purple">tify</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-base md:text-lg text-charcoal-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed"
            >
              Fast, privacy-first PDF tools that run right in your browser.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5"
          >
            {tools.map((tool) => (
              <div key={tool.id} className="w-full">
                <ToolCard tool={tool} className="w-full h-[170px] md:h-[180px]" />
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* 2. Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-16 border-t border-brand-purple/5">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-charcoal-900 dark:text-white mb-2">
            Why use EZtify?
          </h2>
          <p className="text-charcoal-500 dark:text-slate-400 text-sm">
            Professional grade tools, completely free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-purple/5">
            <div className="w-10 h-10 bg-brand-purple/10 rounded-xl flex items-center justify-center text-brand-purple mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-white mb-1.5">100% Private</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-xs md:text-sm">
              Your files never leave your device. All processing happens locally in your browser using WebAssembly.
            </p>
          </div>

          <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-blue/5">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-white mb-1.5">Blazing Fast</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-xs md:text-sm">
              Skip the upload queue. Get instant results powered by your device's hardware.
            </p>
          </div>

          <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-mint/5">
            <div className="w-10 h-10 bg-brand-mint/10 rounded-xl flex items-center justify-center text-brand-mint mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-900 dark:text-white mb-1.5">Modern & Accessible</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-xs md:text-sm">
              Use EZtify on any device with a modern browser. Install it as an app for quick access from your home screen.
            </p>
          </div>
        </div>
      </section>

      <AdSlot zone="footer" className="mb-12" />
      
      <FAQ />

      {/* Feature Request Modal */}
      <FeatureRequestModal 
        isOpen={isFeatureModalOpen} 
        onClose={() => setIsFeatureModalOpen(false)} 
      />
    </div>
  );
};