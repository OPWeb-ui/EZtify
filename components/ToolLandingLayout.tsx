
import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FileProcessingLoader } from './FileProcessingLoader';
import { FilePlus, Command, Info, Sparkles } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface SpecItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const SpecItem: React.FC<SpecItemProps> = ({ label, value, icon }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700">
    <div className="text-charcoal-400 dark:text-slate-500 shrink-0">
      {React.cloneElement(icon as React.ReactElement, { size: 16 })}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 dark:text-slate-500 font-mono leading-none mb-1">{label}</div>
      <div className="text-xs font-bold text-charcoal-700 dark:text-slate-200 font-mono leading-none truncate">{value}</div>
    </div>
  </div>
);

interface ToolLandingLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  specs: { label: string; value: string; icon: React.ReactNode }[];
  onDrop: (files: File[]) => void;
  accept?: DropzoneOptions['accept'];
  multiple?: boolean;
  isProcessing?: boolean;
  tip?: string;
  accentColor?: string;
}

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
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple,
    accept,
    disabled: isProcessing,
    noClick: true
  });

  return (
    // Outer Wrapper: Absolute inset ensures full coverage of the parent (Layout main).
    // Flex column + m-auto on child provides safe centering without top-clipping on small screens.
    <div className="absolute inset-0 z-10 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-charcoal-950 transition-colors duration-300 flex flex-col">
      
      {/* 
         Centering Wrapper: 
         - flex-grow ensures it takes at least the full height.
         - p-4 provides safety padding on mobile edges.
      */}
      <div className="flex-grow w-full flex flex-col p-4 md:p-6 min-h-full">
        
        {/* Studio Card Container 
            - m-auto is the CSS magic that centers flex items vertically & horizontally 
              BUT reverts to top-alignment if content overflows (preventing clipping).
        */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-5xl bg-white dark:bg-charcoal-900 rounded-3xl md:rounded-[32px] shadow-2xl border border-slate-200 dark:border-charcoal-700 overflow-hidden flex flex-col md:flex-row relative ring-1 ring-black/5 m-auto"
        >
          
          {/* Loading Overlay */}
          <AnimatePresence>
            {isProcessing && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 z-50 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md flex items-center justify-center"
               >
                 <FileProcessingLoader />
               </motion.div>
            )}
          </AnimatePresence>

          {/* LEFT: Main Drop Zone */}
          <div 
             {...getRootProps()}
             onClick={open}
             className={`
                flex-1 relative flex flex-col items-center justify-center p-8 md:p-16 text-center
                cursor-pointer transition-all duration-300 group min-h-[300px] md:min-h-[400px]
                ${isDragActive 
                  ? 'bg-brand-purple/5 dark:bg-brand-purple/10' 
                  : 'bg-white dark:bg-charcoal-900 hover:bg-slate-50/50 dark:hover:bg-charcoal-850/50'
                }
             `}
          >
             <input {...getInputProps()} />
             
             {/* Tech Background Pattern */}
             <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                  style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
             />

             {/* Drag Active Border */}
             {isDragActive && (
                <div className="absolute inset-6 border-2 border-dashed border-brand-purple rounded-2xl md:rounded-3xl pointer-events-none z-10 flex items-center justify-center">
                   <div className="bg-white dark:bg-charcoal-900 px-6 py-3 rounded-full shadow-xl border border-brand-purple/20 text-brand-purple font-bold font-mono text-sm animate-pulse flex items-center gap-2">
                      <FilePlus size={18} /> RELEASE_FILES
                   </div>
                </div>
             )}

             <div className="relative z-0 max-w-lg mx-auto w-full">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`
                    w-20 h-20 md:w-32 md:h-32 mx-auto mb-6 md:mb-8 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl 
                    ${accentColor} bg-slate-50 dark:bg-charcoal-800 border border-slate-100 dark:border-charcoal-700
                  `}
                >
                   {React.cloneElement(icon as React.ReactElement, { size: 40, strokeWidth: 1.5, className: "md:w-16 md:h-16" })}
                </motion.div>

                <h1 className="text-2xl md:text-4xl font-heading font-bold text-charcoal-900 dark:text-white mb-3 md:mb-4 tracking-tight">
                  {title}
                </h1>
                
                <p className="text-sm md:text-base text-charcoal-500 dark:text-charcoal-400 mb-8 md:mb-10 leading-relaxed font-medium max-w-md mx-auto">
                  {description}
                </p>

                <motion.button 
                  type="button"
                  whileTap={buttonTap}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="
                    w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5
                    bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 
                    font-bold font-mono text-sm uppercase tracking-widest 
                    rounded-xl md:rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-brand-purple/20 transition-all 
                    border border-transparent hover:bg-brand-purple dark:hover:bg-slate-200
                  "
                >
                   <FilePlus size={18} />
                   <span>Select Files</span>
                </motion.button>
                
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-[10px] font-mono text-charcoal-400 dark:text-charcoal-600 uppercase tracking-widest opacity-60">
                   <Command size={12} /> <span>Drag & Drop Supported</span>
                </div>
             </div>
          </div>

          {/* RIGHT (or BOTTOM): Info Panel */}
          <div className="w-full md:w-80 bg-slate-50/80 dark:bg-black/20 border-t md:border-t-0 md:border-l border-slate-200 dark:border-charcoal-700 p-6 md:p-8 flex flex-col justify-center shrink-0 backdrop-blur-sm">
             
             <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                  <Info size={14} /> Module_Specs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                   {specs.map((spec, idx) => (
                      <SpecItem key={idx} {...spec} />
                   ))}
                </div>
             </div>

             {tip && (
               <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider font-mono">
                     <Sparkles size={12} />
                     <span>Pro_Tip</span>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                     {tip}
                  </p>
               </div>
             )}
             
             {/* Decorative Footer */}
             <div className="mt-auto pt-8 hidden md:block opacity-30">
                <div className="h-1 w-12 bg-charcoal-300 dark:bg-charcoal-700 rounded-full mb-2" />
                <div className="h-1 w-8 bg-charcoal-300 dark:bg-charcoal-700 rounded-full" />
             </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};
