
import React, { useRef } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FileProcessingLoader } from './FileProcessingLoader';
import { Plus, Command, ArrowUp, File as FileIcon } from 'lucide-react';
import { useLayoutContext } from './Layout';
import { IconBox } from './IconBox';

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
  accentColor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useLayoutContext();

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, fileRejections) => onDrop(acceptedFiles, fileRejections),
    multiple,
    accept,
    disabled: isProcessing,
    noClick: true,
    noKeyboard: true
  });

  const handleButtonClick = (e: React.MouseEvent) => {
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
      className="flex flex-col w-full h-full bg-nd-base font-sans overflow-hidden outline-none relative"
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        <div className="w-full max-w-2xl">
          {/* Header Area */}
          <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="shrink-0">
               <IconBox 
                  icon={icon} 
                  size="xl" 
                  toolAccentColor={accentColor} 
                  active 
               />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-nd-primary tracking-tight mb-3">
                {title}
              </h1>
              <p className="text-nd-secondary text-base max-w-md mx-auto sm:mx-0 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Upload Zone (Visual Table) */}
          <div className="w-full border border-nd-border rounded-xl bg-nd-surface overflow-hidden shadow-sm">
            <div className="h-10 border-b border-nd-border flex items-center px-4 bg-slate-50 dark:bg-charcoal-900">
              <span className="text-[10px] font-bold text-nd-muted uppercase tracking-wider font-mono">File System</span>
              <span className="ml-auto text-[10px] font-bold text-nd-muted uppercase tracking-wider font-mono">Size</span>
            </div>

            <div 
              className="h-40 flex flex-col items-center justify-center bg-nd-base hover:bg-slate-50 dark:hover:bg-charcoal-800/50 transition-colors cursor-pointer group" 
              onClick={handleButtonClick}
            >
               <div className="flex items-center gap-3 text-nd-secondary group-hover:text-nd-primary transition-colors">
                  <div className="p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-sm group-hover:border-slate-300 dark:group-hover:border-charcoal-600 transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-sm font-medium">Add source files...</span>
               </div>
               <div className="mt-3 flex items-center gap-2 text-xs text-nd-muted">
                  {!isMobile && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 px-2 py-1 rounded-md font-mono text-[10px]">
                      <Command size={10} /> O
                    </span>
                  )}
                  <span>or drag and drop</span>
               </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
             {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-100 dark:border-charcoal-800">
                   <div className="shrink-0">
                      <IconBox icon={spec.icon} size="xs" variant="ghost" />
                   </div>
                   <div className="min-w-0">
                      <div className="text-[10px] font-bold text-nd-muted uppercase tracking-wider mb-0.5">{spec.label}</div>
                      <div className="text-xs font-medium text-nd-primary truncate">{spec.value}</div>
                   </div>
                </div>
             ))}
          </div>

          {tip && (
             <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-charcoal-900/50 border border-slate-200 dark:border-charcoal-800 text-xs text-nd-secondary leading-relaxed flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-brand-purple" />
                {tip}
             </div>
          )}

        </div>
      </div>

      <AnimatePresence>
        {isDragActive && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             className="absolute inset-0 z-50 bg-charcoal-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white"
           >
              <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20">
                 <ArrowUp size={40} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Release to Import</h3>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && <FileProcessingLoader />}
      </AnimatePresence>
    </div>
  );
};
