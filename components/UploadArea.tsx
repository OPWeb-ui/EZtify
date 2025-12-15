
import React from 'react';
import { useDropzone, FileRejection, DropEvent } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileStack, 
  Image as ImageIcon, 
  Minimize2, 
  GitMerge, 
  GitFork, 
  Package, 
  FileText, 
  FileType2, 
  Presentation, 
  ListOrdered, 
  RotateCw, 
  FileMinus, 
  UnlockKeyhole, 
  Hash, 
  EyeOff, 
  ScanLine, 
  Terminal, 
  Crop,
  Wrench
} from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap, standardLayoutTransition } from '../utils/animations';

// --- Limits Configuration ---
const getToolLimits = (mode: AppMode | string) => {
    const MB = 1024 * 1024;
    switch (mode) {
        case 'image-to-pdf': return { maxSize: 25 * MB, maxFiles: 50 };
        case 'pdf-to-image': return { maxSize: 250 * MB, maxFiles: 1 };
        case 'compress-pdf': return { maxSize: 100 * MB, maxFiles: 10 };
        case 'merge-pdf': return { maxSize: 100 * MB, maxFiles: 20 };
        case 'grayscale-pdf': return { maxSize: 100 * MB, maxFiles: 10 };
        case 'zip-files': return { maxSize: 100 * MB, maxFiles: 50 };
        case 'word-to-pdf': case 'pdf-to-word': case 'pdf-to-pptx': case 'pptx-to-pdf': return { maxSize: 50 * MB, maxFiles: 1 };
        case 'split-pdf': case 'reorder-pdf': case 'rotate-pdf': case 'delete-pdf-pages': case 'unlock-pdf': case 'add-page-numbers': case 'redact-pdf': case 'crop-pdf': return { maxSize: 100 * MB, maxFiles: 1 };
        case 'code-editor': return { maxSize: 5 * MB, maxFiles: 20 };
        default: return { maxSize: undefined, maxFiles: 0 };
    }
};

