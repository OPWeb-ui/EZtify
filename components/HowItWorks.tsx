
import React, { Layers, Download, Settings, FileImage, MousePointerClick, Zap, Sliders, CheckCircle, GripVertical, Scissors, FileOutput, Archive, FilePlus, FileText, RotateCw, Trash2, FileKey, FileLock, Lock, ShieldCheck, Hash, Eraser, Palette, Code, PenTool, Presentation, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppMode } from '../types';
import { staggerContainer, fadeInUp, cardHover } from '../utils/animations';

interface HowItWorksProps {
  mode: AppMode | 'pptx-to-pdf';
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ mode }) => {
  const getSteps = () => {
    if (mode === 'image-to-pdf') {
      return [
        { icon: <MousePointerClick />, title: "Select", desc: "Select or drop images" },
        { icon: <Layers />, title: "Organize", desc: "Drag to reorder" },
        { icon: <Download />, title: "Convert", desc: "Download PDF" }
      ];
    }
    if (mode === 'pdf-to-image') {
      return [
        // Added Upload to imports above to fix Cannot find name 'Upload'
        { icon: <Upload />, title: "Upload", desc: "Upload your PDF" },
        { icon: <Settings />, title: "Configure", desc: "Choose format" },
        { icon: <FileImage />, title: "Export", desc: "Save as images" }
      ];
    }
    if (mode === 'pdf-to-pptx') {
      return [
        { icon: <Upload />, title: "Upload", desc: "Select your file" },
        { icon: <Zap />, title: "Convert", desc: "Instant conversion" },
        { icon: <Download />, title: "Download", desc: "Save the new file" }
      ];
    }
    if (mode === 'pptx-to-pdf') {
      return [
        { icon: <Upload />, title: "Upload", desc: "Select PPTX file" },
        { icon: <Presentation />, title: "Process", desc: "Extracts slides" },
        { icon: <Download />, title: "Download", desc: "Save as PDF" }
      ];
    }
    if (mode === 'unlock-pdf') {
       return [
        { icon: <Upload />, title: "Upload", desc: "Select your PDF" },
        { icon: <FileKey />, title: "Enter Password", desc: "Provide existing password" },
        { icon: <Download />, title: "Download", desc: "Save unlocked file" }
      ];
    }
    if (mode === 'grayscale-pdf') {
        return [
         { icon: <Upload />, title: "Upload", desc: "Select your PDF" },
         { icon: <Palette />, title: "Convert", desc: "Auto-convert to B&W" },
         { icon: <Download />, title: "Download", desc: "Save grayscale PDF" }
       ];
     }
    if (mode === 'code-editor') {
        return [
         { icon: <Upload />, title: "Open", desc: "Drag & drop text files" },
         { icon: <PenTool />, title: "Edit", desc: "Modify with syntax highlighting" },
         { icon: <Download />, title: "Save", desc: "Download modified files" }
       ];
     }
    // Default fallback
    return [
      { icon: <Upload />, title: "Upload", desc: "Select file" },
      { icon: <Zap />, title: "Process", desc: "Instant conversion" },
      { icon: <Download />, title: "Download", desc: "Save result" }
    ];
  };

  const steps = getSteps();

  return (
    <section className="w-full max-w-lg mx-auto px-6 pt-4 pb-12">
      <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
        <div className="h-px w-8 bg-current opacity-30"></div>
        <span className="text-xs font-bold uppercase tracking-widest text-charcoal-500 dark:text-slate-400">Simple & Fast</span>
        <div className="h-px w-8 bg-current opacity-30"></div>
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-3 gap-3"
      >
        {steps.map((step, idx) => (
          <motion.div 
            key={idx}
            variants={fadeInUp}
            className="flex flex-col items-center text-center p-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700 shadow-sm"
          >
            <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-700 text-charcoal-700 dark:text-slate-200">
              {React.cloneElement(step.icon as React.ReactElement<any>, { size: 20 })}
            </div>
            <h3 className="text-xs font-bold text-charcoal-800 dark:text-slate-200 mb-0.5">{step.title}</h3>
            <p className="text-[10px] text-charcoal-500 dark:text-slate-400 font-medium leading-tight">{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
