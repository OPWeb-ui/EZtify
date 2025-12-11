
import React from 'react';
import { AppMode } from '../types';
import { Download, FileDown, FolderArchive, Image as ImageIcon, ZoomIn, ZoomOut, Loader2, ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';

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
  showFilmstripToggle,
  onToggleFilmstrip,
  isFilmstripVisible
}) => {
  const getActionLabel = () => {
    if (isGenerating) {
      if (status) return `${status} ${progress > 0 && progress < 100 ? `(${progress}%)` : ''}`.trim();
      return `Processing... (${progress}%)`;
    }
    if (mode === 'image-to-pdf') return 'Convert & Download';
    if (mode === 'pdf-to-image') return 'Download Images';
    return imageCount > 1 ? 'Download ZIP' : 'Download';
  };

  const getActionIcon = () => {
    if (isGenerating) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (mode === 'image-to-pdf') return <FileDown className="w-5 h-5" />;
    return <Download className="w-5 h-5" />;
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-charcoal-850 border-t border-slate-100 dark:border-white/5 shadow-layer-3 dark:shadow-layer-dark-3 pb-safe"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
        
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          {showFilmstripToggle && onToggleFilmstrip && (
            <motion.button
              onClick={onToggleFilmstrip}
              whileTap={buttonTap}
              className={`
                p-3 rounded-xl border transition-all
                ${isFilmstripVisible
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                  : 'bg-slate-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-transparent'
                }
              `}
            >
              <ChevronsUpDown className="w-5 h-5" />
            </motion.button>
          )}

          {onZoomIn && onZoomOut && zoomLevel !== undefined && (
             <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-xl">
                <button onClick={onZoomOut} disabled={zoomLevel <= 0.5} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple disabled:opacity-30"><ZoomOut size={18} /></button>
                <span className="min-w-[3rem] text-center font-bold text-xs text-charcoal-600 dark:text-charcoal-400">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={onZoomIn} disabled={zoomLevel >= 4} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple disabled:opacity-30"><ZoomIn size={18} /></button>
             </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {onSecondaryAction && secondaryLabel && (
            <motion.button
              onClick={onSecondaryAction}
              disabled={isGenerating}
              whileTap={buttonTap}
              className="
                hidden sm:flex items-center gap-2 px-5 py-3 rounded-[16px] font-bold text-sm
                bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200
                hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-50
              "
            >
              {secondaryIcon || <ImageIcon className="w-4 h-4" />}
              <span>{secondaryLabel}</span>
            </motion.button>
          )}

          <motion.button
            onClick={onGenerate}
            disabled={isGenerating || imageCount === 0}
            whileTap={!isGenerating ? { scale: 0.97 } : {}}
            className={`
              relative overflow-hidden rounded-[18px] px-6 py-3.5 font-bold tracking-wide text-white text-sm md:text-base flex-1 md:flex-none md:min-w-[220px]
              shadow-lg shadow-brand-purple/30
              transition-all disabled:opacity-50 disabled:shadow-none
              bg-gradient-to-r from-[#9E76FF] to-[#6E79FF] hover:brightness-110
            `}
          >
            {/* Progress Bar Background */}
            {isGenerating && (
              <motion.div 
                className="absolute inset-y-0 left-0 bg-black/10" 
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }} 
              />
            )}

            <div className="relative flex items-center justify-center gap-2 z-10">
              {getActionIcon()}
              <span className="whitespace-nowrap truncate">{getActionLabel()}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
