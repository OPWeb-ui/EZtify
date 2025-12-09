import React, { useEffect, useRef, useMemo } from 'react';
import { UploadedImage, PdfConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { RefreshCw, X, Plus } from 'lucide-react';
import { buttonTap } from '../utils/animations';

interface PreviewProps {
  image: UploadedImage | null;
  config: PdfConfig;
  onReplace: (file: File) => void;
  onAddFiles?: (files: File[]) => void;
  onDropRejected: (msg: string) => void;
  onClose?: () => void;
  scale: number;
}

export const Preview: React.FC<PreviewProps> = ({ 
  image, 
  config, 
  onReplace,
  onAddFiles,
  onDropRejected,
  onClose,
  scale
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        if (onAddFiles) {
          // If we support adding, pass all files to the add handler (Append)
          onAddFiles(acceptedFiles);
        } else {
          // Otherwise default to replacing the current image (Replace)
          onReplace(acceptedFiles[0]);
        }
      }
    },
    onDropRejected: () => {
      onDropRejected("Unsupported file type. Please upload JPG, PNG, or WebP.");
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: !!onAddFiles, // Allow multiple if adding is supported
    noClick: true, // Disable click to open file dialog (keep existing UI for that)
    disabled: !image && !onAddFiles // Only disable if no image AND no add handler
  });

  const isRotated = image ? image.rotation % 180 !== 0 : false;

  // Memoize Aspect Ratio
  const aspectRatio = useMemo(() => {
    if (!image) return 1;
    if (config.pageSize === 'a4') return config.orientation === 'portrait' ? 210 / 297 : 297 / 210;
    if (config.pageSize === 'letter') return config.orientation === 'portrait' ? 215.9 / 279.4 : 279.4 / 215.9;
    
    // For Auto, the page adapts to the image dimensions (including rotation)
    // If rotated 90deg, the container width becomes the image height
    return isRotated ? image.height / image.width : image.width / image.height;
  }, [config.pageSize, config.orientation, image?.width, image?.height, isRotated]);

  // Memoize Object Fit
  const objectFit = useMemo(() => {
    switch (config.fitMode) {
      case 'contain': return 'contain';
      case 'cover': return 'cover';
      case 'fill': return 'fill';
      default: return 'contain';
    }
  }, [config.fitMode]);

  // Memoize Rotation Scaling for Animation
  const rotationScale = useMemo(() => {
    if (!image) return 1;
    if (!isRotated) return 1; 

    if (config.pageSize === 'auto') {
       return Math.max(aspectRatio, 1 / aspectRatio);
    }

    if (config.fitMode === 'fill') return 1;

    if (config.fitMode === 'contain') {
      return Math.min(aspectRatio, 1 / aspectRatio);
    }
    
    return Math.max(aspectRatio, 1 / aspectRatio);
  }, [isRotated, config.pageSize, config.fitMode, aspectRatio]);

  // Calculate Target Animation State
  const animationState = useMemo(() => {
    if (!image) return { rotate: 0, scale: 1 };
    
    let targetScale = scale * rotationScale;
    
    // Special handling for FILL mode when rotated on fixed pages
    if (config.pageSize !== 'auto' && config.fitMode === 'fill' && isRotated) {
       targetScale = scale;
    }

    return {
      rotate: image.rotation || 0,
      scale: targetScale
    };
  }, [image, scale, rotationScale, config, isRotated]);

  // CSS Styles for layout dimensions (not transform animations)
  const imageStyles = useMemo(() => {
    const style: React.CSSProperties = {
      objectFit: objectFit as any,
      willChange: 'transform',
      transformOrigin: 'center center',
      width: '100%',
      height: '100%'
    };

    // Special handling for FILL mode when rotated on fixed pages
    if (config.pageSize !== 'auto' && config.fitMode === 'fill' && isRotated) {
       style.width = `${(1 / aspectRatio) * 100}%`;
       style.height = `${aspectRatio * 100}%`;
       style.maxWidth = 'none';
       style.maxHeight = 'none';
    }
    
    return style;
  }, [config.pageSize, config.fitMode, isRotated, aspectRatio, objectFit]);

  if (!image) return (
    <div className="flex-1 w-full h-full flex items-center justify-center text-charcoal-400 dark:text-slate-600 font-mono text-sm opacity-60">
      Select an image to preview
    </div>
  );

  // Shared button class for top actions
  const topButtonClass = "h-10 px-3 flex items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-charcoal-800/90 backdrop-blur border border-slate-200 dark:border-charcoal-600 shadow-sm text-charcoal-700 dark:text-slate-200 hover:bg-white dark:hover:bg-charcoal-700 hover:border-brand-purple/30 transition-colors";

  return (
    <div 
      {...getRootProps()}
      className="w-full h-full relative flex items-center justify-center bg-transparent px-4 pt-16 pb-24 md:p-10 md:pb-28 outline-none overflow-hidden"
    >
      <input {...getInputProps()} />

      {/* Stage Background Panel */}
      <div className="absolute inset-4 md:inset-8 bg-charcoal-500/5 dark:bg-white/5 rounded-[2rem] md:rounded-[3rem] -z-10 pointer-events-none" />

      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 z-50 rounded-3xl border-2 border-brand-purple border-dashed bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md flex flex-col items-center justify-center text-brand-purple shadow-2xl pointer-events-none"
          >
             {onAddFiles ? (
               <Plus className="w-12 h-12 mb-4 animate-bounce" />
             ) : (
               <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
             )}
             <p className="text-xl font-heading font-bold">
               {onAddFiles ? "Drop to Add" : "Drop to Replace"}
             </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Grid Pattern */}
      <div className="absolute inset-4 md:inset-8 opacity-[0.05] dark:opacity-[0.03] pointer-events-none rounded-[2rem] md:rounded-[3rem] overflow-hidden" style={{ 
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
        backgroundSize: '24px 24px' 
      }}></div>

      {/* === FLOATING ACTIONS (DOCKED TO CONTAINER) === */}
      
      {/* Top Right Actions Container */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30 flex flex-row flex-nowrap items-center gap-3">
        {/* Close Button */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={buttonTap}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`${topButtonClass} !w-10 !px-0 rounded-xl hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800`}
            title="Close and Reset"
          >
            <X size={20} />
          </motion.button>
        )}
      </div>

      {/* 
        PAGE CONTAINER (The "Paper")
      */}
      <motion.div
        ref={containerRef}
        layout
        className="relative bg-white shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 z-10 transition-all duration-300 ease-out origin-center max-w-[90%] max-h-[85%] md:max-w-[40%] md:max-h-[40%]"
        style={{
          aspectRatio: `${aspectRatio}`,
          width: aspectRatio >= 1 ? '100%' : 'auto',
          height: aspectRatio < 1 ? '100%' : 'auto',
        }}
      >
        {/* Margin Visualizer */}
        <div 
          className="absolute inset-0 border-dashed border-slate-300 dark:border-slate-200 pointer-events-none z-20 transition-all duration-300 opacity-60"
          style={{ borderWidth: `${config.margin}px` }} 
        />

        {/* Content Area */}
        <div 
          className="w-full h-full relative z-10 overflow-hidden flex items-center justify-center bg-white" 
          style={{ padding: `${config.margin}px` }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={image.id}
              src={image.previewUrl}
              alt="Preview"
              drag={scale > 1}
              dragConstraints={containerRef}
              dragElastic={0.1}
              dragMomentum={false}
              
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1,
                scale: animationState.scale,
                rotate: animationState.rotate
              }}
              exit={{ opacity: 0 }}
              
              transition={{ 
                opacity: { duration: 0.2 },
                scale: { type: "spring", stiffness: 260, damping: 20 },
                rotate: { type: "spring", stiffness: 260, damping: 20 },
                default: { duration: 0.2 }
              }}
              
              className={`block max-w-full max-h-full ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              style={imageStyles}
              loading="eager"
              decoding="async"
            />
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};