
import React, { useRef } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FileProcessingLoader } from './FileProcessingLoader';
import { Plus, Command, ArrowUp } from 'lucide-react';
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
  accentColor = '#71717a'
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
          <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="shrink-0">
               <IconBox 
                  icon={icon} 
                  size="xl" 
                  toolAccentColor={accentColor} 
                  active 
               />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-nd-primary tracking-tighter mb-4">
                {title}
              </h1>
              <p className="text-nd-secondary text-lg max-w-md mx-auto sm:mx-0 leading-relaxed font-medium">
                {description}
              </p>
            </div>
          </div>

          {/* Upload Zone (Visual Table) */}
          <div className="w-full border border-nd-border rounded-[2rem] bg-nd-surface overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="h-12 border-b border-nd-border flex items-center px-6 bg-nd-subtle/50">
              <span className="text-[10px] font-bold text-nd-muted uppercase tracking-[0.2em] font-mono">System_Module</span>
              <span className="ml-auto text-[10px] font-bold text-nd-muted uppercase tracking-[0.2em] font-mono">Status: Ready</span>
            </div>

            <div 
              className="h-48 flex flex-col items-center justify-center bg-nd-base/30 hover:bg-white transition-colors cursor-pointer group" 
              onClick={handleButtonClick}
            >
               <div className="flex items-center gap-4 text-nd-secondary group-hover:text-nd-primary transition-all duration-200">
                  <div className="p-3 rounded-2xl bg-white border border-nd-border shadow-sm group-hover:border-nd-primary group-hover:shadow-lg transition-all">
                    <Plus size={24} />
                  </div>
                  <span className="text-lg font-bold tracking-tight">Mount local files...</span>
               </div>
               <div className="mt-4 flex items-center gap-2 text-xs font-mono font-bold text-nd-muted uppercase tracking-widest opacity-60">
                  {!isMobile && (
                    <span className="flex items-center gap-1 bg-nd-subtle border border-nd-border px-2 py-1 rounded-md">
                      <Command size={10} /> O
                    </span>
                  )}
                  <span>or drop to stream</span>
               </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
             {specs.map((spec, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-5 rounded-[1.5rem] bg-nd-surface border border-nd-border hover:bg-nd-subtle/50 transition-colors">
                   <div className="shrink-0 opacity-80">
                      {React.cloneElement(spec.icon as React.ReactElement, { size: 18, strokeWidth: 2, style: { color: accentColor } })}
                   </div>
                   <div className="min-w-0">
                      <div className="text-[9px] font-bold text-nd-muted uppercase tracking-widest mb-1 font-mono">{spec.label}</div>
                      <div className="text-xs font-bold text-nd-primary truncate uppercase tracking-tight">{spec.value}</div>
                   </div>
                </div>
             ))}
          </div>

          {tip && (
             <div className="mt-8 p-5 rounded-2xl bg-nd-subtle/30 border border-nd-border text-[11px] text-nd-secondary leading-relaxed flex items-start gap-4">
                <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="font-medium">{tip}</span>
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
             className="absolute inset-0 z-[120] bg-nd-base/90 backdrop-blur-xl flex flex-col items-center justify-center"
           >
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border-2 border-dashed animate-pulse"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                 <ArrowUp size={40} />
              </div>
              <h3 className="text-2xl font-bold tracking-tighter text-nd-primary uppercase">Release to Mount</h3>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && <FileProcessingLoader />}
      </AnimatePresence>
    </div>
  );
};
