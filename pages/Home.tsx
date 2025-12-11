

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Image as ImageIcon, Minimize2, FileOutput, Scissors, Shield, Zap, Globe, FolderArchive, ArrowRight, FileText, Presentation, ArrowLeftRight } from 'lucide-react';
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
      id: 'word-to-pdf',
      title: 'Word to PDF',
      desc: 'Convert DOCX documents to PDF in your browser.',
      icon: <FileText />,
      path: '/word-to-pdf',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
      gradient: 'from-blue-500/20 to-cyan-500/20'
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
      icon: <FileOutput />, 
      path: '/merge-pdf',
      color: 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange',
      gradient: 'from-brand-orange/20 to-brand-purple/20'
    },
    {
      id: 'split-pdf',
      title: 'Split PDF',
      desc: 'Split PDF files or extract specific pages to a new document.',
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
      <section className="relative px-4 pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <motion.div 
              className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-purple/10 dark:bg-brand-purple/5 rounded-full blur-[120px]"
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
            className="text-center mb-12 md:mb-16"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl font-heading font-extrabold text-charcoal-900 dark:text-charcoal-200 mb-6 tracking-tight"
            >
              EZ<span className="text-brand-purple">tify</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-base md:text-lg text-charcoal-600 dark:text-charcoal-400 max-w-xl mx-auto leading-relaxed"
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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </motion.div>

        </div>
      </section>

      <AdSlot zone="hero" className="mb-12" />

      {/* 2. Feature Request / CTA */}
      <section className="px-4 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-white/60 dark:bg-charcoal-900/60 backdrop-blur-xl border border-slate-200 dark:border-charcoal-700 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 dark:text-white mb-4">
            Something missing?
          </h2>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-8 max-w-lg mx-auto">
            We are actively building more free, private tools. Let us know what you need next.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={buttonTap}
            onClick={() => setIsFeatureModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 rounded-full font-bold text-charcoal-800 dark:text-white shadow-sm hover:border-brand-purple/50 dark:hover:border-brand-purple/50 transition-all"
          >
            Request a Feature <ArrowRight size={16} className="text-brand-purple" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-charcoal-400 dark:text-charcoal-600 border-t border-slate-100 dark:border-charcoal-900">
        <p>© 2024 EZtify. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link to="/about" className="hover:text-brand-purple transition-colors">About</Link>
          <span>•</span>
          <a href="mailto:eztifyapps@gmail.com" className="hover:text-brand-purple transition-colors">Contact</a>
        </div>
      </footer>

      <FeatureRequestModal isOpen={isFeatureModalOpen} onClose={() => setIsFeatureModalOpen(false)} />
    </div>
  );
};