import React from 'react';
import { UploadedImage, AppMode } from '../types';
import { Download, FileDown, Sparkles, FolderArchive, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Plus, Loader2, Layers, ChevronsUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap, buttonHover } from '../utils/animations';
import { Tooltip } from './Tooltip';

interface StickyBarProps {
  imageCount: number;
  totalSize: number;
  onGenerate: () => void;
  isGenerating: boolean;
  progress?: number;
  status?: string;
  mode: AppMode;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: React.ReactNode;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  showFilmstripToggle?: boolean;
  onToggleFilmstrip?: () => void;
  isFilmstripVisible?: boolean;
}

export const StickyBar: React.FC<StickyBarProps> = ({ 
  imageCount, 
  totalSize, 
  onGenerate, 
  isGenerating, 
  progress = 0,
  status,
  mode,
  onSecondaryAction,
  secondaryLabel,
  secondaryIcon,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showFilmstripToggle,
  onToggleFilmstrip,
  isFilmstripVisible
}) => {
  const getActionLabel = () => {
    if (isGenerating) {
      if (status) return `${status} ${progress > 0 && progress < 100 ? `(${progress}%)` : ''}`.trim();
      if (progress >= 100) return 'Saving...';
      return `Processing... (${progress}%)`;
    }
    if (mode === 'image-to-pdf') return 'Convert & Download';
    if (mode === 'pdf-to-image') return 'Download';
    return imageCount > 1 ? 'Download ZIP' : 'Download Image';
  };

  const getTooltipText = () => {
     if (isGenerating) return "Processing...";
     if (mode === 'image-to-pdf') return "Convert your files and start the download automatically.";
     if (mode === 'pdf-to-image') return "Download all extracted images.";
     return "Download your files.";
  };

  const getSecondaryTooltipText = () => {
     if (mode === 'image-to-pdf') return "Add more images to include in this PDF.";
     if (mode === 'pdf-to-image') return "Add another PDF and merge its pages into this conversion.";
     return "Add more files.";
  };

  const getActionIcon = () => {
    if (isGenerating) return <Loader2 className="w-5 h-5 animate-spin" />;
    
    if (mode === 'image-to-pdf') return <FileDown className="w-5 h-5 group-hover:animate-bounce" />;
    return imageCount > 1 && mode !== 'pdf-to-image' ? <FolderArchive className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />;
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200/50 dark:border-charcoal-700/50 backdrop-blur-xl bg-white/90 dark:bg-charcoal-900/90 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] p-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-none justify-end min-w-0">
          
          {showFilmstripToggle && onToggleFilmstrip && (
            <Tooltip content={isFilmstripVisible ? "Hide Pages" : "View Pages"} side="top">
              <motion.button
                onClick={onToggleFilmstrip}
                whileTap={buttonTap}
                className={`
                  md:hidden flex items-center gap-2 px-3 py-3 rounded-xl font-bold text-xs
                  border shadow-sm transition-all
                  ${isFilmstripVisible
                    ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                    : 'bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-slate-200 dark:border-charcoal-700'
                  }
                `}
              >
                <ChevronsUpDown className="w-4 h-4" />
              </motion.button>
            </Tooltip>
          )}

          {onZoomIn && onZoomOut && zoomLevel !== undefined && (
             <div className="hidden md:flex items-center gap-1 p-1 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 shadow-sm mr-2">
                <motion.button onClick={onZoomOut} disabled={zoomLevel <= 0.5} whileTap={buttonTap} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom Out">
                  <ZoomOut size={16} />
                </motion.button>
                <span className="min-w-[3rem] text-center font-mono text-xs font-bold text-charcoal-600 dark:text-charcoal-400 select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <motion.button onClick={onZoomIn} disabled={zoomLevel >= 4} whileTap={buttonTap} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom In">
                  <ZoomIn size={16} />
                </motion.button>
             </div>
          )}

          {onSecondaryAction && secondaryLabel && (
            <Tooltip content={getSecondaryTooltipText()} side="top">
              <motion.button
                onClick={onSecondaryAction}
                disabled={isGenerating}
                whileHover={{ scale: 1.03 }}
                whileTap={buttonTap}
                className="
                  flex items-center gap-2 px-3 md:px-5 py-3 rounded-xl font-bold text-xs md:text-sm
                  bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300
                  border border-slate-200 dark:border-charcoal-700 shadow-sm
                  hover:bg-slate-50 dark:hover:bg-charcoal-700 hover:text-brand-purple hover:border-brand-purple/30
                  transition-all disabled:opacity-50 whitespace-nowrap
                "
              >
                {secondaryIcon || <ImageIcon className="w-4 h-4" />}
                <span>{secondaryLabel}</span>
              </motion.button>
            </Tooltip>
          )}

          <Tooltip content={getTooltipText()} side="top">
            <motion.button
              onClick={onGenerate}
              disabled={isGenerating || imageCount === 0}
              whileHover={!isGenerating && imageCount > 0 ? { scale: 1.05 } : {}}
              whileTap={!isGenerating && imageCount > 0 ? { scale: 0.95 } : {}}
              className={`
                relative group overflow-hidden rounded-xl px-4 md:px-8 py-3.5 font-heading font-bold tracking-wide text-white
                shadow-lg shadow-brand-green/30
                transition-all duration-300 ease-out disabled:opacity-50 disabled:shadow-none
                ${isGenerating ? 'cursor-wait' : 'cursor-pointer'}
                flex-1 md:flex-none min-w-[140px] md:min-w-[160px] max-w-[240px]
              `}
            >
              {isGenerating ? (
                <>
                  <div className="absolute inset-0 bg-slate-100 dark:bg-charcoal-800" />
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-green via-brand-greenHover to-brand-green"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2, ease: "linear" }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-greenHover to-brand-green group-hover:opacity-90" />
              )}

              <div className="relative flex items-center justify-center gap-2 z-10 text-white text-xs md:text-sm">
                {getActionIcon()}
                <span className="whitespace-nowrap">{getActionLabel()}</span>
              </div>
            </motion.button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};
