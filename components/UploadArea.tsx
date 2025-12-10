import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { AppMode } from '../types';

interface UploadAreaProps {
  onDrop: DropzoneOptions['onDrop'];
  mode: AppMode;
  disabled?: boolean;
}

// ============================================================================
// GLOBAL ANIMATION CONSTANTS
// ============================================================================
const ANIM_DURATION = 3;
const ANIM_EASE = "easeInOut";
const STROKE_WIDTH = 2.5;

// ============================================================================
// STANDARDIZED HERO ICONS
// ============================================================================

// 1. IMAGES TO PDF
const ImagesToPdfHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-brand-purple overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="30" y="30" width="40" height="50" rx="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white" />
    <motion.rect
      x="32" y="32" width="36" height="28" rx="2" fill="#E9D5FF" stroke="none"
      initial={{ x: -20, y: -20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0, 0.2, 0.8, 1], ease: ANIM_EASE }}
    />
    <motion.rect
      x="32" y="48" width="36" height="28" rx="2" fill="#D8B4FE" stroke="none"
      initial={{ x: 20, y: 20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0, 0.2, 0.8, 1], ease: ANIM_EASE, delay: 0.2 }}
    />
  </motion.svg>
);

// 2. PDF TO IMAGES
const PdfToImagesHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-brand-mint overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="25" y="25" width="40" height="50" rx="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white" />
    <path d="M35 35H55 M35 45H55" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <motion.g
      initial={{ x: 25, y: 35, opacity: 0 }}
      animate={{ x: 55, opacity: [0, 1, 1, 0] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
    >
      <rect width="30" height="24" rx="2" fill="#ecfdf5" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
      <circle cx="15" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
    </motion.g>
  </motion.svg>
);

// 3. COMPRESS PDF
const CompressPdfHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-brand-violet overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <motion.rect
      x="30" y="25" width="40" height="50" rx="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white"
      style={{ transformOrigin: "center" }}
      animate={{ scaleX: [1, 0.7, 1] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
    />
    <motion.path d="M15 50 H25 M20 45 L25 50 L20 55" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" animate={{ x: [0, 5, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
    <motion.path d="M85 50 H75 M80 45 L75 50 L80 55" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" animate={{ x: [0, -5, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
  </motion.svg>
);

// 4. MERGE PDF
const MergePdfHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-brand-orange overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="30" y="45" width="40" height="40" rx="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white" />
    <motion.rect
      x="30" y="20" width="40" height="40" rx="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="#ffedd5"
      animate={{ y: [0, 25, 0], opacity: [1, 0, 0, 1] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0, 0.5, 0.51, 1], ease: ANIM_EASE }}
    />
    <motion.g animate={{ scale: [0, 1, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0.4, 0.5, 0.6], ease: ANIM_EASE }}>
       <circle cx="50" cy="65" r="10" fill="white" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
       <path d="M50 60V70 M45 65H55" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </motion.g>
  </motion.svg>
);

