
import React, { useMemo, useRef, useEffect } from 'react';
import { UploadedImage, PdfConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { RefreshCw, X, Plus, FilePlus } from 'lucide-react';

interface PreviewProps {
  image: UploadedImage | null;
  config: PdfConfig;
  onReplace: (file: File) => void;
  onAddFiles?: (files: File[], fileRejections: FileRejection[]) => void;
  onDropRejected: (msg: string) => void;
  onClose?: () => void;
  scale: number; // Controlled by parent
  setScale?: (newScale: number) => void; // Optional control for internal zoom handling
  baseDimensionsRef?: React.MutableRefObject<{ width: number; height: number } | null>;
}

// PDF Points (72 DPI standard)
const SIZES_PT: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export const Preview: React.FC<PreviewProps> = ({ 
  image, 
  config, 
  onReplace,
  onAddFiles,
  onDropRejected,
  onClose,
  scale,
  setScale,
  baseDimensionsRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts for Preview
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Zoom shortcuts
    if (setScale) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale(Math.min(scale * 1.1, 5));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale(Math.max(scale / 1.1, 0.1));
      } else if (e.key === '0') {
        e.preventDefault();
        setScale(1); // Reset
      }
    }

    // Pan shortcuts (if zoomed in and scrollable)
    if (containerRef.current) {
        const scrollAmount = 50;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            containerRef.current.scrollTop -= scrollAmount;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            containerRef.current.scrollTop += scrollAmount;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            containerRef.current.scrollLeft -= scrollAmount;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            containerRef.current.scrollLeft += scrollAmount;
        }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, fileRejections) => {
      if (onAddFiles) {
        onAddFiles(acceptedFiles, fileRejections);
      } else if (acceptedFiles.length > 0) {
        onReplace(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      if (!onAddFiles) {
        onDropRejected("Unsupported file type.");
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: !!onAddFiles,
    noClick: true,
    disabled: !image && !onAddFiles
  });

  const isRotated = image ? image.rotation % 180 !== 0 : false;

  // Determine the "Base" dimensions of the document (Paper or Image)
  const baseDims = useMemo(() => {
    if (config.pageSize === 'auto' && image) {
      // For "Auto", use the image's actual pixel dimensions
      // If rotated sideways, swap w/h
      return isRotated 
        ? { width: image.height, height: image.width }
        : { width: image.width, height: image.height };
    }

    // For fixed sizes (A4/Letter), get standard PT sizes
    const std = SIZES_PT[config.pageSize] || SIZES_PT['a4'];
    
    // Adjust for orientation
    if (config.orientation === 'landscape') {
      return { width: std.height, height: std.width };
    }
    return std;
  }, [config.pageSize, config.orientation, image, isRotated]);

  // Expose base dimensions to parent for "Fit" calculations
  if (baseDimensionsRef) {
    baseDimensionsRef.current = baseDims;
  }

  // Calculate the "Canvas" size based on current Zoom Scale
  const canvasWidth = baseDims.width * scale;
  const canvasHeight = baseDims.height * scale;

  // Image Aspect Ratio for inner scaling
  const imgAspectRatio = useMemo(() => {
    if (!image) return 1;
    return isRotated ? image.height / image.width : image.width / image.height;
  }, [image, isRotated]);

  // --- Image Styling inside the "Paper" ---
  const imageStyles = useMemo(() => {
    const objectFit = config.fitMode === 'fill' ? 'fill' : config.fitMode === 'cover' ? 'cover' : 'contain';
    
    const style: React.CSSProperties = {
      objectFit: objectFit as any,
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      transform: `rotate(${image?.rotation || 0}deg)`,
    };
    
    return style;
  }, [config.fitMode, config.pageSize, image?.rotation, isRotated]);

  if (!image) return (
    <div {...getRootProps()} className="w-full h-full flex items-center justify-center p-8 outline-none">
      <input {...getInputProps()} />
      <div className={`
        text-center p-12 border-2 border-dashed rounded-3xl 
        flex flex-col items-center justify-center gap-4 transition-colors duration-300
        ${isDragActive 
          ? 'border-brand-purple bg-brand-purple/5' 
          : 'border-slate-300 dark:border-charcoal-700 bg-slate-50/50 dark:bg-charcoal-900/50 hover:border-slate-400 dark:hover:border-charcoal-600'
        }
      `}>
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform duration-300
          ${isDragActive ? 'scale-110 bg-brand-purple/10 text-brand-purple' : 'bg-slate-200 dark:bg-charcoal-700 text-charcoal-400'}
        `}>
           {isDragActive ? <FilePlus size={32} /> : <Plus size={32} />}
        </div>
        <div>
          <p className="font-bold text-charcoal-700 dark:text-slate-200 text-sm">No Selection Active</p>
          <p className="text-charcoal-500 dark:text-charcoal-400 font-mono text-[10px] uppercase tracking-widest mt-1">
            Drag images here to add
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      {...getRootProps()} 
      ref={containerRef}
      tabIndex={0} // Make focusable
      className="relative outline-none w-full h-full overflow-auto flex flex-col items-center bg-slate-100/50 dark:bg-black/20 custom-scrollbar focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-purple/30"
      onKeyDown={handleKeyDown}
      onClick={(e) => { e.stopPropagation(); containerRef.current?.focus(); }} // Focus on click
    >
      <input {...getInputProps()} />

      {/* 
        Scroll Spacer
        We use min-h-full to ensure centering when zoomed out, 
        and flex layout to center the canvas.
      */}
      <div className="min-w-full min-h-full flex items-center justify-center p-8 md:p-16">
        
        {/* The Fixed Canvas (Paper) */}
        <motion.div
          layout={false} // Disable framer layout thrashing, we handle size explicitly
          animate={{ width: canvasWidth, height: canvasHeight }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="
            relative bg-white shadow-2xl 
            ring-1 ring-black/5 dark:ring-white/10
            origin-center select-none overflow-hidden
            flex-shrink-0
          "
        >
          {/* Subtle Tech Markers (Guides) */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t border-brand-purple/30 z-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-r border-t border-brand-purple/30 z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-l border-b border-brand-purple/30 z-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b border-brand-purple/30 z-20 pointer-events-none" />

          {/* Content Area */}
          <div 
            className="w-full h-full relative overflow-hidden flex items-center justify-center bg-white" 
            style={{ padding: config.pageSize === 'auto' ? 0 : `${config.margin}px` }} // No margin for auto/raw
          >
            <motion.img
              key={image.id}
              src={image.previewUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              alt="Preview"
              className="block max-w-full max-h-full object-contain"
              style={imageStyles}
            />
          </div>

          {/* Hover Overlay */}
          <AnimatePresence>
            {isDragActive && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-brand-purple/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
              >
                 {onAddFiles ? <Plus className="w-10 h-10 mb-3 animate-bounce" /> : <RefreshCw className="w-10 h-10 mb-3 animate-spin" />}
                 <p className="font-mono font-bold text-sm uppercase tracking-widest">{onAddFiles ? "ADD_FILES" : "REPLACE_SOURCE"}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Badge (Desktop Only visual cue) */}
          <div className="absolute bottom-2 right-2 opacity-50 hover:opacity-100 transition-opacity pointer-events-none z-10">
             <span className="text-[8px] font-mono font-bold text-charcoal-400 uppercase bg-white/80 backdrop-blur px-1.5 py-0.5 rounded border border-charcoal-100">
                {config.pageSize === 'auto' ? `${Math.round(baseDims.width)}x${Math.round(baseDims.height)} PX` : config.pageSize.toUpperCase()}
             </span>
          </div>

          {onClose && (
            <div className="absolute top-2 right-2 z-30">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-rose-500 shadow-sm border border-rose-100 hover:border-rose-300 transition-colors"
                title="Remove"
              >
                <X size={14} />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
