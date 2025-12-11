

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus, Presentation } from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';

interface UploadAreaProps {
  onDrop: DropzoneOptions['onDrop'];
  mode: AppMode;
  disabled?: boolean;
  isProcessing?: boolean;
}

const STROKE_COLOR = "currentColor";
const FILL_COLOR = "currentColor";

// --- Tool Specific Animated Icons ---

const ImageToPdfIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-purple overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      {/* Back Sheet */}
      <rect x="35" y="25" width="40" height="50" rx="4" fill={FILL_COLOR} fillOpacity="0.1" stroke={STROKE_COLOR} strokeWidth="2.5" />
      <path d="M75 25 V35 H65" stroke={STROKE_COLOR} strokeWidth="2" strokeLinejoin="round" />
      {/* Front Sheet */}
      <motion.g animate={{ x: [-5, 0, -5], y: [5, 0, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
         <rect x="25" y="35" width="40" height="50" rx="4" fill="white" className="dark:fill-charcoal-900" stroke={STROKE_COLOR} strokeWidth="2.5" />
         <circle cx="38" cy="48" r="4" fill={FILL_COLOR} fillOpacity="0.2" />
         <rect x="32" y="58" width="26" height="3" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2" />
         <rect x="32" y="66" width="18" height="3" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2" />
      </motion.g>
    </motion.g>
  </motion.svg>
);

const PdfToImageIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-mint overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
    <motion.g animate={{ x: [0, 15, 0], y: [0, 10, 0], opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
       <rect x="55" y="45" width="35" height="40" rx="3" fill="white" className="dark:fill-charcoal-800" stroke={STROKE_COLOR} strokeWidth="2.5" />
       <circle cx="72.5" cy="60" r="5" fill={FILL_COLOR} fillOpacity="0.2" />
    </motion.g>
  </motion.svg>
);

const CompressIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-violet overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path d="M50 20 V40" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ d: ["M50 15 V35", "M50 25 V45", "M50 15 V35"] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.path d="M50 80 V60" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ d: ["M50 85 V65", "M50 75 V55", "M50 85 V65"] }} transition={{ duration: 2, repeat: Infinity }} />
    <rect x="30" y="30" width="40" height="40" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" />
    <motion.rect x="35" y="42" width="30" height="16" rx="2" fill={FILL_COLOR} fillOpacity="0.2" animate={{ scaleX: [1, 0.8, 1] }} transition={{ duration: 2, repeat: Infinity }} />
  </motion.svg>
);

const MergeIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-orange overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.g animate={{ x: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
      <rect x="25" y="30" width="30" height="40" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
    </motion.g>
    <motion.g animate={{ x: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
      <rect x="45" y="30" width="30" height="40" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" />
    </motion.g>
    <path d="M35 50 H65" stroke={STROKE_COLOR} strokeWidth="2" strokeDasharray="4 4" />
  </motion.svg>
);

const SplitIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-blue overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="25" width="40" height="50" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" />
    <path d="M20 50 H80" stroke={STROKE_COLOR} strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
    <motion.g animate={{ rotate: [0, -15, 0] }} style={{ originX: "50%", originY: "50%" }} transition={{ duration: 2, repeat: Infinity }}>
       <path d="M65 40 L65 60" stroke={STROKE_COLOR} strokeWidth="2" />
       <circle cx="65" cy="40" r="3" fill="white" stroke={STROKE_COLOR} strokeWidth="2" />
       <circle cx="65" cy="60" r="3" fill="white" stroke={STROKE_COLOR} strokeWidth="2" />
    </motion.g>
  </motion.svg>
);

const ZipIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 30 H70 V80 H30 Z" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" strokeLinejoin="round" />
    <path d="M30 30 L40 20 H60 L70 30" stroke={STROKE_COLOR} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    <motion.path d="M50 30 V60" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ d: ["M50 30 V40", "M50 30 V70", "M50 30 V40"] }} transition={{ duration: 3, repeat: Infinity }} />
    <rect x="46" y="55" width="8" height="10" rx="2" fill={FILL_COLOR} />
  </motion.svg>
);

const WordIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" />
    <text x="50" y="55" fontSize="24" fontWeight="bold" fill={STROKE_COLOR} textAnchor="middle" fontFamily="sans-serif">W</text>
    <motion.path d="M75 75 L85 85 M75 85 L85 75" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
  </motion.svg>
);

