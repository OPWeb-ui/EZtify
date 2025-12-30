
import React from 'react';
import { useDropzone, FileRejection, DropEvent } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, FileStack, ScanLine
} from 'lucide-react';
import { AppMode } from '../types';
import { FileProcessingLoader } from './FileProcessingLoader';
import { useLayoutContext } from './Layout';
import { buttonTap, standardLayoutTransition } from '../utils/animations';
import { IconBox } from './IconBox';
import { allTools } from '../utils/tool-list';

// Simplified limits logic
const getToolLimits = (mode: AppMode | string) => {
    const MB = 1024 * 1024;
    // Default limit for Workspace and general usage
    return { maxSize: 100 * MB, maxFiles: 50 };
};

interface UploadAreaProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event?: DropEvent) => void;
  mode: AppMode;
  disabled?: boolean;
  isProcessing?: boolean;
  accept?: Record<string, string[]>;
  multiple?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ 
    onDrop, 
    mode, 
    disabled, 
    isProcessing,
    accept,
    multiple 
}) => {
  const { isMobile } = useLayoutContext();
  const limits = getToolLimits(mode);

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
    multiple: multiple !== undefined ? multiple : limits.maxFiles !== 1,
    accept: accept
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
                rounded-[2.5rem] overflow-hidden
                border border-dashed transition-all duration-300
                flex flex-col items-center justify-center text-center
                p-12
                ${isDragActive 
                    ? 'border-nd-primary bg-nd-subtle/50' 
                    : 'border-nd-border bg-nd-surface'
                }
                ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-nd-muted hover:shadow-lg'}
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
                        className="flex flex-col items-center justify-center w-full max-w-md z-10 space-y-8"
                    >
                        <motion.div 
                            animate={isDragActive ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <IconBox 
                                icon={currentTool.icon} 
                                size="xl" 
                                active={isDragActive || !isMobile}
                                toolAccentColor={currentTool.accentColor}
                            />
                        </motion.div>
                        
                        <div className="space-y-3">
                            <h3 className="text-3xl font-bold text-nd-primary tracking-tighter">
                                {isDragActive ? "Drop files now" : currentTool.title}
                            </h3>
                            <p className="text-nd-secondary font-medium leading-relaxed opacity-80">
                                {currentTool.desc}
                            </p>
                        </div>

                        <motion.div
                            whileTap={!disabled && !isProcessing ? buttonTap : {}}
                            className="
                                px-8 py-3.5 
                                bg-nd-primary text-nd-base
                                text-sm font-bold rounded-2xl shadow-xl
                                flex items-center gap-3 
                                hover:scale-105 active:scale-95
                                transition-all
                            "
                        >
                            <Plus size={20} />
                            <span>Select Files</span>
                        </motion.div>
                        
                        {!isMobile && (
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-nd-muted uppercase tracking-[0.2em] bg-nd-subtle border border-nd-border px-3 py-1.5 rounded-full">
                                <ScanLine size={12} className="animate-pulse" />
                                <span>or drag to mount</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};
