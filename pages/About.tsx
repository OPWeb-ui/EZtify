import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Mail, ArrowRight, CheckCircle, Cpu, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { PageReadyTracker } from '../components/PageReadyTracker';

export const About: React.FC = () => {
  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-pastel-bg dark:bg-charcoal-950">
      <PageReadyTracker />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[20%] w-[40%] h-[40%] bg-brand-purple/5 dark:bg-brand-purple/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/5 dark:bg-brand-blue/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* 1. Hero */}
        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="text-center mb-16 md:mb-24"
        >
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-heading font-extrabold text-charcoal-900 dark:text-white mb-6 tracking-tight"
          >
            About EZ<span className="text-brand-purple">tify</span>
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-charcoal-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Fast, privacy-first PDF tools that run right in your browser.
          </motion.p>
        </motion.section>

        {/* 2. Our Mission */}
        <motion.section 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="mb-20 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-charcoal-700 shadow-sm"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
               <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 dark:text-white">Our Mission</h2>
          </motion.div>
          <motion.div variants={fadeInUp} className="space-y-4 text-charcoal-600 dark:text-slate-300 leading-loose">
            <p>
              We built EZtify with a single goal: to make everyday PDF tasks simple, fast, and trustworthy. 
              Too many online tools are cluttered, slow, or invasive. We wanted to build something better.
            </p>
            <p>
              Our mission is to remove friction from your workflow. Whether you're merging documents for work 
              or converting images for school, we provide lightweight, accessible tools that just work—without 
              complicating your life.
            </p>
          </motion.div>
        </motion.section>

        {/* 3. How EZtify Works */}
        <motion.section 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="mb-20"
        >
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 dark:text-white mb-8 text-center">
            How EZtify Works
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeInUp} className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-sm hover:border-brand-purple/30 transition-colors">
              <Shield className="w-8 h-8 text-brand-mint mb-4" />
              <h3 className="font-bold text-lg text-charcoal-800 dark:text-white mb-2">Private by Design</h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed">
                Files are processed locally in your browser. Your files stay on your device and are never sent to our servers.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-sm hover:border-brand-purple/30 transition-colors">
              <Cpu className="w-8 h-8 text-brand-blue mb-4" />
              <h3 className="font-bold text-lg text-charcoal-800 dark:text-white mb-2">Local Processing</h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed">
                We use advanced web technologies to handle heavy lifting on your machine, ensuring nothing is stored on our servers.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-sm hover:border-brand-purple/30 transition-colors">
              <Zap className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="font-bold text-lg text-charcoal-800 dark:text-white mb-2">Instant Speed</h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed">
                Since there's no network transfer for processing, you get results instantly. Convert, compress, merge, and split in seconds.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-slate-200 dark:border-charcoal-700 shadow-sm hover:border-brand-purple/30 transition-colors">
              <Users className="w-8 h-8 text-brand-orange mb-4" />
              <h3 className="font-bold text-lg text-charcoal-800 dark:text-white mb-2">Accessible to All</h3>
              <p className="text-sm text-charcoal-500 dark:text-slate-400 leading-relaxed">
                Free to use and accessible from any modern browser. All your essential PDF tools in one place.
              </p>
            </motion.div>
          </div>
        </motion.section>

        <AdSlot zone="hero" className="mb-20" />

        {/* 4. Why People Use EZtify */}
        <motion.section 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInUp}
          className="mb-20"
        >
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 dark:text-white mb-8 text-center">
            Why People Use EZtify
          </h2>
          <div className="bg-brand-purple/5 dark:bg-brand-purple/10 rounded-3xl p-8 md:p-12 border border-brand-purple/10">
            <ul className="space-y-4">
              {[
                "Fast tools for everyday PDF tasks",
                "Works straight in your browser",
                "Built for speed, simplicity, and privacy",
                "All your essential PDF tools in one place"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-charcoal-700 dark:text-slate-200 font-medium">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* 5. What's Next & Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.section 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-slate-200 dark:border-charcoal-700"
          >
            <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4">What's Next?</h3>
            <p className="text-charcoal-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              We are always improving existing tools and working on adding new ones to help you be more productive.
            </p>
            <p className="text-charcoal-600 dark:text-slate-400 text-sm leading-relaxed">
              Have a request? You can suggest features via the homepage or by emailing us directly.
            </p>
          </motion.section>

          <motion.section 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-slate-200 dark:border-charcoal-700"
          >
            <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4">Who's Behind EZtify?</h3>
            <p className="text-charcoal-600 dark:text-slate-400 text-sm leading-relaxed">
              EZtify is built by a small indie team passionate about creating high-quality, privacy-respecting web tools. We believe the best utilities should be fast, free, and secure.
            </p>
          </motion.section>
        </div>

        {/* 6. Contact */}
        <motion.section 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center bg-gradient-to-br from-brand-purple to-brand-blue rounded-3xl p-10 text-white shadow-xl shadow-brand-purple/20"
        >
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Get in Touch</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Questions? Suggestions? We'd love to hear from you.
          </p>
          
          <a 
            href="mailto:eztifyapps@gmail.com"
            className="inline-flex items-center gap-2 bg-white text-brand-purple px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            eztifyapps@gmail.com <ArrowRight size={16} />
          </a>

          <div className="mt-12 flex items-center justify-center gap-6 text-sm font-medium text-white/70">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            <Link to="/" className="hover:text-white transition-colors">Tools</Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
};
