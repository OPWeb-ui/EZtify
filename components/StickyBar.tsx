
import React from 'react';
import { AppMode } from '../types';
import { Download, ZoomIn, ZoomOut, Loader2, RefreshCw, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip } from './Tooltip';
import { EZButton } from './EZButton';

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
    
    const downloadModes: string[] = [
      'unlock-pdf', 'grayscale-pdf', 'pptx-to-pdf'
    ];

    if (downloadModes.includes(mode)) return 'DOWNLOAD PDF';
    if (mode === 'image-to-pdf') return 'CONVERT & SAVE';
    if (mode === 'pdf-to-image') return 'EXTRACT IMAGES';
    return imageCount > 1 ? 'DOWNLOAD ARCHIVE' : 'DOWNLOAD FILE';
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
            <EZButton 
                variant="tertiary" 
                size="md" 
                onClick={onReset} 
                icon={<RefreshCw size={18} />}
                className="hidden md:inline-flex"
            >
                RESET
            </EZButton>
          )}
          {/* Mobile Reset Icon Only */}
          {onReset && (
             <button onClick={onReset} className="md:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-slate-300">
                <RefreshCw size={20} />
             </button>
          )}

          {showFilmstripToggle && onToggleFilmstrip && (
            <Tooltip content={isFilmstripVisible ? "Hide pages" : "Show pages"}>
              <EZButton
                variant={isFilmstripVisible ? 'secondary' : 'tertiary'}
                size="icon"
                onClick={onToggleFilmstrip}
              >
                <LayoutGrid className="w-5 h-5" />
              </EZButton>
            </Tooltip>
          )}

          {onZoomIn && onZoomOut && zoomLevel !== undefined && (
             <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-lg border border-slate-200 dark:border-charcoal-700">
                <button onClick={onZoomOut} disabled={zoomLevel <= 0.5} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white disabled:opacity-30 transition-colors"><ZoomOut size={14} /></button>
                <span className="min-w-[3rem] text-center font-mono font-bold text-xs text-charcoal-600 dark:text-charcoal-400">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={onZoomIn} disabled={zoomLevel >= 4} className="p-1.5 rounded hover:bg-white dark:hover:bg-charcoal-700 text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white disabled:opacity-30 transition-colors"><ZoomIn size={14} /></button>
             </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-0">
          {onSecondaryAction && secondaryLabel && (
            <EZButton
                variant="tertiary"
                onClick={onSecondaryAction}
                disabled={isGenerating}
                icon={secondaryIcon || <ImageIcon className="w-5 h-5" />}
                className="hidden md:inline-flex"
            >
                {secondaryLabel}
            </EZButton>
          )}

          {/* Primary Action Button (Download/Export = Orange) */}
          <EZButton
            variant="primary"
            onClick={onGenerate}
            disabled={isGenerating || imageCount === 0}
            isLoading={isGenerating}
            size="lg"
            icon={!isGenerating && <Download size={20} />}
            className="w-full md:w-auto min-w-[160px] shadow-orange-500/30"
          >
            {getActionLabel()}
          </EZButton>
        </div>
      </div>
    </motion.div>
  );
};
