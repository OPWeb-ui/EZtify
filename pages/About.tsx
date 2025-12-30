
import React from 'react';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';

const ValueCard = ({ title, desc, color }: { title: string, desc: string, color: string }) => (
  <div className="p-8 bg-white rounded-3xl border border-stone-200 flex flex-col gap-4 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2 ${color}`} />
    
    <div className={`w-12 h-12 rounded-full ${color} border-2 border-[#111111] flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]`}>
       <div className="w-3 h-3 bg-white rounded-full" />
    </div>
    
    <h3 className="text-xl font-bold text-[#111111]">{title}</h3>
    <p className="text-base text-stone-600 leading-relaxed font-medium">
      {desc}
    </p>
  </div>
);

export const About: React.FC = () => {
  return (
    <div className="w-full pb-16">
      <PageReadyTracker />
      
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#111111] mb-6 leading-[1.1]">
              Local document <br/>
              <span className="text-stone-400">workspace.</span>
            </h1>
            
            <div className="max-w-2xl text-xl text-stone-600 leading-relaxed space-y-6">
              <p>
                EZTIFY is a dedicated platform for client-side document management. Every operation occurs exclusively within your browser memory.
              </p>
              <p>
                Our architecture ensures that files never leave your device. We eliminate the need for server uploads, removing the privacy risks and wait times associated with traditional cloud-based converters.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="mb-16 space-y-6">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-[0.2em]">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <h4 className="font-bold text-[#111111] mb-2">Professional Workspace</h4>
              <p className="text-sm text-stone-600 font-medium">The PDF Workspace provides a unified interface to merge, split, rotate, and organize document pages in a single session.</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <h4 className="font-bold text-[#111111] mb-2">Advanced Converters</h4>
              <p className="text-sm text-stone-600 font-medium">Bi-directional conversion between PDF and standard formats including Images, PowerPoint (PPTX), and structured ZIP archives.</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <h4 className="font-bold text-[#111111] mb-2">Document Optimization</h4>
              <p className="text-sm text-stone-600 font-medium">Powerful compression tools to reduce file size for sharing without compromising professional readability.</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <h4 className="font-bold text-[#111111] mb-2">Utility Tools</h4>
              <p className="text-sm text-stone-600 font-medium">Administrative control over documents with Batch Renaming and a dedicated PDF Metadata Editor.</p>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          <ValueCard 
            title="Privacy First"
            desc="We do not utilize servers for processing. Your data remains strictly local and is never cached or retained outside of your current session."
            color="bg-accent-lime"
          />
          <ValueCard 
            title="Native Speed"
            desc="By removing network latency, document operations happen at the speed of your hardware. Performance scales with your device capabilities."
            color="bg-stone-200"
          />
          <ValueCard 
            title="Intentional UI"
            desc="Designed to feel like a high-end native application. Consistent interactions and clear feedback ensure a professional experience."
            color="bg-accent-pink"
          />
          <ValueCard 
            title="Zero Accounts"
            desc="Access is immediate. No registrations, no tracking, and no subscriptions. Purely functional tools available when you need them."
            color="bg-accent-yellow"
          />
        </motion.div>

        <div className="border-t-2 border-stone-200 pt-8">
           <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">Our Position</p>
           <p className="text-lg font-bold text-[#111111]">
             EZTIFY is not cloud-based. It is a local runtime for the modern professional.
           </p>
        </div>
      </div>
    </div>
  );
};