// 5. SPLIT PDF
const SplitPdfHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-brand-blue overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path d="M30 25 H50 V75 H30 A2 2 0 0 1 28 73 V27 A2 2 0 0 1 30 25 Z" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white" animate={{ x: [0, -8, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
    <motion.path d="M50 25 H70 A2 2 0 0 1 72 27 V73 A2 2 0 0 1 70 75 H50 V25 Z" stroke="currentColor" strokeWidth={STROKE_WIDTH} fill="white" animate={{ x: [0, 8, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
    <motion.line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth={2} strokeDasharray="3 3" animate={{ opacity: [0, 1, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }} />
  </motion.svg>
);

// 6. ZIP IT
const ZipItHeroIcon = () => (
  <motion.svg
    viewBox="0 0 100 100"
    className="w-full h-full text-amber-500 overflow-visible"
    fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M30 40 L35 35 H45 L50 40 H70 V70 H30 V40 Z" fill="#fef3c7" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
    <motion.rect x="40" y="10" width="10" height="12" rx="1" fill="white" stroke="currentColor" strokeWidth={2} animate={{ y: [0, 40, 40, 0], opacity: [1, 1, 0, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0, 0.3, 0.4, 1], ease: "easeIn" }} />
    <motion.rect x="50" y="5" width="10" height="12" rx="1" fill="white" stroke="currentColor" strokeWidth={2} animate={{ y: [0, 45, 45, 0], opacity: [1, 1, 0, 0] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0.1, 0.4, 0.5, 1], ease: "easeIn" }} />
    <motion.path d="M28 45 H72 L70 70 H30 L28 45 Z" fill="#fde68a" stroke="currentColor" strokeWidth={STROKE_WIDTH} style={{ transformOrigin: "bottom center" }} animate={{ scaleY: [1, 0.9, 1] }} transition={{ duration: ANIM_DURATION, repeat: Infinity, times: [0.35, 0.45, 0.6], ease: "easeOut" }} />
  </motion.svg>
);

const DefaultHeroIcon = () => (
  <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
    <Plus className="w-16 h-16 text-brand-purple" />
  </motion.div>
);

const HeroIconForTool: React.FC<{ tool: AppMode }> = ({ tool }) => {
  switch (tool) {
    case 'image-to-pdf': return <ImagesToPdfHeroIcon />;
    case 'pdf-to-image': return <PdfToImagesHeroIcon />;
    case 'compress-pdf': return <CompressPdfHeroIcon />;
    case 'merge-pdf': return <MergePdfHeroIcon />;
    case 'split-pdf': return <SplitPdfHeroIcon />;
    case 'zip-files': return <ZipItHeroIcon />;
    default: return <DefaultHeroIcon />;
  }
};

// ============================================================================
// UPLOAD AREA COMPONENT
// ============================================================================

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled }) => {
  const [dropState, setDropState] = useState<'idle' | 'dragActive' | 'dropSuccess' | 'error'>('idle');
  const shouldReduceMotion = useReducedMotion();

  // Handle transient states for Success/Error
  const handleDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
    if (fileRejections.length > 0) {
      setDropState('error');
      setTimeout(() => setDropState('idle'), 500); // Shake duration
    } else if (acceptedFiles.length > 0) {
      setDropState('dropSuccess');
      setTimeout(() => setDropState('idle'), 500); // Success duration
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
        : { 'application/pdf': ['.pdf'] },
    disabled,
    multiple: mode === 'image-to-pdf' || mode === 'merge-pdf' || mode === 'zip-files',
    maxSize: mode === 'image-to-pdf' ? 25 * 1024 * 1024 : undefined
  });

  // Sync state if dragged from outside directly (edge case fix)
  useEffect(() => {
    if (isDragActive && dropState === 'idle') {
      setDropState('dragActive');
    }
  }, [isDragActive, dropState]);

  const getGradientClass = () => {
     switch(mode) {
      case 'image-to-pdf': return 'from-brand-purple via-brand-blue to-brand-blue';
      case 'pdf-to-image': return 'from-brand-purple via-brand-mint to-brand-mint';
      case 'compress-pdf': return 'from-brand-purple via-brand-violet to-brand-violet';
      case 'merge-pdf': return 'from-brand-purple via-brand-orange to-brand-orange';
      case 'split-pdf': return 'from-brand-purple via-brand-mint to-brand-blue';
      case 'zip-files': return 'from-amber-500 via-orange-500 to-amber-500';
      default: return 'from-brand-purple via-brand-blue to-brand-mint';
    }
  };

  const getHeadline = () => {
    if (dropState === 'dragActive') return "Release to add files";
    if (mode === 'image-to-pdf') return "Drop images here";
    if (mode === 'compress-pdf') return "Drop PDF here";
    if (mode === 'merge-pdf') return "Drop your PDFs here";
    if (mode === 'split-pdf') return "Drop PDF here";
    if (mode === 'zip-files') return "Drop files here";
    return "Drop PDF here";
  };

  const getSubtext = () => {
    if (mode === 'image-to-pdf') return "Supports JPG, PNG, WebP, GIF, BMP";
    if (mode === 'compress-pdf') return "Reduce file size instantly";
    if (mode === 'merge-pdf') return "Combine multiple files into one";
    if (mode === 'split-pdf') return "Extract pages or split into files";
    if (mode === 'zip-files') return "Create a ZIP archive instantly";
    return "Convert any PDF into high-quality images";
  };

  // --- Framer Motion Variants ---
  const containerVariants: Variants = {
    idle: {
      scale: shouldReduceMotion ? 1 : [1, 1.02, 1], // Gentle breathing scale
      y: 0,
      x: 0,
      borderColor: 'rgba(255, 255, 255, 0)', // Transparent (handled by SVG dash)
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
      transition: {
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        borderColor: { duration: 0.3 }
      }
    },
    dragActive: {
      scale: 1.02,
      y: -4,
      x: 0,
      borderColor: 'rgba(109, 40, 217, 0.6)', // Brand Purple
      boxShadow: "0 20px 25px -5px rgba(109, 40, 217, 0.2)",
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    dropSuccess: {
      scale: 1.04,
      y: 0,
      x: 0,
      borderColor: '#22C55E', // Green
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    error: {
      scale: 1,
      y: 0,
      x: [-4, 4, -3, 3, 0], // Shake
      borderColor: '#F43F5E', // Rose
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  return (
    <motion.div 
      {...getRootProps()} 
      variants={containerVariants}
      initial="idle"
      animate={dropState}
      className={`
        cursor-pointer group relative overflow-hidden
        backdrop-blur-md
        min-h-[240px] md:min-h-[320px] flex flex-col items-center justify-center
        rounded-3xl w-full
        border-2
        transition-colors duration-300
        ${dropState === 'dragActive' 
          ? 'bg-brand-purple/5 dark:bg-brand-purple/10' 
          : 'bg-white/80 dark:bg-charcoal-900/60 hover:bg-white dark:hover:bg-charcoal-900 border-transparent dark:border-charcoal-700'
        }
        ${dropState === 'error' ? 'bg-rose-50 dark:bg-rose-900/20' : ''}
        ${dropState === 'dropSuccess' ? 'bg-green-50 dark:bg-green-900/20' : ''}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />

      {/* Background Gradient Effects */}
      <div className={`absolute inset-0 rounded-3xl overflow-hidden pointer-events-none transition-opacity duration-300 ${dropState === 'dragActive' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
         <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass()} opacity-20 blur-md`} />
      </div>
      
      {/* Idle Shimmer Effect */}
      <AnimatePresence>
        {dropState === 'idle' && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent skew-x-12"
              animate={{ translateX: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dashed Border Animation (SVG) */}
      <motion.svg 
        className={`absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300 ${dropState === 'dragActive' ? 'text-brand-purple' : 'text-charcoal-500/20 dark:text-charcoal-600/30 group-hover:text-brand-purple/40'}`}
        animate={dropState === 'error' ? { color: "#F43F5E" } : dropState === 'dropSuccess' ? { color: "#22C55E" } : {}}
      >
        <rect
          width="100%" height="100%" x="0" y="0" rx="24" ry="24"
          fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="16 16"
        />
        {/* Marching Ants (Only when active) */}
        <motion.rect
          width="100%" height="100%" x="0" y="0" rx="24" ry="24"
          fill="none" stroke="currentColor" strokeWidth={4}
          strokeDasharray="16 16"
          animate={{ strokeDashoffset: -32 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`transition-opacity duration-300 ${dropState === 'dragActive' ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 px-6 text-center">
        
        {/* Hero Icon Wrapper - Bounces slightly on Drag */}
        <motion.div 
          className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white dark:bg-charcoal-800 shadow-lg shadow-charcoal-500/5 flex items-center justify-center mb-1 transition-transform duration-500 ease-out border border-white/50 dark:border-white/5 overflow-visible"
          animate={dropState === 'dragActive' ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
        >
          <div className="w-20 h-20 md:w-24 md:h-24">
             <HeroIconForTool tool={mode} />
          </div>
        </motion.div>
        
        <div>
          <motion.span 
            key={getHeadline()} // Animate text swap
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="block font-heading font-bold text-charcoal-800 dark:text-white text-xl md:text-3xl mb-2 md:mb-3 tracking-tight"
          >
            {getHeadline()}
          </motion.span>
          <p className="text-charcoal-500 dark:text-charcoal-400 text-xs md:text-base font-medium max-w-[260px] mx-auto leading-relaxed">
             {getSubtext()}
          </p>
        </div>

        {/* Button */}
        <motion.div 
          className="relative overflow-hidden mt-1 px-6 py-2.5 md:px-8 md:py-3 bg-brand-purple text-white rounded-full font-bold shadow-lg shadow-brand-purple/30 group-hover:shadow-brand-purple/50 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
           <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
           <Plus className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
           <span className="text-sm md:text-base relative z-10">Select Files</span>
        </motion.div>

      </div>
    </motion.div>
  );
};