
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { Accordion } from '../components/Accordion';
import { faqData } from '../utils/faqData';
import { Search, HelpCircle } from 'lucide-react';
import { staggerContainer, fadeInUp } from '../utils/animations';

export const FAQ: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-charcoal-950 overflow-y-auto custom-scrollbar">
      <PageReadyTracker />
      
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <div className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-brand-purple mb-4"
          >
            <HelpCircle size={20} />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Support Database</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-heading font-extrabold text-charcoal-900 dark:text-white tracking-tight"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-charcoal-500 dark:text-charcoal-400 max-w-2xl text-sm md:text-base leading-relaxed"
          >
            Answers to common questions about functionality, privacy, and limitations. 
            Designed to help you get the most out of EZtify's local-first tools.
          </motion.p>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Sidebar Nav (Desktop) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block w-64 shrink-0"
          >
            <div className="sticky top-24 space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-charcoal-400 dark:text-charcoal-600 mb-2 block">
                Categories
              </span>
              {faqData.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block px-3 py-2 text-sm font-medium text-charcoal-600 dark:text-slate-400 hover:text-brand-purple hover:bg-white dark:hover:bg-charcoal-900 hover:shadow-sm rounded-lg transition-all"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex-1 space-y-10"
          >
            {faqData.map((section) => (
              <motion.section 
                key={section.id} 
                id={section.id}
                variants={fadeInUp}
                className="scroll-mt-24"
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-charcoal-900 dark:text-white font-heading">
                    {section.title}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-charcoal-800" />
                </div>
                
                <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-slate-200 dark:border-charcoal-800 p-2 sm:p-6 shadow-sm">
                  {section.items.map((item, idx) => (
                    <Accordion key={idx} question={item.q} answer={item.a} />
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
