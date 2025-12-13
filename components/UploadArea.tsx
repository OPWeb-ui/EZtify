
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus, Presentation, ArrowLeftRight, Code } from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap } from '../utils/animations';

const STROKE_COLOR = "currentColor";
const FILL_COLOR = "currentColor";
const ANIM_DURATION = 3;
const ANIM_EASE = "easeInOut";

// --- Limits Configuration ---
const getToolLimits = (mode: AppMode) => {
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
        case 'grayscale-pdf':
            return { maxSize: 100 * MB, maxFiles: 10 };
        case 'zip-files':
            return { maxSize: 100 * MB, maxFiles: 50 };
        case 'word-to-pdf':
        case 'pdf-to-word':
        case 'pdf-to-pptx':
            return { maxSize: 50 * MB, maxFiles: 1 };
        case 'split-pdf':
        case 'reorder-pdf':
        case 'rotate-pdf':
        case 'delete-pdf-pages':
        case 'unlock-pdf':
        case 'add-page-numbers':
        case 'redact-pdf':
            return { maxSize: 100 * MB, maxFiles: 1 };
        case 'code-editor':
            return { maxSize: 5 * MB, maxFiles: 20 };
        default:
            return { maxSize: undefined, maxFiles: 0 }; // 0 = unlimited files
    }
};


// --- Tool Specific Animated Icons ---

const ImageToPdfIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-purple overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}>
      {/* Back Sheet */}
      <rect x="35" y="25" width="40" height="50" rx="4" fill={FILL_COLOR} fillOpacity="0.1" stroke={STROKE_COLOR} strokeWidth="2.5" />
      <path d="M75 25 V35 H65" stroke={STROKE_COLOR} strokeWidth="2" strokeLinejoin="round" />
      {/* Front Sheet */}
      <motion.g animate={{ x: [-5, 0, -5], y: [5, 0, 5] }} transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}>
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
    <motion.g animate={{ x: [0, 15, 0], y: [0, 10, 0], opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}>
       <rect x="55" y="45" width="35" height="40" rx="3" fill="white" className="dark:fill-charcoal-800" stroke={STROKE_COLOR} strokeWidth="2.5" />
       <circle cx="72.5" cy="60" r="5" fill={FILL_COLOR} fillOpacity="0.2" />
    </motion.g>
  </motion.svg>
);

const CompressIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-violet overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path d="M50 20 V40" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ d: ["M50 15 V35", "M50 25 V45", "M50 15 V35"] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
    <motion.path d="M50 80 V60" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" animate={{ d: ["M50 85 V65", "M50 75 V55", "M50 85 V65"] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
    <rect x="30" y="30" width="40" height="40" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1" />
    <motion.rect x="35" y="42" width="30" height="16" rx="2" fill={FILL_COLOR} fillOpacity="0.2" animate={{ scaleX: [1, 0.8, 1] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
  </motion.svg>
);

const MergeIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-orange overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g animate={{ x: [0, 10, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}>
        <rect x="25" y="30" width="30" height="40" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
      </motion.g>
      <motion.g animate={{ x: [0, -10, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, delay: 0.5, ease: ANIM_EASE }}>
        <rect x="45" y="30" width="30" height="40" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
      </motion.g>
    </motion.svg>
);

const SplitIcon = () => (
  <motion.svg viewBox="0 0 100 100" className="w-full h-full text-brand-blue overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Half */}
      <motion.path 
        d="M25 20 H75 V45 H25 Z" 
        stroke={STROKE_COLOR} 
        strokeWidth="2.5" 
        fill="white" className="dark:fill-charcoal-900"
        animate={{ y: [-2, -6, -2] }} 
        transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
      />
      {/* Bottom Half */}
      <motion.path 
        d="M25 55 H75 V80 H25 Z" 
        stroke={STROKE_COLOR} 
        strokeWidth="2.5" 
        fill="white" className="dark:fill-charcoal-900"
        animate={{ y: [2, 6, 2] }} 
        transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
      />
      {/* Cut Line */}
      <motion.path 
        d="M20 50 H80" 
        stroke={STROKE_COLOR} 
        strokeWidth="2" 
        strokeDasharray="4 4" 
        strokeOpacity="0.5"
      />
      {/* Scissors moving */}
      <motion.g 
        animate={{ x: [0, 40, 0] }} 
        transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
      >
         <path d="M25 50 L35 45 M25 50 L35 55" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" />
         <circle cx="22" cy="50" r="3" stroke={STROKE_COLOR} strokeWidth="2" />
      </motion.g>
  </motion.svg>
);

const ZipIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="60" height="50" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.1"/>
        <path d="M20 30 H80" stroke={STROKE_COLOR} strokeWidth="2.5" />
        {/* Zipper Teeth */}
        <path d="M50 30 V80" stroke={STROKE_COLOR} strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
        {/* Zipper Pull */}
        <motion.g 
            animate={{ y: [0, 40, 0] }} 
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        >
            <rect x="46" y="26" width="8" height="12" rx="2" fill="white" stroke={STROKE_COLOR} strokeWidth="2" />
            <circle cx="50" cy="36" r="1" fill={STROKE_COLOR} />
        </motion.g>
    </motion.svg>
);

const WordToPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        {/* Animated Lines */}
        <motion.rect 
            x="38" y="35" width="24" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2"
            animate={{ width: [24, 18, 24] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE, delay: 0 }}
        />
        <motion.rect 
            x="38" y="45" width="18" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2"
            animate={{ width: [18, 24, 18] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE, delay: 0.5 }}
        />
        <motion.rect 
            x="38" y="55" width="22" height="4" rx="1.5" fill={FILL_COLOR} fillOpacity="0.2"
            animate={{ width: [22, 16, 22] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE, delay: 1 }}
        />
        {/* Checkmark Badge */}
        <motion.circle 
            cx="75" cy="75" r="10" 
            fill="white" stroke={STROKE_COLOR} strokeWidth="2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />
        <path d="M72 75 L75 78 L80 72" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
);

const PdfToWordIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g animate={{ x: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}>
        <rect x="20" y="25" width="30" height="50" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <rect x="25" y="35" width="20" height="3" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
        <rect x="25" y="45" width="15" height="3" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
      </motion.g>
      <path d="M55 50 L 65 50 M 60 45 L 65 50 L 60 55" stroke={STROKE_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <motion.g animate={{ x: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}>
        <rect x="70" y="25" width="30" height="50" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <rect x="75" y="35" width="20" height="3" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
        <rect x="75" y="45" width="15" height="3" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
      </motion.g>
    </motion.svg>
);

const PdfToPptxIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-orange-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <motion.g animate={{ x: [0, 20, 0], opacity: [0, 1, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}>
           <rect x="55" y="35" width="40" height="30" rx="3" fill="white" className="dark:fill-charcoal-800" stroke={STROKE_COLOR} strokeWidth="2.5" />
           <circle cx="75" cy="50" r="5" fill={FILL_COLOR} fillOpacity="0.2" />
        </motion.g>
    </motion.svg>
);

const ReorderPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Page 1 - Top moving down */}
        <motion.rect 
            x="30" y="20" width="40" height="25" rx="3" 
            stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900"
            animate={{ y: [0, 35, 0], zIndex: [0, 10, 0] }} 
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />
        {/* Page 2 - Bottom moving up */}
        <motion.rect 
            x="30" y="55" width="40" height="25" rx="3" 
            stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900"
            animate={{ y: [0, -35, 0] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />
        
        {/* Curved arrows indicating swap on side */}
        <path d="M80 35 Q 90 50 80 65" stroke={STROKE_COLOR} strokeWidth="2" fill="none" strokeDasharray="3 3" opacity="0.5" />
        <path d="M78 62 L 80 65 L 83 62" stroke={STROKE_COLOR} strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M80 35 L 83 38 M 80 35 L 77 38" stroke={STROKE_COLOR} strokeWidth="2" fill="none" opacity="0.5" />
    </motion.svg>
);

const RotatePdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-purple-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.g 
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "50px", originY: "50px" }}
        >
            {/* Page Outline */}
            <rect x="30" y="25" width="40" height="50" rx="3" stroke={STROKE_COLOR} strokeWidth="2.5" fill="white" className="dark:fill-charcoal-900" />
            
            {/* Header Block */}
            <rect x="36" y="32" width="28" height="15" rx="1.5" fill={FILL_COLOR} fillOpacity="0.1" />
            
            {/* Lines */}
            <rect x="36" y="52" width="28" height="2.5" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
            <rect x="36" y="58" width="20" height="2.5" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
            <rect x="36" y="64" width="24" height="2.5" rx="1" fill={FILL_COLOR} fillOpacity="0.2" />
        </motion.g>
        
        {/* Subtle Side Indicator Arrow - Fades in during the turn */}
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
             <path
                d="M 82 40 A 15 15 0 0 1 82 60"
                stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 79 57 L 82 60 L 85 57"
                stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
        </motion.g>
    </motion.svg>
);

const DeletePdfPagesIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-rose-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Page */}
        <motion.rect 
            x="20" y="35" width="22" height="30" rx="2" 
            fill={FILL_COLOR} fillOpacity="0.1" stroke={STROKE_COLOR} strokeWidth="2.5"
            animate={{ x: [0, 10, 0] }} // Slide in to fill gap
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />
        
        {/* Right Page */}
        <motion.rect 
            x="58" y="35" width="22" height="30" rx="2" 
            fill={FILL_COLOR} fillOpacity="0.1" stroke={STROKE_COLOR} strokeWidth="2.5"
            animate={{ x: [0, -10, 0] }} // Slide in to fill gap
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />

        {/* Middle Page (The Victim) */}
        <motion.g
            animate={{ y: [0, -15, 0], opacity: [1, 0, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        >
            <rect x="39" y="35" width="22" height="30" rx="2" fill="white" className="dark:fill-charcoal-900" stroke={STROKE_COLOR} strokeWidth="2.5" />
            {/* X Mark */}
            <path d="M45 45 L 55 55 M 55 45 L 45 55" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" />
        </motion.g>
    </motion.svg>
);

const UnlockPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-rose-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <g>
            <motion.path
                d="M75 50 a 5 5 0 0 1 -10 0"
                stroke={STROKE_COLOR} strokeWidth="2.5" strokeLinecap="round"
                animate={{ d: ["M75 50 a 5 5 0 0 1 -10 0", "M65 45 a 5 5 0 0 1 10 0", "M75 50 a 5 5 0 0 1 -10 0"] }}
                transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
            />
            <rect x="65" y="50" width="20" height="15" rx="3" fill={FILL_COLOR} fillOpacity="0.1" stroke={STROKE_COLOR} strokeWidth="2.5"/>
            <circle cx="75" cy="58" r="1.5" fill={STROKE_COLOR} />
        </g>
    </motion.svg>
);

const AddPageNumbersIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <motion.g animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}>
            <rect x="45" y="70" width="10" height="6" rx="1" fill={FILL_COLOR} />
        </motion.g>
    </motion.svg>
);

const RedactPdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-slate-600 dark:text-slate-400 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <motion.rect 
            x="40" y="45" width="20" height="4" rx="1" fill={FILL_COLOR} 
            animate={{ width: [20, 25, 20] }} 
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        />
        <motion.rect 
            x="35" y="55" width="30" height="4" rx="1" fill={FILL_COLOR} 
            animate={{ width: [30, 25, 30] }} 
            transition={{ duration: ANIM_DURATION, repeat: Infinity, delay: 0.2, ease: ANIM_EASE }}
        />
        <path d="M65 30 L 75 40" stroke={STROKE_COLOR} strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
);

const GrayscalePdfIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="grayscaleClip">
                <motion.rect 
                    x="30" y="20" width="40" height="0"
                    animate={{ height: [0, 60, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}
                />
            </clipPath>
        </defs>

        {/* Base Document Outline */}
        <rect x="30" y="20" width="40" height="60" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" className="text-slate-600 dark:text-slate-400" fill="none" />

        {/* 1. COLOR LAYER (Underneath) */}
        <g>
            <circle cx="50" cy="45" r="10" fill="#8B5CF6" /> {/* Brand Purple */}
            <rect x="38" y="60" width="24" height="3" rx="1.5" fill="#3B82F6" /> {/* Brand Blue */}
            <rect x="42" y="66" width="16" height="3" rx="1.5" fill="#10B981" /> {/* Brand Mint */}
        </g>

        {/* 2. GRAYSCALE LAYER (On Top, Clipped) */}
        <g clipPath="url(#grayscaleClip)">
            <circle cx="50" cy="45" r="10" fill="#64748b" />
            <rect x="38" y="60" width="24" height="3" rx="1.5" fill="#94a3b8" />
            <rect x="42" y="66" width="16" height="3" rx="1.5" fill="#cbd5e1" />
        </g>

        {/* 3. SCANNER LINE */}
        <motion.path 
            d="M25 20 H75" 
            stroke={STROKE_COLOR} 
            strokeWidth="2" 
            className="text-slate-400 dark:text-slate-500"
            strokeDasharray="2 2"
            animate={{ y: [0, 60, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: ANIM_EASE }}
        />
    </motion.svg>
);

const CodeEditorIcon = () => (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="4" stroke={STROKE_COLOR} strokeWidth="2.5" fill={FILL_COLOR} fillOpacity="0.05" />
        <motion.g
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        >
            <path d="M35 45 L 45 50 L 35 55" stroke={STROKE_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <motion.g
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
        >
            <path d="M65 45 L 55 50 L 65 55" stroke={STROKE_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <path d="M45 60 L 55 40" stroke={STROKE_COLOR} strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
);

// --- MAIN COMPONENT ---
interface UploadAreaProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event?: DropEvent) => void;
  mode: AppMode;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled, isProcessing }) => {
  const { isMobile } = useLayoutContext();
  const shouldReduceMotion = useReducedMotion();

  const limits = getToolLimits(mode);

  const getAcceptForMode = (mode: AppMode) => {
    switch (mode) {
        case 'image-to-pdf':
            return { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] };
        case 'word-to-pdf':
            return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] };
        case 'zip-files':
          return undefined; // All files
        case 'pdf-to-image':
        case 'compress-pdf':
        case 'merge-pdf':
        case 'split-pdf':
        case 'reorder-pdf':
        case 'pdf-to-word':
        case 'pdf-to-pptx':
        case 'rotate-pdf':
        case 'delete-pdf-pages':
        case 'unlock-pdf':
        case 'add-page-numbers':
        case 'redact-pdf':
        case 'grayscale-pdf':
            return { 'application/pdf': ['.pdf'] };
        case 'code-editor':
            return { 
                'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.sql', '.yaml', '.yml', '.ini', '.cfg', '.env', '.gitignore'] 
            };
        default:
            return undefined;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: limits.maxSize,
    maxFiles: limits.maxFiles === 1 ? undefined : limits.maxFiles, 
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
        case 'pdf-to-word':
            return { icon: <PdfToWordIcon />, title: "Upload PDF", description: "Or drop a PDF to convert", buttonLabel: "Select PDF" };
        case 'pdf-to-pptx':
            return { icon: <PdfToPptxIcon />, title: "Upload PDF", description: "Or drop a PDF to convert", buttonLabel: "Select PDF" };
        case 'reorder-pdf':
            return { icon: <ReorderPdfIcon />, title: "Upload PDF", description: "Or drop a file to reorder", buttonLabel: "Select PDF" };
        case 'rotate-pdf':
            return { icon: <RotatePdfIcon />, title: "Upload PDF", description: "Or drop a file to rotate", buttonLabel: "Select PDF" };
        case 'delete-pdf-pages':
            return { icon: <DeletePdfPagesIcon />, title: "Upload PDF", description: "Or drop a file to delete pages", buttonLabel: "Select PDF" };
        case 'unlock-pdf':
            return { icon: <UnlockPdfIcon />, title: "Upload PDF", description: "Or drop a PDF to unlock", buttonLabel: "Select PDF" };
        case 'add-page-numbers':
            return { icon: <AddPageNumbersIcon />, title: "Upload PDF", description: "Or drop a file to add numbers", buttonLabel: "Select PDF" };
        case 'redact-pdf':
            return { icon: <RedactPdfIcon />, title: "Upload PDF", description: "Or drop a file to redact", buttonLabel: "Select PDF" };
        case 'grayscale-pdf':
            return { icon: <GrayscalePdfIcon />, title: "Upload PDFs", description: "Or drop files to convert", buttonLabel: "Select PDFs" };
        case 'code-editor':
            return { icon: <CodeEditorIcon />, title: "Open Files", description: "Drop text or code files to edit", buttonLabel: "Select Files" };
        default:
             return { icon: <ImageToPdfIcon />, title: "Upload Files", description: "Or drop files here", buttonLabel: "Select Files" };
    }
  };

  const { icon, description, buttonLabel } = getToolInfo();

  return (
    <motion.div
        {...getRootProps()}
        className="relative outline-none w-full h-full"
        whileHover={!disabled && !isProcessing ? { scale: 1.01 } : {}}
        transition={{ duration: 0.2 }}
    >
        <input {...getInputProps()} />
        <div
            className={`
                relative w-full 
                min-h-[320px] sm:min-h-[380px] md:min-h-[420px]
                rounded-[32px] overflow-hidden
                border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center text-center
                p-6 sm:p-8 md:p-10
                ${isDragActive ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-300 dark:border-charcoal-700 bg-white/50 dark:bg-charcoal-900/50'}
                ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-brand-purple/70'}
            `}
        >
            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-20">
                        <FileProcessingLoader />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="content" 
                        initial={{opacity:0, y: 10}} 
                        animate={{opacity:1, y: 0}} 
                        exit={{opacity:0, y: -10}} 
                        className="flex flex-col items-center justify-center w-full max-w-lg z-10"
                    >
                        <motion.div 
                            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-6 sm:mb-8 text-brand-purple/80" 
                            animate={isDragActive ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {icon}
                        </motion.div>
                        
                        <motion.div
                            whileTap={!disabled && !isProcessing ? buttonTap : {}}
                            className="
                                px-6 py-3 sm:px-8 sm:py-4 
                                bg-brand-purple text-white 
                                text-sm sm:text-base font-bold 
                                rounded-2xl shadow-lg shadow-brand-purple/20 
                                flex items-center gap-2.5 
                                hover:bg-brand-purpleDark hover:shadow-brand-purple/30 
                                transition-all
                            "
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>{buttonLabel}</span>
                        </motion.div>
                        
                        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-4 sm:mt-6 font-medium max-w-xs sm:max-w-sm leading-relaxed">
                            {description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};