const DefaultHeroIcon = () => (
  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
    <Plus className="w-16 h-16 text-brand-purple" />
  </motion.div>
);

const HeroIconForTool: React.FC<{ tool: AppMode }> = ({ tool }) => {
  switch (tool) {
    case 'image-to-pdf': return <ImageToPdfIcon />;
    case 'pdf-to-image': return <PdfToImageIcon />;
    case 'compress-pdf': return <CompressIcon />;
    case 'merge-pdf': return <MergeIcon />;
    case 'split-pdf': return <SplitIcon />;
    case 'zip-files': return <ZipIcon />;
    case 'word-to-pdf': return <WordIcon />;
    default: return <DefaultHeroIcon />;
  }
};

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled, isProcessing }) => {
  const [dropState, setDropState] = useState<'idle' | 'dragActive' | 'dropSuccess' | 'error'>('idle');

  const handleDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
    if (fileRejections.length > 0) {
      setDropState('error');
      setTimeout(() => setDropState('idle'), 1500);
    } else if (acceptedFiles.length > 0) {
      setDropState('dropSuccess');
      // Keep success state until component unmounts or prop changes if we want visuals
      setTimeout(() => setDropState('idle'), 1500);
    }
    if (onDrop) onDrop(acceptedFiles, fileRejections, event);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDragEnter: () => setDropState('dragActive'),
    onDragLeave: () => setDropState('idle'),
    accept: mode === 'image-to-pdf' 
      ? { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] }
      : mode === 'zip-files'
        ? undefined
        : mode === 'word-to-pdf'
          ? { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
          : { 'application/pdf': ['.pdf'] },
    disabled: disabled || isProcessing,
    multiple: mode === 'image-to-pdf' || mode === 'merge-pdf' || mode === 'zip-files' || mode === 'compress-pdf',
    maxSize: mode === 'image-to-pdf' ? 25 * 1024 * 1024 : undefined
  });

  useEffect(() => {
    if (isDragActive && dropState === 'idle') {
      setDropState('dragActive');
    }
  }, [isDragActive, dropState]);

  const containerVariants: Variants = {
    idle: { scale: 1, borderColor: 'rgba(0,0,0,0)', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
    dragActive: { scale: 1.02, borderColor: '#7C3AED', boxShadow: "0 20px 40px -5px rgba(124, 58, 237, 0.2)" },
    dropSuccess: { scale: 1.02, borderColor: '#22C55E' },
    error: { x: [-4, 4, -3, 3, 0], borderColor: '#F43F5E' }
  };

  return (
    <motion.div 
      {...getRootProps()} 
      variants={containerVariants}
      initial="idle"
      animate={dropState}
      whileTap={{ scale: 0.98 }}
      className={`
        cursor-pointer group relative overflow-hidden
        min-h-[260px] flex flex-col items-center justify-center
        rounded-[24px] w-full
        bg-white dark:bg-charcoal-900
        border border-slate-100 dark:border-white/5
        transition-all duration-300
        ui-element
        ${(disabled || isProcessing) ? 'pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />

      <AnimatePresence>
        {isProcessing && <FileProcessingLoader />}
      </AnimatePresence>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center gap-5 px-6 text-center transition-opacity duration-300 ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
        
        <div className="w-24 h-24 rounded-2xl bg-pastel-bg dark:bg-charcoal-850 flex items-center justify-center shadow-inner">
           <HeroIconForTool tool={mode} />
        </div>
        
        <div>
          <span className="block font-heading font-bold text-charcoal-900 dark:text-white text-xl md:text-2xl tracking-tight">
            {dropState === 'dragActive' ? "Release to Add" : "Tap to Select"}
          </span>
          <p className="text-charcoal-500 dark:text-charcoal-400 text-sm font-medium mt-1.5">
             or drag files here
          </p>
        </div>

        {/* Button Visual */}
        <div className="px-6 py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-full font-bold text-sm shadow-lg shadow-charcoal-900/10 flex items-center gap-2 mt-2 transform group-hover:scale-105 transition-transform duration-300">
           <Plus className="w-4 h-4" />
           <span>Select Files</span>
        </div>

      </div>
    </motion.div>
  );
};