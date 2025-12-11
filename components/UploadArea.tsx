

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus, Presentation, ArrowLeftRight } from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';

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
    </