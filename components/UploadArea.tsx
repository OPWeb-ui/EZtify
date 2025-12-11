import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus, Presentation, ArrowLeftRight } from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap } from '../utils/animations';

const STROKE_COLOR = "currentColor";
const FILL_COLOR = "currentColor";

// --- Limits Configuration ---
const getToolLimits = (mode: AppMode | 'reorder-pdf' | 'pptx-to-pdf') => {
    const MB = 1024 * 1024;
    switch (mode) {
        case 'image-to-pdf':
            return { maxSize: 25 * MB, maxFiles: 50 };
        case 'pdf-to-image':
            return { maxSize: 100 * MB, maxFiles: 10 };
        case 'compress-pdf':
            return { maxSize: 100 * MB, maxFiles: 10 };
        case 'merge-pdf':
            return { maxSize: 100 * MB, maxFiles: 20 };
        case 'zip-files':
            return { maxSize: 100 * MB, maxFiles: 50 };
        case 'word-to-pdf':
        case 'pptx-to-pdf':
            return { maxSize: 50 * MB, maxFiles: 1 };
        case 'split-pdf':
        case 'reorder-pdf':
            return { maxSize: 100 * MB, maxFiles: 1 };
        default:
            return { maxSize: undefined, maxFiles: 0 }; // 0 = unlimited files
    }
};


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
      <motion.g animate={{ x: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
        <rect x="45" y="30" width="30" height="40" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
      </motion.g>
    </motion.svg>
);

const SplitIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-blue overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path d="M40 70 L60 50 M40 50 L60 70" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" />
      <motion.path d="M30 30 H70" stroke={STROKE_COLOR} strokeWidth="2.5" />
      <rect x="25" y="20" width="50" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill="none" />
  </motion.svg>
);

const ZipIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="60" height="45" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1"/>
        <rect x="35" y="20" width="30" height="10" rx="2" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
        <rect x="40" y="22" width="20" height="6" rx="1" fill={FILL_COLOR} fillOpacity="0.2"/>
    </motion.svg>
);

const WordToPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <rect x="38" y="30" width="24" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2" />
        <rect x="38" y="40" width="18" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2" />
        <rect x="38" y="50" width="24" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2" />
    </motion.svg>
);

const PptxToPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-orange-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="60" height="40" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <circle cx="50" cy="50" r="8" fill={FILL_COLOR} fillOpacity="0.2" />
    </motion.svg>
);

const ReorderPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="25" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
        <rect x="30" y="55" width="40" height="25" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
        <motion.path d="M50 47 V 53" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" />
        <motion.path d="M47 50 L 53 50" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
);

// --- MAIN COMPONENT ---
interface UploadAreaProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event?: DropEvent) => void;
  mode: AppMode | 'reorder-pdf' | 'pptx-to-pdf';
  disabled?: boolean;
  isProcessing?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled, isProcessing }) => {
  const { isMobile } = useLayoutContext();
  const shouldReduceMotion = useReducedMotion();

  const limits = getToolLimits(mode);

  const getAcceptForMode = (mode: AppMode | 'reorder-pdf' | 'pptx-to-pdf') => {
    switch (mode) {
        case 'image-to-pdf':
            return { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] };
        case 'word-to-pdf':
            return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] };
        case 'pptx-to-pdf':
          return { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] };
        case 'zip-files':
          return undefined; // All files
        case 'pdf-to-image':
        case 'compress-pdf':
        case 'merge-pdf':
        case 'split-pdf':
        case 'reorder-pdf':
            return { 'application/pdf': ['.pdf'] };
        default:
            return undefined;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: limits.maxSize,
    maxFiles: limits.maxFiles === 1 ? undefined : limits.maxFiles, // maxFiles: 1 with multiple: true can be buggy. Let validator handle single file modes.
    accept: getAcceptForMode(mode),
    disabled: disabled || isProcessing,
    multiple: limits.maxFiles !== 1
  });

  const getToolInfo = () => {
    switch (mode) {
        case 'image-to-pdf':
            return { icon: <ImageToPdfIcon />, title: "Upload Images", description: "Or drop images here", buttonLabel: "Select Images" };
        case 'pdf-to-image':
            return { icon: <PdfToImageIcon />, title: "Upload PDF", description: "Or drop a PDF here", buttonLabel: "Select PDF" };
        case 'compress-pdf':
            return { icon: <CompressIcon />, title: "Upload PDFs", description: "Or drop files to compress", buttonLabel: "Select PDFs" };
        case 'merge-pdf':
            return { icon: <MergeIcon />, title: "Upload PDFs", description: "Or drop files to merge", buttonLabel: "Select PDFs" };
        case 'split-pdf':
            return { icon: <SplitIcon />, title: "Upload PDF", description: "Or drop a file to split", buttonLabel: "Select PDF" };
        case 'zip-files':
            return { icon: <ZipIcon />, title: "Upload Files", description: "Or drop files to archive", buttonLabel: "Select Files" };
        case 'word-to-pdf':
            return { icon: <WordToPdfIcon />, title: "Upload Word File", description: "Or drop a .docx file", buttonLabel: "Select DOCX" };
        case 'pptx-to-pdf':
            return { icon: <PptxToPdfIcon />, title: "Upload PowerPoint", description: "Or drop a .pptx file", buttonLabel: "Select PPTX" };
        case 'reorder-pdf':
            return { icon: <ReorderPdfIcon />, title: "Upload PDF", description: "Or drop a file to reorder", buttonLabel: "Select PDF" };
        default:
             return { icon: <ImageToPdfIcon />, title: "Upload Files", description: "Or drop files here", buttonLabel: "Select Files" };
    }
  };

  const { icon, description, buttonLabel } = getToolInfo();

  return (
    <motion.div
        {...getRootProps()}
        className="relative outline-none"
        whileHover={!disabled && !isProcessing ? { scale: 1.02 } : {}}
        transition={{ duration: 0.2 }}
    >
        <input {...getInputProps()} />
        <div
            className={`relative w-full aspect-[2/1] md:aspect-[2.5/1] rounded-3xl overflow-hidden
            border-2 border-dashed transition-all duration-300
            flex flex-col items-center justify-center text-center
            ${isDragActive ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-300 dark:border-charcoal-700 bg-white/50 dark:bg-charcoal-900/50'}
            ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-brand-purple/70'}
            `}
        >
            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <FileProcessingLoader />
                    </motion.div>
                ) : (
                    <motion.div key="content" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center p-6">
                        <motion.div 
                            className="w-20 h-20 md:w-24 md:h-24 mb-4"
                            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                        >
                            {icon}
                        </motion.div>
                        <motion.div
                            whileTap={!disabled && !isProcessing ? buttonTap : {}}
                            className="px-6 py-3 bg-brand-purple text-white font-bold rounded-full shadow-lg shadow-brand-purple/20 flex items-center gap-2"
                        >
                            <Plus />
                            {buttonLabel}
                        </motion.div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-3">{description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};