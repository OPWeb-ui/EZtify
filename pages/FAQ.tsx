
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { Plus } from 'lucide-react';

const AccordionItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-stone-200 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between py-6 text-left group hover:bg-white/50 transition-colors rounded-xl px-2 -mx-2"
      >
        <span className="text-lg font-bold text-[#111111] pr-8 leading-snug">
          {q}
        </span>
        <div className={`mt-1 w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-45 bg-[#111111] text-white border-[#111111]' : 'text-stone-400'}`}>
           <Plus size={14} strokeWidth={3} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-base text-stone-600 leading-relaxed pb-8 px-2">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-sm font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 mt-12 first:mt-0">
    {title}
  </h2>
);

export const FAQ: React.FC = () => {
  return (
    <div className="w-full pb-16">
      <PageReadyTracker />
      
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4 tracking-tight">
            Support and Guidance
          </h1>
          <p className="text-xl text-stone-500 max-w-xl leading-relaxed">
            Understand the local-first workflow and how to manage your documents effectively within EZTIFY.
          </p>
        </div>

        <SectionTitle title="Getting Started" />
        <div className="bg-white rounded-3xl border border-stone-200 px-8 mb-8 py-4 shadow-sm">
           <p className="text-stone-600 font-medium py-3">
              EZTIFY utilizes a consistent four-step process for all document tasks. Select a module from the dashboard, add your files to the workspace, apply your desired modifications, and download the resulting file.
           </p>
           <p className="text-stone-600 font-medium py-3">
              Since all processing happens locally, adding large files will trigger an "Analyzing" state. This indicates the application is mounting the file into browser memory for secure editing.
           </p>
        </div>

        <SectionTitle title="Tool Categories" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <h4 className="font-bold mb-2">Workspace</h4>
            <p className="text-sm text-stone-500">PDF Workspace: The primary interface for merging, splitting, and organizing page sequences.</p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <h4 className="font-bold mb-2">Converters</h4>
            <p className="text-sm text-stone-500">Image to PDF, PDF to Image, PDF to PPTX, and PDF to ZIP for format interoperability.</p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <h4 className="font-bold mb-2">Optimization</h4>
            <p className="text-sm text-stone-500">Compress PDF: Efficiently reduces file size while maintaining document structure.</p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <h4 className="font-bold mb-2">Utilities</h4>
            <p className="text-sm text-stone-500">Batch Rename and Metadata Editor for administrative document adjustments.</p>
          </div>
        </div>

        <SectionTitle title="Common Questions" />
        <div className="bg-white rounded-3xl border border-stone-200 px-8 shadow-sm mb-8">
          <AccordionItem 
            q="Are my files uploaded to a server?" 
            a="No. EZTIFY runs entirely on your device. When you add a file, it is loaded into the browser's temporary memory (RAM). It is never transmitted across the network." 
          />
          <AccordionItem 
            q="Why is the processing fast?" 
            a="Speed is achieved by eliminating network latency. Because the code runs locally on your computer's processor, there are no queues or server-side bottlenecks." 
          />
          <AccordionItem 
            q="Why is the UI consistent across tools?" 
            a="We use a unified design system to ensure that once you understand how one tool works, you understand them all. This reduces cognitive load and improves workflow efficiency." 
          />
          <AccordionItem 
            q="What happens after I download a file?" 
            a="The resulting file is saved to your local storage. Once the tab is closed or refreshed, the temporary session data used during processing is automatically cleared from RAM." 
          />
          <AccordionItem 
            q="Can I use this on mobile and desktop?" 
            a="Yes. EZTIFY is fully responsive and optimized for both platforms. However, desktop devices generally offer better performance for processing very large or complex documents." 
          />
        </div>

        <SectionTitle title="Troubleshooting" />
        <div className="bg-white rounded-3xl border border-stone-200 px-8 shadow-sm mb-8">
          <AccordionItem 
            q="The application feels unresponsive" 
            a="If a tool hangs, it is usually due to memory limits. Refresh the page to clear the buffer and try again. For large documents, ensure you have sufficient free RAM available on your device." 
          />
          <AccordionItem 
            q="Large file handling" 
            a="Processing high-resolution PDFs with hundreds of pages can be demanding. If you experience crashes, try processing the document in smaller batches or using a desktop browser." 
          />
          <AccordionItem 
            q="Browser compatibility" 
            a="EZTIFY requires a modern browser with WebAssembly support. We recommend the latest versions of Chrome, Safari, Firefox, or Edge for the best experience." 
          />
        </div>

        <div className="pt-8 border-t border-stone-200">
           <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Support Philosophy</p>
           <p className="text-stone-600 leading-relaxed font-medium">
              EZTIFY is built to be self-explanatory. By keeping the logic local and lightweight, we provide a toolset that requires no account management or cloud synchronization. We focus on providing a stable, private runtime for your daily document tasks.
           </p>
        </div>
      </div>
    </div>
  );
};
