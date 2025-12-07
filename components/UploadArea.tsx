import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { AppMode } from '../types';

interface UploadAreaProps {
  onDrop: DropzoneOptions['onDrop'];
  mode: AppMode;
  disabled?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onDrop, mode, disabled }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mode === 'image-to-pdf' 
      ? { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp'] }
      : { 'application/pdf': ['.pdf'] },
    disabled,
    multiple: mode === 'image-to-pdf' || mode === 'merge-pdf',
    maxSize: mode === 'image-to-pdf' ? 25 * 1024 * 1024 : undefined // 25MB limit for images
  });

  const getThemeColor = () => {
    switch(mode) {
      case 'image-to-pdf': return 'text-brand-blue';
      case 'pdf-to-image': return 'text-brand-mint';
      case 'compress-pdf': return 'text-brand-violet';
      case 'merge-pdf': return 'text-brand-orange';
      case 'split-pdf': return 'text-brand-mint';
      default: return 'text-brand-purple';
    }
  };
  
  const getGradientClass = () => {
     switch(mode) {
      case 'image-to-pdf': return 'from-brand-purple via-brand-blue to-brand-blue';
      case 'pdf-to-image': return 'from-brand-purple via-brand-mint to-brand-mint';
      case 'compress-pdf': return 'from-brand-purple via-brand-violet to-brand-violet';
      case 'merge-pdf': return 'from-brand-purple via-brand-orange to-brand-orange';
      case 'split-pdf': return 'from-brand-purple via-brand-mint to-brand-blue';
      default: return 'from-brand-purple via-brand-blue to-brand-mint';
    }
  };

  const getIcon = () => {
    // Shared SVG props
    const svgProps = {
      className: `w-16 h-16 md:w-20 md:h-20 ${getThemeColor()} drop-shadow-sm`,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const
    };

    if (mode === 'image-to-pdf') {
      // STACK ANIMATION REFINED
      return (
        <motion.svg {...svgProps}>
           {/* Bottom Card (Base) */}
           <motion.rect
             x="5" y="14" width="14" height="6" rx="1"
             className="text-brand-blue opacity-50"
             initial={{ scale: 0.95 }}
             animate={{ scale: [0.95, 1.05, 0.95] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
           />
           {/* Middle Card (Falling in) */}
           <motion.path
             d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8z"
             className="text-brand-purple opacity-80"
             initial={{ y: -10, opacity: 0 }}
             animate={{ y: [-10, 2, 2, -10], opacity: [0, 1, 1, 0] }}
             transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
           />
           {/* Top Card (Main Image) */}
           <motion.rect
             x="4" y="2" width="16" height="12" rx="2"
             className="text-brand-blue"
             fill="currentColor" fillOpacity="0.1"
             initial={{ y: -15, opacity: 0 }}
             animate={{ y: [-15, 0, 0, -15], opacity: [0, 1, 1, 0] }}
             transition={{ duration: 3, repeat: Infinity, times: [0.2, 0.4, 0.8, 1], ease: "backOut" }}
           />
           {/* Image Icon Detail */}
           <motion.path
             d="M8.5 7l2.5 3 2.5-3 3.5 4H7l1.5-4z"
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 1, 1, 0] }}
             transition={{ duration: 3, repeat: Infinity, times: [0.2, 0.4, 0.8, 1] }}
           />
        </motion.svg>
      );
    }

    if (mode === 'pdf-to-image') {
      // SPLIT/UNFOLD ANIMATION REFINED
      return (
        <motion.svg {...svgProps}>
          {/* Main Doc (Center) */}
          <rect x="8" y="3" width="8" height="18" rx="1" className="text-charcoal-400 dark:text-slate-500" strokeWidth="2" />
          
          {/* Left Page Slide & Rotate */}
          <motion.rect 
             x="8" y="3" width="8" height="18" rx="1"
             className="text-brand-mint"
             fill="currentColor" fillOpacity="0.1"
             initial={{ x: 0, rotate: 0, opacity: 0.5 }}
             animate={{ x: -7, rotate: -15, opacity: 1 }}
             transition={{ 
               duration: 2.5, 
               repeat: Infinity, 
               repeatType: "reverse", 
               ease: "easeInOut" 
             }}
          />
           {/* Right Page Slide & Rotate */}
           <motion.rect 
             x="8" y="3" width="8" height="18" rx="1"
             className="text-brand-mint"
             fill="currentColor" fillOpacity="0.1"
             initial={{ x: 0, rotate: 0, opacity: 0.5 }}
             animate={{ x: 7, rotate: 15, opacity: 1 }}
             transition={{ 
               duration: 2.5, 
               repeat: Infinity, 
               repeatType: "reverse", 
               ease: "easeInOut" 
             }}
          />
          {/* Doc Lines */}
          <path d="M10 7h4" className="text-charcoal-300" />
          <path d="M10 11h4" className="text-charcoal-300" />
          <path d="M10 15h4" className="text-charcoal-300" />
        </motion.svg>
      );
    }

    if (mode === 'compress-pdf') {
      // DYNAMIC SQUEEZE ANIMATION
      return (
        <motion.svg {...svgProps}>
           {/* Document */}
           <motion.rect 
             x="6" y="3" width="12" height="18" rx="2"
             className="text-brand-violet"
             fill="currentColor" fillOpacity="0.1"
             animate={{ 
               scaleX: [1, 0.65, 1], 
               scaleY: [1, 1.05, 1] 
             }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           />
           
           {/* Left Arrow Pusher */}
           <motion.path 
             d="M2 12h4m-2-2 2 2-2 2"
             className="text-brand-purple"
             strokeWidth="2.5"
             animate={{ x: [0, 5, 0] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           />
           
           {/* Right Arrow Pusher */}
           <motion.path 
             d="M22 12h-4m2-2-2 2 2 2"
             className="text-brand-purple"
             strokeWidth="2.5"
             animate={{ x: [0, -5, 0] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           />
           
           {/* Internal Content Squishing */}
           <motion.path 
             d="M9 7h6M9 11h6M9 15h6"
             animate={{ scaleX: [1, 0.5, 1] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           />
        </motion.svg>
      );
    }

    if (mode === 'merge-pdf') {
      // MERGE/SNAP ANIMATION REFINED
      return (
         <motion.svg {...svgProps}>
            {/* Bottom Doc (Waiting) */}
            <motion.rect
              x="6" y="10" width="12" height="11" rx="1"
              className="text-brand-orange"
              fill="currentColor" fillOpacity="0.1"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, times: [0.4, 0.5, 0.6] }}
            />
            
            {/* Top Doc (Falling & Snapping) */}
            <motion.path 
              d="M6 3h12v11H6z"
              className="text-brand-purple"
              fill="white"
              strokeWidth="1.5"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: [-10, 7, 7, 7], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, times: [0, 0.4, 0.8, 1], ease: "bounceOut" }}
            />
            
            {/* Merge Symbol */}
            <motion.path
               d="M12 11v4M10 13h4"
               className="text-charcoal-700 dark:text-white"
               strokeWidth="2"
               initial={{ scale: 0 }}
               animate={{ scale: [0, 1, 1, 0] }}
               transition={{ duration: 2, repeat: Infinity, times: [0.35, 0.45, 0.8, 1] }}
            />
         </motion.svg>
      );
    }

    if (mode === 'split-pdf') {
       // SPLIT / SEPARATE ANIMATION
       return (
        <motion.svg {...svgProps}>
          {/* Main Document in middle */}
          <rect x="7" y="4" width="10" height="16" rx="2" className="text-brand-mint" />
          
          {/* Page Peeling Off Top Right */}
          <motion.path 
            d="M15 4l4 4h-4z" 
            fill="currentColor"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Arrows separating */}
          <motion.path 
            d="M12 12l-6 4"
            strokeDasharray="2 2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
           <motion.path 
            d="M12 12l6 4"
            strokeDasharray="2 2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          
          {/* Result Pages */}
          <motion.rect 
            x="3" y="16" width="6" height="8" rx="1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="text-brand-purple"
            fill="white" fillOpacity="0.2"
          />
          <motion.rect 
            x="15" y="16" width="6" height="8" rx="1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
            className="text-brand-purple"
            fill="white" fillOpacity="0.2"
          />
        </motion.svg>
       );
    }

    // Default Fallback
    return <Plus className="w-16 h-16 text-brand-purple" />;
  };

  const getHeadline = () => {
    if (isDragActive) return "Drop it like it's hot!";
    if (mode === 'image-to-pdf') return "Drop images here";
    if (mode === 'compress-pdf') return "Drop PDF here";
    if (mode === 'merge-pdf') return "Drop your PDFs here";
    if (mode === 'split-pdf') return "Drop PDF here";
    return "Drop PDF here";
  };

  const getSubtext = () => {
    if (mode === 'image-to-pdf') return "Supports JPG, PNG, WebP, GIF, BMP";
    if (mode === 'compress-pdf') return "Reduce file size instantly";
    if (mode === 'merge-pdf') return "Combine multiple files into one";
    if (mode === 'split-pdf') return "Extract pages or split into files";
    return "Convert any PDF into high-quality images";
  };

  return (
    <motion.div 
      {...getRootProps()} 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        cursor-pointer group relative
        backdrop-blur-md
        min-h-[220px] md:min-h-[300px] flex flex-col items-center justify-center
        rounded-3xl transition-all duration-500 w-full shadow-2xl shadow-brand-purple/10 hover:shadow-brand-purple/20
        border-2
        ${isDragActive 
          ? 'bg-brand-purple/5 dark:bg-brand-purple/10 border-brand-purple scale-105 shadow-brand-purple/30' 
          : 'bg-white/80 dark:bg-charcoal-900/60 hover:bg-white dark:hover:bg-charcoal-900 border-transparent dark:border-charcoal-700 hover:-translate-y-1'
        }
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />

      {/* Animated Glowing Border Container */}
      <div className={`absolute inset-0 rounded-3xl overflow-hidden pointer-events-none transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
         <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass()} opacity-20 blur-md`} />
      </div>
      
      {/* Animated Dashed Border (SVG) */}
      <motion.svg 
        className={`absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300 ${isDragActive ? getThemeColor() : 'text-charcoal-400/20 dark:text-slate-600/30 group-hover:text-charcoal-400/40'}`}
      >
        <motion.rect
          width="100%"
          height="100%"
          x="0"
          y="0"
          rx="24"
          ry="24"
          fill="none"
          stroke="currentColor"
          animate={{
            strokeWidth: isDragActive ? 4 : 3,
            strokeDasharray: isDragActive ? "12 12" : "16 16",
          }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        />
        {/* Marching Ants Animation */}
        <motion.rect
          width="100%"
          height="100%"
          x="0"
          y="0"
          rx="24"
          ry="24"
          fill="none"
          stroke="currentColor"
          animate={{ 
            strokeDashoffset: -32,
            strokeWidth: isDragActive ? 4 : 3,
            strokeDasharray: isDragActive ? "12 12" : "16 16"
          }}
          transition={{ 
            strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" },
            strokeWidth: { duration: 0.3 },
            strokeDasharray: { duration: 0.3 }
          }}
          className={`transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-50'}`}
        />
      </motion.svg>

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 px-6 text-center animate-float" style={{ animationDelay: '0.2s' }}>
        
        {/* Giant Floating Icon with Dynamic Background */}
        <motion.div 
          className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white dark:bg-charcoal-800 shadow-lg shadow-charcoal-500/5 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-500 ease-out border border-white/50 dark:border-white/5"
          animate={isDragActive ? { scale: 1.15, rotate: 5 } : {}}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {getIcon()}
        </motion.div>
        
        <div>
          <span className="block font-heading font-bold text-charcoal-800 dark:text-slate-200 text-xl md:text-3xl mb-2 md:mb-3 tracking-tight">
            {getHeadline()}
          </span>
          <p className="text-charcoal-500 dark:text-slate-400 text-xs md:text-base font-medium max-w-[260px] mx-auto leading-relaxed">
             {getSubtext()}
          </p>
        </div>

        {/* Action Button */}
        <motion.div 
          className="relative overflow-hidden mt-1 px-6 py-2.5 md:px-8 md:py-3 bg-brand-purple text-white rounded-full font-bold shadow-lg shadow-brand-purple/30 group-hover:shadow-brand-purple/50 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
           {/* Shimmer Overlay */}
           <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
           
           <Plus className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
           <span className="text-sm md:text-base relative z-10">Select Files</span>
        </motion.div>

      </div>
    </motion.div>
  );
};