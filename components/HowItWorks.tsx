import React from 'react';
import { Upload, Layers, Download, Settings, FileImage, MousePointerClick, Zap, Sliders, CheckCircle, GripVertical, Scissors, FileOutput } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppMode } from '../types';
import { staggerContainer, fadeInUp, cardHover } from '../utils/animations';

interface HowItWorksProps {
  mode: AppMode;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ mode }) => {
  // Determine accent color based on the specific tool personality
  const getThemeColor = () => {
    switch (mode) {
      case 'image-to-pdf': return 'text-brand-blue';   // Stack & Build Theme
      case 'pdf-to-image': return 'text-brand-mint';   // Split & Unfold Theme
      case 'compress-pdf': return 'text-brand-violet'; // Squeeze & Reduce Theme
      case 'merge-pdf': return 'text-brand-orange';    // Stack & Combine Theme
      case 'split-pdf': return 'text-brand-mint';      // Unfold & Separate Theme
      default: return 'text-brand-purple';
    }
  };

  const activeColor = getThemeColor();

  const getSteps = () => {
    if (mode === 'image-to-pdf') {
      return [
        {
          icon: <MousePointerClick className={`w-6 h-6 ${activeColor}`} />,
          title: "1. Select",
          desc: "Drag & drop your images."
        },
        {
          icon: <Layers className={`w-6 h-6 ${activeColor}`} />,
          title: "2. Organize",
          desc: "Reorder or rotate instantly."
        },
        {
          icon: <Download className={`w-6 h-6 ${activeColor}`} />,
          title: "3. Convert",
          desc: "Get your PDF in one click."
        }
      ];
    }
    if (mode === 'pdf-to-image') {
      return [
        {
          icon: <Upload className={`w-6 h-6 ${activeColor}`} />,
          title: "1. Upload",
          desc: "Drop your PDF file."
        },
        {
          icon: <Settings className={`w-6 h-6 ${activeColor}`} />,
          title: "2. Settings",
          desc: "Choose JPG or PNG format."
        },
        {
          icon: <FileImage className={`w-6 h-6 ${activeColor}`} />,
          title: "3. Export",
          desc: "Download all pages as images."
        }
      ];
    }
    if (mode === 'compress-pdf') {
      return [
        {
          icon: <Upload className={`w-6 h-6 ${activeColor}`} />,
          title: "1. Upload",
          desc: "Drop your large PDF."
        },
        {
          icon: <Sliders className={`w-6 h-6 ${activeColor}`} />,
          title: "2. Optimize",
          desc: "Choose Normal or Strong."
        },
        {
          icon: <Zap className={`w-6 h-6 ${activeColor}`} />,
          title: "3. Shrink",
          desc: "Download smaller file instantly."
        }
      ];
    }
    if (mode === 'split-pdf') {
      return [
        {
          icon: <Upload className={`w-6 h-6 ${activeColor}`} />,
          title: "1. Upload",
          desc: "Upload a PDF document."
        },
        {
          icon: <Scissors className={`w-6 h-6 ${activeColor}`} />,
          title: "2. Select",
          desc: "Click pages to extract."
        },
        {
          icon: <FileOutput className={`w-6 h-6 ${activeColor}`} />,
          title: "3. Split",
          desc: "Download selected pages."
        }
      ];
    }
    // Merge PDF
    return [
      {
        icon: <Layers className={`w-6 h-6 ${activeColor}`} />,
        title: "1. Upload",
        desc: "Add multiple PDF files."
      },
      {
        icon: <GripVertical className={`w-6 h-6 ${activeColor}`} />,
        title: "2. Arrange",
        desc: "Drag to set order."
      },
      {
        icon: <CheckCircle className={`w-6 h-6 ${activeColor}`} />,
        title: "3. Merge",
        desc: "Combine into one file."
      }
    ];
  };

  const steps = getSteps();

  return (
    <section className="w-full max-w-5xl mx-auto px-6 pt-8 pb-16">
      <div className="text-center mb-10 opacity-60 hover:opacity-100 transition-opacity duration-500">
        <h2 className="text-xl font-heading font-bold text-charcoal-800 dark:text-slate-200 mb-2">
          Simple & Fast
        </h2>
        <p className="text-charcoal-500 dark:text-slate-400 text-sm">
          No learning curve. Just upload and go.
        </p>
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {steps.map((step, idx) => (
          <motion.div 
            key={idx}
            variants={fadeInUp}
            whileHover={cardHover}
            className="
              flex flex-col items-center text-center p-6 rounded-2xl 
              bg-white/50 dark:bg-charcoal-900/50 border border-white/50 dark:border-charcoal-800/50
              hover:bg-white dark:hover:bg-charcoal-900 hover:border-brand-purple/10 hover:shadow-xl hover:shadow-brand-purple/5
              cursor-default
            "
          >
            <div className="mb-4 p-3 bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-slate-100 dark:border-charcoal-700 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>
            
            <h3 className="text-base font-bold text-charcoal-800 dark:text-slate-200 mb-1">{step.title}</h3>
            <p className="text-sm text-charcoal-500 dark:text-slate-400">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
