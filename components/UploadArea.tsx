import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection, DropEvent } from 'react-dropzone';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Plus, Presentation, ArrowLeftRight, Layers, ImageIcon, Minimize2, FileOutput, Scissors, FolderArchive, FileText } from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap } from '../utils/animations';

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

// --- MAIN COMPONENT ---
interface UploadAreaProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event?: DropEvent) => void;
  mode: AppMode | 'reorder-pdf' | 'pptx-to-pdf';
  disabled?: boolean;
  isProcessing?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled, isProcessing }) => {
  const [isHovered, setIsHovered] = useState(false);
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
            return { icon: <Layers className="w-full h-full text-brand-purple" />, title: "Upload Images", description: "Or drop images here", buttonLabel: "Select Images" };
        case 'pdf-to-image':
            return { icon: <ImageIcon className="w-full h-full text-brand-mint" />, title: "Upload PDF", description: "Or drop a PDF here", buttonLabel: "Select PDF" };
        case 'compress-pdf':
            return { icon: <Minimize2 className="w-full h-full text-brand-violet" />, title: "Upload PDFs", description: "Or drop files to compress", buttonLabel: "Select PDFs" };
        case 'merge-pdf':
            return { icon: <FileOutput className="w-full h-full text-brand-orange" />, title: "Upload PDFs", description: "Or drop files to merge", buttonLabel: "Select PDFs" };
        case 'split-pdf':
            return { icon: <Scissors className="w-full h-full text-brand-blue" />, title: "Upload PDF", description: "Or drop a file to split", buttonLabel: "Select PDF" };
        case 'zip-files':
            return { icon: <FolderArchive className="w-full h-full text-amber-500" />, title: "Upload Files", description: "Or drop files to archive", buttonLabel: "Select Files" };
        case 'word-to-pdf':
            return { icon: <FileText className="w-full h-full text-blue-500" />, title: "Upload Word File", description: "Or drop a .docx file", buttonLabel: "Select DOCX" };
        case 'pptx-to-pdf':
            return { icon: <Presentation className="w-full h-full text-orange-500" />, title: "Upload PowerPoint", description: "Or drop a .pptx file", buttonLabel: "Select PPTX" };
        case 'reorder-pdf':
            return { icon: <ArrowLeftRight className="w-full h-full text-indigo-500" />, title: "Upload PDF", description: "Or drop a file to reorder", buttonLabel: "Select PDF" };
        default:
             return { icon: <Layers className="w-full h-full text-brand-purple" />, title: "Upload Files", description: "Or drop files here", buttonLabel: "Select Files" };
    }
  };

  const { icon, description, buttonLabel } = getToolInfo();

  return (
    <motion.div
        {...getRootProps()}
        className="relative outline-none"
        onMouseEnter={() => !disabled && !isProcessing && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
                        <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4">
                            <motion.div 
                                className="relative w-full h-full overflow-hidden rounded-[32px]" // Rounded container for shimmer
                                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            >
                                {/* The icon itself */}
                                {icon}

                                {/* The shimmer effect element, controlled by hover/drag */}
                                <AnimatePresence>
                                    {(isHovered || isDragActive) && !shouldReduceMotion && (
                                        <motion.div
                                            className="absolute inset-0 pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <motion.div
                                                className="absolute w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent"
                                                style={{
                                                    top: 0,
                                                    transform: 'skewX(-25deg)',
                                                }}
                                                initial={{ x: '-150%' }}
                                                animate={{ x: '250%' }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: 'linear',
                                                    delay: 0.5,
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
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