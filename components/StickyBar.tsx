
import React from 'react';
import { AppMode } from '../types';
import { Download, ZoomIn, ZoomOut, Loader2, RefreshCw, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';
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
      if (status) return `${status.toUpperCase()}`.trim();
      return `PROCESSING...`;
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
    if (isGenerating) return <Loader2 className="w-5 h-5 animate-spin" />;
    return <Download className="w-5 h-5" />;
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
        
        {/* Left Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onReset && (
            <motion.button
              onClick={onReset}
              whileTap={buttonTap}
              className="flex items-center justify-center gap-2 h-12 w-14 md:w-auto md:h-10 md:px-4 rounded-xl md:rounded-lg bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 font-mono font-bold text-xs border border-transparent hover:border-slate-300 dark:hover:border-charcoal-600 transition-all"
              aria-label="Start Over"
            >
              <RefreshCw size={18} /> <span className="hidden md:inline">RESET</span>
            </motion.button>
          )}

          {showFilmstripToggle && onToggleFilmstrip && (
            <Tooltip content={isFilmstripVisible ? "Hide pages" : "Show pages"}>
              <motion.button
                onClick={onToggleFilmstrip}
                whileTap={buttonTap}
                className={`
                  h-12 w-14 md:h-10 md:w-auto md:p-2.5 flex items-center justify-center rounded-xl md:rounded-lg border transition-all relative z-10
                  ${isFilmstripVisible
                    ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                    : 'bg-slate-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-transparent hover:bg-slate-100 dark:hover:bg-charcoal-700'
                  }
                `}
                aria-label="Toggle Filmstrip"
              >
                <LayoutGrid className="w-5 h-5 md:w-4 md:h-4" />
              </motion.button>
            </Tooltip>
          )}

          {onZoomIn && onZoomOut && zoomLevel !== undefined && (
             <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-lg border border-slate-200 dark:border-charcoal-700">
                <Tooltip content="Zoom out">
                  <button onClick={onZoomOut} disabled={zoomLevel <= 0.5} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-brand-purple disabled:opacity-30 transition-colors"><ZoomOut size={14} /></button>
                </Tooltip>
                <span className="min-w-[3rem] text-center font-mono font-bold text-xs text-charcoal-600 dark:text-charcoal-400">{Math.round(zoomLevel * 100)}%</span>
                <Tooltip content="Zoom in">
                  <button onClick={onZoomIn} disabled={zoomLevel >= 4} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-brand-purple disabled:opacity-30 transition-colors"><ZoomIn size={14} /></button>
                </Tooltip>
             </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-0">
          {onSecondaryAction && secondaryLabel && (
            <motion.button
              onClick={onSecondaryAction}
              disabled={isGenerating}
              whileTap={buttonTap}
              className="
                flex items-center justify-center gap-2 h-12 w-14 md:w-auto md:h-10 md:px-4 md:py-2.5 rounded-xl md:rounded-lg font-mono font-bold text-xs uppercase
                bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 border border-slate-200 dark:border-charcoal-700
                hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-50
              "
              title={secondaryLabel} // Fallback
              aria-label={secondaryLabel}
            >
              {secondaryIcon || <ImageIcon className="w-5 h-5 md:w-4 md:h-4" />}
              <span className="hidden md:inline">{secondaryLabel}</span>
            </motion.button>
          )}

          <motion.button
            onClick={onGenerate}
            disabled={isGenerating || imageCount === 0}
            whileTap={!isGenerating ? buttonTap : {}}
            className={`
              relative overflow-hidden
              /* Mobile: Square-ish, Icon Only */
              h-12 w-16 rounded-xl
              /* Desktop: Wide, Text included */
              md:h-12 md:w-auto md:min-w-[200px] md:px-6 md:py-3
              font-mono font-bold tracking-wide text-white text-xs md:text-sm 
              shadow-lg shadow-brand-purple/20 
              transition-all disabled:opacity-50 disabled:shadow-none
              bg-charcoal-900 dark:bg-white dark:text-charcoal-900 hover:bg-brand-purple dark:hover:bg-slate-200
              border border-transparent relative z-10
              flex items-center justify-center
            `}
            aria-label={getActionLabel()}
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
              {/* Text Label - Hidden on Mobile */}
              <span className="hidden md:inline whitespace-nowrap truncate">{getActionLabel()}</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
