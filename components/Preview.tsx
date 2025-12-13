
import React, { useMemo } from 'react';
import { UploadedImage, PdfConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { RefreshCw, X, Plus } from 'lucide-react';

interface PreviewProps {
  image: UploadedImage | null;
  config: PdfConfig;
  onReplace: (file: File) => void;
  onAddFiles?: (files: File[], fileRejections: FileRejection[]) => void;
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
  scale // Now mostly used for animation entrance or handled by parent
}) => {

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, fileRejections) => {
      if (onAddFiles) {
        // Pass both accepted and rejected files to parent handler
        onAddFiles(acceptedFiles, fileRejections);
      } else if (acceptedFiles.length > 0) {
        onReplace(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      // Only use the generic error if we are NOT in add-files mode.
      // If we ARE in add-files mode, the onDrop handler above takes care of passing rejections to the parent.
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

  // Calculate Aspect Ratio based on settings
  const aspectRatio = useMemo(() => {
    if (!image) return 1;
    if (config.pageSize === 'a4') return config.orientation === 'portrait' ? 210 / 297 : 297 / 210;
    if (config.pageSize === 'letter') return config.orientation === 'portrait' ? 215.9 / 279.4 : 279.4 / 215.9;
    
    // Auto size -> match image
    return isRotated ? image.height / image.width : image.width / image.height;
  }, [config.pageSize, config.orientation, image?.width, image?.height, isRotated]);

  // CSS Styles for the image inside the paper
  const imageStyles = useMemo(() => {
    const objectFit = config.fitMode === 'fill' ? 'fill' : config.fitMode === 'cover' ? 'cover' : 'contain';
    
    const style: React.CSSProperties = {
      objectFit: objectFit as any,
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff'
    };

    if (config.pageSize !== 'auto' && config.fitMode === 'fill' && isRotated) {
       style.width = `${(1 / aspectRatio) * 100}%`;
       style.height = `${aspectRatio * 100}%`;
       style.maxWidth = 'none';
       style.maxHeight = 'none';
       style.transform = `rotate(${image?.rotation || 0}deg)`;
       style.transformOrigin = 'center center';
    } else {
       style.transform = `rotate(${image?.rotation || 0}deg)`;
    }
    
    return style;
  }, [config.pageSize, config.fitMode, isRotated, aspectRatio, image?.rotation]);

  if (!image) return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-charcoal-700 rounded-3xl opacity-50">
        <p className="text-charcoal-500 dark:text-slate-400 font-medium">No image selected</p>
      </div>
    </div>
  );

  return (
    <div {...getRootProps()} className="relative outline-none">
      <input {...getInputProps()} />

      {/* The "Paper" */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white shadow-2xl shadow-charcoal-900/20 dark:shadow-black/60 origin-center select-none"
        style={{
          // Using aspect-ratio CSS property to maintain shape
          aspectRatio: `${aspectRatio}`,
          // Minimum width for mobile readability
          minWidth: '280px', 
          // Base width controlled here, parent handles scale
          width: config.orientation === 'landscape' ? '600px' : '450px',
          maxWidth: '100%',
        }}
      >
        {/* Paper Texture/Border */}
        <div className="absolute inset-0 pointer-events-none border border-slate-100 dark:border-white/5 z-20" />

        {/* Content Area */}
        <div 
          className="w-full h-full relative overflow-hidden flex items-center justify-center bg-white" 
          style={{ padding: `${config.margin}px` }}
        >
          <motion.img
            key={image.id} // Re-mounts and animates when image changes
            src={image.previewUrl}
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            alt="Preview"
            className="block max-w-full max-h-full object-contain shadow-sm"
            style={imageStyles}
          />
        </div>

        {/* Hover Overlay for Drag */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 bg-brand-purple/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
            >
               {onAddFiles ? <Plus className="w-10 h-10 mb-2 animate-bounce" /> : <RefreshCw className="w-10 h-10 mb-2 animate-spin" />}
               <p className="font-bold">{onAddFiles ? "Drop to Add" : "Drop to Replace"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button - Standardized & Accessible */}
        {onClose && (
          <div className="absolute -top-4 -right-4 z-30">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-charcoal-800 text-charcoal-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 shadow-md border border-slate-200 dark:border-charcoal-600 transition-all duration-200"
              title="Remove"
            >
              <X size={20} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
