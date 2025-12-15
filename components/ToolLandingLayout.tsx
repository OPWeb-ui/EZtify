
import React, { useRef } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FileProcessingLoader } from './FileProcessingLoader';
import { FilePlus, UploadCloud, HelpCircle } from 'lucide-react';
import { staggerContainer, fadeInUp } from '../utils/animations';
import { Link, useLocation } from 'react-router-dom';

interface ToolLandingLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  specs: { label: string; value: string; icon: React.ReactNode }[];
  onDrop: (files: File[], fileRejections: FileRejection[]) => void;
  accept?: DropzoneOptions['accept'];
  multiple?: boolean;
  isProcessing?: boolean;
  tip?: string;
  accentColor?: string;
}

const convertAcceptObjectToString = (accept?: DropzoneOptions['accept']) => {
  if (!accept) return undefined;
  return Object.entries(accept)
    .flatMap(([mimeType, extensions]) => [mimeType, ...(Array.isArray(extensions) ? extensions : [])])
    .join(',');
};

// Simple mapping helper to find FAQ ID based on route
const getFaqId = (pathname: string) => {
  if (pathname.includes('pdf')) return 'pdf-tools';
  if (pathname.includes('image')) return 'image-to-pdf';
  if (pathname.includes('word') || pathname.includes('pptx')) return 'conversion';
  return 'general';
};

