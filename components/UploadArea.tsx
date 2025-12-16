
import React from 'react';
import { useDropzone, FileRejection, DropEvent } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, FileStack, Image as ImageIcon, Minimize2, GitMerge, GitFork, 
  Package, FileText, FileType2, Presentation, ListOrdered, RotateCw, 
  FileMinus, UnlockKeyhole, Hash, EyeOff, ScanLine, Terminal, Crop, Wrench,
  Command
} from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap, standardLayoutTransition } from '../utils/animations';
import { IconBox } from './IconBox';
import { allTools } from '../utils/tool-list';

// --- Limits Configuration ---
const getToolLimits = (mode: AppMode | string) => {
    const MB = 1024 * 1024;
    switch (mode) {
        case 'image-to-pdf': return { maxSize: 25 * MB, maxFiles: 50 };
        case 'pdf-to-image': return { maxSize: 250 * MB, maxFiles: 1 };
        case 'compress-pdf': return { maxSize: 100 * MB, maxFiles: 10 };
        case 'merge-pdf': return { maxSize: 100 * MB, maxFiles: 20 };
        default: return { maxSize: 100 * MB, maxFiles: 50 };
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

  // Find tool definition for metadata
  const currentTool = allTools.find(t => t.id === mode) || { 
      title: 'Upload Files', 
      desc: 'Drag & drop files here', 
      icon: <FileStack />, 
      accentColor: '#71717a' 
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: limits.maxSize,
    maxFiles: limits.maxFiles === 1 ? undefined : limits.maxFiles, 
    disabled: disabled || isProcessing,
    multiple: limits.maxFiles !== 1
  });

  const { onAnimationStart, onDragStart, onDragEnd, ...rootProps } = getRootProps();

  return (
    <motion.div
        {...rootProps}
        className="relative outline-none w-full h-full"
        whileHover={!disabled && !isProcessing ? { scale: 1.002 } : {}}
        transition={standardLayoutTransition}
    >
        <input {...getInputProps()} />
        
        <div
            className={`
                relative w-full h-full min-h-[400px]
                rounded-2xl overflow-hidden
                border border-dashed transition-all duration-300
                flex flex-col items-center justify-center text-center
                p-8
                ${isDragActive 
                    ? 'border-zinc-400 bg-zinc-50 dark:bg-zinc-800/50' 
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                }
                ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600'}
            `}
            style={{ 
                borderColor: isDragActive ? currentTool.accentColor : undefined 
            }}
        >
            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-20">
                        <FileProcessingLoader />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="content" 
                        initial={{opacity:0, y: 5}} 
                        animate={{opacity:1, y: 0}} 
                        exit={{opacity:0, y: -5}} 
                        className="flex flex-col items-center justify-center w-full max-w-lg z-10 space-y-6"
                    >
                        {/* Primary Icon Container */}
                        <motion.div 
                            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <IconBox 
                                icon={currentTool.icon} 
                                size="xl" 
                                active={isDragActive || !isMobile} // Always active style on desktop for visual weight
                                toolAccentColor={currentTool.accentColor}
                            />
                        </motion.div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                {isDragActive ? "Drop to upload" : currentTool.title}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                                {currentTool.desc}
                            </p>
                        </div>

                        {/* Button Visual */}
                        <motion.div
                            whileTap={!disabled && !isProcessing ? buttonTap : {}}
                            className="
                                px-5 py-2.5 
                                bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                                text-sm font-medium rounded-lg shadow-sm
                                flex items-center gap-2 
                                hover:bg-zinc-800 dark:hover:bg-zinc-200
                                transition-all
                            "
                        >
                            <Plus size={16} />
                            <span>Select Files</span>
                        </motion.div>
                        
                        {!isMobile && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800">
                                <Command size={10} /> O
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};
