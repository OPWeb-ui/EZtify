
import React, { useMemo } from 'react';
import { UploadedImage, PdfConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { RefreshCw, X, Plus, Maximize } from 'lucide-react';

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
  scale 
}) => {

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

  const aspectRatio = useMemo(() => {
    if (!image) return 1;
    if (config.pageSize === 'a4') return config.orientation === 'portrait' ? 210 / 297 : 297 / 210;
    if (config.pageSize === 'letter') return config.orientation === 'portrait' ? 215.9 / 279.4 : 279.4 / 215.9;
    return isRotated ? image.height / image.width : image.width / image.height;
  }, [config.pageSize, config.orientation, image?.width, image?.height, isRotated]);

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
      <div className="text-center p-8 border border-dashed border-slate-300 dark:border-charcoal-700 rounded-lg opacity-50 bg-slate-50 dark:bg-charcoal-900/50">
        <p className="text-charcoal-500 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">No active selection</p>
      </div>
    </div>
  );

  return (
    <div {...getRootProps()} className="relative outline-none w-full h-full flex items-center justify-center">
      <input {...getInputProps()} />

      {/* The "Paper" / Viewport */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white dark:bg-charcoal-800 shadow-xl border border-slate-200 dark:border-charcoal-700 origin-center select-none"
        style={{
          aspectRatio: `${aspectRatio}`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Tech Markers */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-brand-purple/50 -translate-x-1 -translate-y-1" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-brand-purple/50 translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-brand-purple/50 -translate-x-1 translate-y-1" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-brand-purple/50 translate-x-1 translate-y-1" />

        {/* Content Area */}
        <div 
          className="w-full h-full relative overflow-hidden flex items-center justify-center bg-white" 
          style={{ padding: `${config.margin}px` }}
        >
          <motion.img
            key={image.id}
            src={image.previewUrl}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
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
               {onAddFiles ? <Plus className="w-8 h-8 mb-2 animate-bounce" /> : <RefreshCw className="w-8 h-8 mb-2 animate-spin" />}
               <p className="font-mono font-bold text-xs uppercase tracking-widest">{onAddFiles ? "ADD_FILES" : "REPLACE_SOURCE"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labels/Badges */}
        <div className="absolute -top-6 left-0 flex items-center gap-2">
           <span className="text-[9px] font-mono font-bold text-charcoal-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-charcoal-900 px-1.5 py-0.5 border border-slate-200 dark:border-charcoal-700 rounded">
              {config.pageSize.toUpperCase()}
           </span>
           <span className="text-[9px] font-mono font-bold text-charcoal-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-charcoal-900 px-1.5 py-0.5 border border-slate-200 dark:border-charcoal-700 rounded">
              {config.orientation.toUpperCase()}
           </span>
        </div>

        {onClose && (
          <div className="absolute -top-3 -right-3 z-30">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-md border border-rose-600 transition-colors"
              title="Remove"
            >
              <X size={12} strokeWidth={3} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