export const ToolLandingLayout: React.FC<ToolLandingLayoutProps> = ({
  title,
  description,
  icon,
  specs,
  onDrop,
  accept,
  multiple = false,
  isProcessing = false,
  tip,
  accentColor = "text-brand-purple"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const faqId = getFaqId(location.pathname);

  const { getRootProps, isDragActive, getInputProps } = useDropzone({
    onDrop: (acceptedFiles, fileRejections) => onDrop(acceptedFiles, fileRejections),
    multiple,
    accept,
    disabled: isProcessing,
    noClick: true,
    noKeyboard: true
  });

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files && e.target.files.length > 0) {
      onDrop(Array.from(e.target.files), []);
    }
    if (e.target) e.target.value = "";
  };

  return (
    <div 
      {...getRootProps()} 
      className={`
        w-full h-full flex flex-col items-center justify-center relative outline-none 
        transition-colors duration-300 overflow-hidden
        ${isDragActive ? 'bg-brand-purple/5' : 'bg-slate-50 dark:bg-charcoal-950'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={convertAcceptObjectToString(accept)}
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {/* Processing State */}
      <AnimatePresence>
        {isProcessing && <FileProcessingLoader />}
      </AnimatePresence>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-charcoal-950/95 backdrop-blur-md"
          >
            <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-[90%] max-w-lg aspect-square md:aspect-video border-4 border-dashed border-brand-purple rounded-[32px] flex flex-col items-center justify-center"
            >
                <div className="w-20 h-20 bg-brand-purple/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <UploadCloud size={40} className="text-brand-purple" />
                </div>
                <h3 className="text-2xl font-bold font-mono text-brand-purple uppercase tracking-widest">Release Files</h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Entry Card */}
      <div className="w-full max-w-5xl px-4 md:px-6 relative z-10 flex flex-col h-full md:h-auto justify-center">
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="
                flex flex-col md:flex-row 
                bg-white dark:bg-charcoal-900 
                rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 
                overflow-hidden border border-slate-200 dark:border-charcoal-700
                md:min-h-[480px]
            "
        >
            
            {/* LEFT PANEL: Context (Desktop) / Header (Mobile) */}
            <div className="
                md:w-5/12 p-6 md:p-10 
                flex flex-col 
                border-b md:border-b-0 md:border-r border-slate-100 dark:border-charcoal-800 
                bg-gradient-to-b from-white to-slate-50 dark:from-charcoal-900 dark:to-charcoal-950
                relative
            ">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-20" />

                <motion.div variants={fadeInUp} className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className={`
                        w-16 h-16 md:w-14 md:h-14 
                        rounded-2xl flex items-center justify-center 
                        bg-slate-100 dark:bg-charcoal-800 
                        text-charcoal-900 dark:text-white 
                        shadow-sm mb-4 md:mb-6
                        ${accentColor}
                    `}>
                        {React.cloneElement(icon as React.ReactElement, { size: 32, strokeWidth: 1.5 })}
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold font-heading text-charcoal-900 dark:text-white mb-2 md:mb-4 tracking-tight">
                        {title}
                    </h1>
                    
                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 font-medium leading-relaxed max-w-xs md:max-w-none mb-6">
                        {description}
                    </p>
                </motion.div>

                <div className="mt-auto flex flex-col gap-4">
                    <div className="hidden md:grid grid-cols-1 gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-600 mb-2 font-mono">System Parameters</div>
                        {specs.map((spec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="text-charcoal-400 dark:text-charcoal-500 scale-75">{spec.icon}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400 font-mono">{spec.label}</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-charcoal-800 dark:text-slate-300">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* FAQ Link */}
                    <Link to={`/faq#${faqId}`} className="inline-flex items-center gap-2 text-xs font-bold text-charcoal-400 hover:text-brand-purple transition-colors mt-2 md:mt-0">
                       <HelpCircle size={14} /> Tool FAQ & Help
                    </Link>
                </div>
            </div>

            {/* RIGHT PANEL: Interaction Zone */}
            <div 
                onClick={handleButtonClick}
                className="
                    flex-1 p-6 md:p-10 
                    bg-slate-50/50 dark:bg-charcoal-850/50 
                    flex flex-col items-center justify-center text-center 
                    relative group cursor-pointer
                    transition-colors hover:bg-slate-100/50 dark:hover:bg-charcoal-800/50
                "
            >
                {/* Interactive Border */}
                <div className="absolute inset-4 md:inset-6 border-2 border-dashed border-slate-300 dark:border-charcoal-600 rounded-2xl pointer-events-none transition-all duration-300 group-hover:border-brand-purple/50 group-hover:bg-brand-purple/5 group-hover:scale-[0.99]" />
                
                <motion.div variants={fadeInUp} className="relative z-10 flex flex-col items-center w-full max-w-sm">
                    {/* Icon Circle */}
                    <div className="
                        w-20 h-20 md:w-24 md:h-24 
                        bg-white dark:bg-charcoal-800 
                        rounded-full shadow-xl shadow-slate-200/50 dark:shadow-black/30
                        flex items-center justify-center mb-6 
                        group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                        border border-slate-100 dark:border-charcoal-700
                    ">
                        <FilePlus size={36} className="text-charcoal-400 dark:text-charcoal-500 group-hover:text-brand-purple transition-colors" strokeWidth={1.5} />
                    </div>
                    
                    <h2 className="text-lg md:text-xl font-bold text-charcoal-900 dark:text-white mb-2 font-mono uppercase tracking-wide">
                        {multiple ? 'Select Files' : 'Select File'}
                    </h2>
                    
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-mono mb-8 opacity-80">
                        Drag & drop or click to browse
                    </p>

                    <button 
                        type="button"
                        className="
                            w-full md:w-auto px-8 py-3.5
                            bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                            font-bold font-mono text-xs uppercase tracking-widest 
                            rounded-xl shadow-lg hover:shadow-xl hover:shadow-brand-purple/20 
                            transition-all duration-200 transform hover:-translate-y-0.5
                            border border-transparent hover:bg-brand-purple dark:hover:bg-slate-200
                        "
                    >
                        Open File Manager
                    </button>
                </motion.div>

                {/* Mobile Specs Row (Minimal) */}
                <div className="md:hidden mt-8 w-full grid grid-cols-2 gap-2 opacity-70">
                    {specs.slice(0, 2).map((spec, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-2 p-1.5 rounded-md bg-slate-200/50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
                            <span className="text-[9px] font-mono font-bold text-charcoal-600 dark:text-charcoal-300 uppercase">{spec.value}</span>
                        </div>
                    ))}
                </div>

                {tip && (
                    <motion.div variants={fadeInUp} className="absolute bottom-6 md:bottom-8 px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:block">
                        <p className="text-[10px] text-charcoal-400 dark:text-charcoal-500 font-mono">
                            <span className="font-bold text-brand-purple">PRO_TIP:</span> {tip}
                        </p>
                    </motion.div>
                )}
            </div>

        </motion.div>
      </div>
    </div>
  );
};