interface UploadAreaProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event?: DropEvent) => void;
  mode: AppMode | 'pptx-to-pdf';
  disabled?: boolean;
  isProcessing?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled, isProcessing }) => {
  const { isMobile } = useLayoutContext();

  const limits = getToolLimits(mode);

  const getAcceptForMode = (mode: AppMode | string) => {
    switch (mode) {
        case 'image-to-pdf': return { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] };
        case 'word-to-pdf': return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] };
        case 'zip-files': return undefined;
        case 'pptx-to-pdf': return { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] };
        case 'code-editor': return { 'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.sql', '.yaml', '.yml', '.ini', '.cfg', '.env', '.gitignore'] };
        default: return { 'application/pdf': ['.pdf'] };
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
    const iconProps = { size: 64, strokeWidth: 1.5 };
    
    switch (mode) {
        case 'image-to-pdf': return { icon: <FileStack {...iconProps} />, title: "Upload Images", description: "Or drop images here", buttonLabel: "Select Images" };
        case 'pdf-to-image': return { icon: <ImageIcon {...iconProps} />, title: "Upload PDF", description: "Or drop a PDF here", buttonLabel: "Select PDF" };
        case 'compress-pdf': return { icon: <Minimize2 {...iconProps} />, title: "Upload PDFs", description: "Or drop files to compress", buttonLabel: "Select PDFs" };
        case 'merge-pdf': return { icon: <GitMerge {...iconProps} />, title: "Upload PDFs", description: "Or drop files to merge", buttonLabel: "Select PDFs" };
        case 'split-pdf': return { icon: <GitFork {...iconProps} />, title: "Upload PDF", description: "Or drop a file to split", buttonLabel: "Select PDF" };
        case 'zip-files': return { icon: <Package {...iconProps} />, title: "Upload Files", description: "Or drop files to archive", buttonLabel: "Select Files" };
        case 'word-to-pdf': return { icon: <FileText {...iconProps} />, title: "Upload Word File", description: "Or drop a .docx file", buttonLabel: "Select DOCX" };
        case 'pdf-to-word': return { icon: <FileType2 {...iconProps} />, title: "Upload PDF", description: "Or drop a PDF to convert", buttonLabel: "Select PDF" };
        case 'pdf-to-pptx': return { icon: <Presentation {...iconProps} />, title: "Upload PDF", description: "Or drop a PDF to convert", buttonLabel: "Select PDF" };
        case 'pptx-to-pdf': return { icon: <Presentation {...iconProps} />, title: "Upload PowerPoint", description: "Or drop a .pptx file", buttonLabel: "Select PPTX" };
        case 'reorder-pdf': return { icon: <ListOrdered {...iconProps} />, title: "Upload PDF", description: "Or drop a file to reorder", buttonLabel: "Select PDF" };
        case 'rotate-pdf': return { icon: <RotateCw {...iconProps} />, title: "Upload PDF", description: "Or drop a file to rotate", buttonLabel: "Select PDF" };
        case 'delete-pdf-pages': return { icon: <FileMinus {...iconProps} />, title: "Upload PDF", description: "Or drop a file to delete pages", buttonLabel: "Select PDF" };
        case 'unlock-pdf': return { icon: <UnlockKeyhole {...iconProps} />, title: "Upload PDF", description: "Or drop a PDF to unlock", buttonLabel: "Select PDF" };
        case 'add-page-numbers': return { icon: <Hash {...iconProps} />, title: "Upload PDF", description: "Or drop a file to add numbers", buttonLabel: "Select PDF" };
        case 'redact-pdf': return { icon: <EyeOff {...iconProps} />, title: "Upload PDF", description: "Or drop a file to redact", buttonLabel: "Select PDF" };
        case 'grayscale-pdf': return { icon: <ScanLine {...iconProps} />, title: "Upload PDFs", description: "Or drop files to convert", buttonLabel: "Select PDFs" };
        case 'crop-pdf': return { icon: <Crop {...iconProps} />, title: "Upload PDF", description: "Or drop a file to crop", buttonLabel: "Select PDF" };
        case 'code-editor': return { icon: <Terminal {...iconProps} />, title: "Open Files", description: "Drop text or code files to edit", buttonLabel: "Select Files" };
        case 'pdf-multi-tool': return { icon: <Wrench {...iconProps} />, title: "Upload PDFs", description: "Drop files to merge, split or edit", buttonLabel: "Select PDFs" };
        default: return { icon: <FileStack {...iconProps} />, title: "Upload Files", description: "Or drop files here", buttonLabel: "Select Files" };
    }
  };

  const { icon, description, buttonLabel } = getToolInfo();

  return (
    <motion.div
        {...getRootProps()}
        className="relative outline-none w-full h-full"
        whileHover={!disabled && !isProcessing ? { scale: 1.005 } : {}}
        transition={standardLayoutTransition}
    >
        <input {...getInputProps()} />
        <div
            className={`
                relative w-full 
                min-h-[320px] sm:min-h-[380px] md:min-h-[420px]
                rounded-2xl overflow-hidden
                border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center text-center
                p-6 sm:p-8 md:p-10
                ${isDragActive ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' : 'border-slate-300 dark:border-charcoal-700 bg-white/50 dark:bg-charcoal-900/50'}
                ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-brand-purple/70 hover:bg-slate-50 dark:hover:bg-charcoal-800'}
            `}
        >
            {/* Tech Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                 style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />

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
                            className="mb-6 sm:mb-8 text-brand-purple/80" 
                            animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {icon}
                        </motion.div>
                        
                        <motion.div
                            whileTap={!disabled && !isProcessing ? buttonTap : {}}
                            whileHover={!disabled && !isProcessing ? { scale: 1.02 } : {}}
                            className="
                                px-6 py-3 sm:px-8 sm:py-4 
                                bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                                text-sm sm:text-base font-bold font-mono uppercase tracking-wide
                                rounded-xl shadow-lg shadow-brand-purple/20 
                                flex items-center gap-2.5 
                                hover:bg-brand-purple dark:hover:bg-slate-200
                                transition-all
                            "
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>{buttonLabel}</span>
                        </motion.div>
                        
                        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-4 sm:mt-6 font-mono font-medium max-w-xs sm:max-w-sm leading-relaxed">
                            {description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};
