import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Image as ImageIcon, Minimize2, FileOutput, Scissors, Shield, Zap, Globe, Plus, FolderArchive, ArrowRight } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { Logo } from '../components/Logo';
import { FAQ } from '../components/FAQ';
import { ToolCarousel } from '../components/ToolCarousel';
import { ToolData } from '../components/ToolCard';
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
      icon: <Layers className="w-8 h-8 text-brand-purple" />,
      path: '/images-to-pdf',
      color: 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple',
      gradient: 'from-brand-purple/20 to-brand-blue/20'
    },
    {
      id: 'pdf-to-image',
      title: 'PDF to Images',
      desc: 'Extract pages from your PDF and save them as separate high-res images.',
      icon: <ImageIcon className="w-8 h-8 text-brand-mint" />,
      path: '/pdf-to-images',
      color: 'bg-brand-mint/10 border-brand-mint/20 text-brand-mint',
      gradient: 'from-brand-mint/20 to-brand-blue/20'
    },
    {
      id: 'compress-pdf',
      title: 'Compress PDF',
      desc: 'Reduce the file size of your PDF documents while maintaining quality.',
      icon: <Minimize2 className="w-8 h-8 text-brand-violet" />,
      path: '/compress-pdf',
      color: 'bg-brand-violet/10 border-brand-violet/20 text-brand-violet',
      gradient: 'from-brand-violet/20 to-brand-purple/20'
    },
    {
      id: 'merge-pdf',
      title: 'Merge PDF',
      desc: 'Combine multiple PDF files into one organized document in seconds.',
      icon: <FileOutput className="w-8 h-8 text-brand-orange" />, // Using FileOutput as abstract merge/output
      path: '/merge-pdf',
      color: 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange',
      gradient: 'from-brand-orange/20 to-brand-purple/20'
    },
    {
      id: 'split-pdf',
      title: 'Split PDF',
      desc: 'Extract specific pages or split a document into multiple separate files.',
      icon: <Scissors className="w-8 h-8 text-brand-blue" />,
      path: '/split-pdf',
      color: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-mint/20'
    },
    {
      id: 'zip-files',
      title: 'Zip It!',
      desc: 'Create secure ZIP archives from your files locally in your browser.',
      icon: <FolderArchive className="w-8 h-8 text-amber-500" />,
      path: '/zip-it',
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      gradient: 'from-amber-500/20 to-orange-500/20'
    }
  ];

  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-pastel-bg dark:bg-charcoal-950">
      <PageReadyTracker />
      
      {/* 1. Hero Section */}
      <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        
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

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          
          <motion.div 
            variants={fadeInUp}
            className="mb-8 inline-block"
          >
            <Logo size="lg" />
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
          >
            Your PDFs, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">Simplified.</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-charcoal-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Fast, free, and private PDF tools that run entirely in your browser. 
            No server uploads, no file limits, no sign-up required.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/images-to-pdf">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-brand-purple text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50 transition-all flex items-center gap-2"
              >
                Start Converting <ArrowRight size={20} />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFeatureModalOpen(true)}
              className="px-8 py-4 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-white border border-slate-200 dark:border-charcoal-700 rounded-xl font-bold text-lg shadow-sm hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-all flex items-center gap-2"
            >
              <Plus size={20} className="text-brand-purple" />
              Suggest Feature
            </motion.button>
          </motion.div>

        </motion.div>
      </section>

      {/* 2. Tool Carousel */}
      <section className="py-10 bg-white/40 dark:bg-charcoal-900/20 backdrop-blur-sm border-y border-brand-purple/5">
        <ToolCarousel title="All Tools" tools={tools} />
      </section>

      {/* 3. Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal-900 dark:text-white mb-4">
            Why use EZtify?
          </h2>
          <p className="text-charcoal-500 dark:text-slate-400">
            Professional grade tools, completely free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-purple/5">
            <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple mb-6">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">100% Private</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-sm">
              Your files never leave your device. All processing happens locally in your browser using WebAssembly.
            </p>
          </div>

          <div className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-blue/5">
            <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-6">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">Blazing Fast</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-sm">
              No uploading or downloading wait times. Instant processing powered by your device's hardware.
            </p>
          </div>

          <div className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-slate-100 dark:border-charcoal-800 shadow-xl shadow-brand-mint/5">
            <div className="w-14 h-14 bg-brand-mint/10 rounded-2xl flex items-center justify-center text-brand-mint mb-6">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">Works Offline</h3>
            <p className="text-charcoal-600 dark:text-slate-400 leading-relaxed text-sm">
              Once loaded, you can use EZtify without an internet connection. It's a Progressive Web App (PWA).
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