
import React from 'react';
import { AppMode } from '../types';
import { Download, FileDown, FolderArchive, Image as ImageIcon, ZoomIn, ZoomOut, Loader2, ChevronsUpDown, RefreshCw, LayoutGrid, Terminal } from 'lucide-react';
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
  showFilmstripToggle?: boolean;
  onToggleFilmstrip?: () => void;
  isFilmstripVisible?: boolean;
  onReset?: () => void;
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
  isFilmstripVisible,
  onReset
}) => {
  const getActionLabel = () => {
    if (isGenerating) {
      if (status) return `${status.toUpperCase()} [${Math.floor(progress)}%]`.trim();
      return `PROCESSING... [${Math.floor(progress)}%]`;
    }
    
    const pdfOutputModes: string[] = [
      'add-page-numbers', 'merge-pdf', 'split-pdf', 'reorder-pdf', 'rotate-pdf', 
      'delete-pdf-pages', 'redact-pdf', 'unlock-pdf', 'grayscale-pdf', 'word-to-pdf', 'pptx-to-pdf'
    ];

    if (pdfOutputModes.includes(mode)) return 'DOWNLOAD_PDF';
    if (mode === 'image-to-pdf') return 'CONVERT_&_SAVE';
    if (mode === 'pdf-to-image') return 'EXTRACT_IMAGES';
    return imageCount > 1 ? 'DOWNLOAD_ARCHIVE' : 'DOWNLOAD_FILE';
  };

  const getActionIcon = () => {
    if (isGenerating) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Download className="w-4 h-4" />;
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 pb-safe pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
        
        {/* Left Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onReset && (
            <motion.button
              onClick={onReset}
              whileTap={buttonTap}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 font-mono font-bold text-xs border border-transparent hover:border-slate-300 dark:hover:border-charcoal-600 transition-all"
              aria-label="Start Over"
            >
              <RefreshCw size={14} /> RESET
            </motion.button>
          )}

          {showFilmstripToggle && onToggleFilmstrip && (
            <motion.button
              onClick={onToggleFilmstrip}
              whileTap={buttonTap}
              className={`
                p-2.5 rounded-lg border transition-all relative z-10
                ${isFilmstripVisible
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                  : 'bg-slate-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-transparent hover:bg-slate-100 dark:hover:bg-charcoal-700'
                }
              `}
              title="View Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </motion.button>
          )}

          {onZoomIn && onZoomOut && zoomLevel !== undefined && (
             <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-lg border border-slate-200 dark:border-charcoal-700">
                <button onClick={onZoomOut} disabled={zoomLevel <= 0.5} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-brand-purple disabled:opacity-30 transition-colors"><ZoomOut size={14} /></button>
                <span className="min-w-[3rem] text-center font-mono font-bold text-xs text-charcoal-600 dark:text-charcoal-400">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={onZoomIn} disabled={zoomLevel >= 4} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-brand-purple disabled:opacity-30 transition-colors"><ZoomIn size={14} /></button>
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
                hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono font-bold text-xs uppercase
                bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 border border-slate-200 dark:border-charcoal-700
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
            whileTap={!isGenerating ? buttonTap : {}}
            className={`
              relative overflow-hidden rounded-lg px-6 py-3 font-mono font-bold tracking-wide text-white text-xs md:text-sm flex-1 md:flex-none md:min-w-[200px]
              shadow-lg shadow-brand-purple/20
              transition-all disabled:opacity-50 disabled:shadow-none
              bg-charcoal-900 dark:bg-white dark:text-charcoal-900 hover:bg-brand-purple dark:hover:bg-slate-200
              border border-transparent relative z-10
            `}
          >
            {/* Block Progress Bar */}
            {isGenerating && (
              <div className="absolute inset-0 flex">
                 <motion.div 
                    className="h-full bg-brand-purple/80 dark:bg-brand-purple/20"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }} 
                 />
              </div>
            )}

            <div className="relative flex items-center justify-center gap-2 z-10 uppercase">
              {getActionIcon()}
              <span className="whitespace-nowrap truncate">{getActionLabel()}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
