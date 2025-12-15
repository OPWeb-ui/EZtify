
import React, { useState, useRef, useEffect } from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { Sliders, ChevronDown, Check, ZoomIn, ZoomOut, Maximize, ArrowRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  mode: AppMode;
  config: PdfConfig;
  exportConfig: ExportConfig;
  onConfigChange: (newConfig: PdfConfig) => void;
  onExportConfigChange: (newConfig: ExportConfig) => void;
  isOpen: boolean;
  isMobile: boolean;
  imageCount?: number;
  totalSize?: number;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAddFiles?: () => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  progress?: number;
  status?: string;
  showFilmstripToggle?: boolean;
  isFilmstripVisible?: boolean;
  onToggleFilmstrip?: () => void;
  mobileMode?: 'drawer' | 'bottom-sheet';
  onClose?: () => void;
  variant?: 'default' | 'embedded';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  mode, 
  config, 
  exportConfig, 
  onConfigChange, 
  onExportConfigChange, 
  isOpen,
  isMobile,
  imageCount = 0,
  onGenerate,
  isGenerating,
  progress = 0,
  status,
  mobileMode = 'drawer',
  onClose,
  variant = 'default'
}) => {
  const [isFitDropdownOpen, setIsFitDropdownOpen] = useState(false);
  const fitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fitDropdownRef.current && !fitDropdownRef.current.contains(event.target as Node)) {
        setIsFitDropdownOpen(false);
      }
    };
    if (isFitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFitDropdownOpen]);

  const handlePdfChange = <K extends keyof PdfConfig>(key: K, value: PdfConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleExportChange = <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
    onExportConfigChange({ ...exportConfig, [key]: value });
  };

  const getActionLabel = () => {
    if (isGenerating) {
      return status ? `${status.toUpperCase()}` : 'PROCESSING...';
    }
    if (mode === 'image-to-pdf') return 'Convert & Save PDF';
    if (mode === 'pdf-to-image') return 'Extract Images';
    return 'Download Output';
  };

  const segmentedButtonClass = (isActive: boolean) => `
    flex-1 px-3 py-1.5 text-[11px] font-bold font-mono rounded-md transition-all duration-200 tracking-wide
    ${isActive
      ? 'bg-white dark:bg-charcoal-600 text-charcoal-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
      : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-white/50 dark:hover:bg-charcoal-700/50 hover:text-charcoal-700'
    }
  `;

  const fitOptions = [
    { value: 'contain', label: 'Contain' },
    { value: 'cover', label: 'Cover' },
    { value: 'fill', label: 'Fill' },
  ];

  const selectedFitLabel = fitOptions.find(o => o.value === config.fitMode)?.label || 'Contain';

  if (variant === 'embedded') {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-charcoal-900 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between bg-white dark:bg-charcoal-900 sticky top-0 z-10">
           <div className="flex items-center gap-2">
              <Sliders size={16} className="text-brand-purple" />
              <h3 className="text-xs font-bold text-charcoal-800 dark:text-white uppercase tracking-wider font-mono">Configuration</h3>
           </div>
           {onClose && (
             <button onClick={onClose} className="p-1.5 -mr-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-200">
               <X size={16} />
             </button>
           )}
        </div>

        <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
           {renderFormFields()}
        </div>
      </div>
    );
  }

  function renderFormFields() {
    return mode === 'image-to-pdf' ? (
      <>
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
            Page Size
          </label>
          <div className="flex bg-slate-200/60 dark:bg-charcoal-800/60 p-1 rounded-lg">
            {['auto', 'a4', 'letter'].map((size) => (
              <button
                key={size}
                onClick={() => handlePdfChange('pageSize', size as any)}
                className={segmentedButtonClass(config.pageSize === size)}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
            Orientation
          </label>
          <div className="flex bg-slate-200/60 dark:bg-charcoal-800/60 p-1 rounded-lg">
            <button onClick={() => handlePdfChange('orientation', 'portrait')} className={segmentedButtonClass(config.orientation === 'portrait')}>PORTRAIT</button>
            <button onClick={() => handlePdfChange('orientation', 'landscape')} className={segmentedButtonClass(config.orientation === 'landscape')}>LANDSCAPE</button>
          </div>
        </div>

        <div className="space-y-2 group" ref={fitDropdownRef}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
              Fit Mode
            </label>
            <Tooltip content="How images scale to fit the page" side="left">
               <span className="cursor-help text-charcoal-300">?</span>
            </Tooltip>
          </div>
          <div className="relative">
            <motion.button 
              onClick={() => setIsFitDropdownOpen(!isFitDropdownOpen)} 
              whileTap={{ scale: 0.99 }} 
              className={`
                w-full flex items-center justify-between 
                bg-white dark:bg-charcoal-800 
                text-xs font-mono font-medium text-charcoal-700 dark:text-charcoal-200 
                rounded-lg px-3 py-2.5 border border-slate-200 dark:border-charcoal-700 
                focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 outline-none 
                transition-all shadow-sm hover:border-slate-300 dark:hover:border-charcoal-600
                ${isFitDropdownOpen ? 'border-brand-purple/50 ring-1 ring-brand-purple/50' : ''}
              `}
            >
              <span className="uppercase">{selectedFitLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-charcoal-400 transition-transform ${isFitDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </motion.button>
            
            <AnimatePresence>
              {isFitDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -2 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -2 }} 
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg shadow-lg overflow-hidden py-1"
                >
                  {fitOptions.map((option) => (
                    <button 
                      key={option.value} 
                      onClick={() => { handlePdfChange('fitMode', option.value as any); setIsFitDropdownOpen(false); }} 
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors uppercase
                        ${config.fitMode === option.value 
                          ? 'bg-brand-purple/5 text-brand-purple font-bold' 
                          : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
                      `}
                    >
                      {option.label}
                      {config.fitMode === option.value && <Check className="w-3 h-3" strokeWidth={1.5} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3 group">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
              Margin
            </label>
            <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-charcoal-300">
              {config.margin}mm
            </span>
          </div>
          <div className="relative h-6 flex items-center">
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={config.margin} 
                onChange={(e) => handlePdfChange('margin', parseInt(e.target.value))} 
                className="
                  absolute w-full h-1 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-purple 
                  [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none
                " 
              />
          </div>
        </div>

        <div className="space-y-3 group">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
              Quality
            </label>
            <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-charcoal-300">
              {Math.round(config.quality * 100)}%
            </span>
          </div>
          <div className="relative h-6 flex items-center">
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1"
                value={config.quality} 
                onChange={(e) => handlePdfChange('quality', parseFloat(e.target.value))} 
                className="
                  absolute w-full h-1 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-purple 
                  [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none
                " 
              />
          </div>
        </div>
      </>
    ) : (
      <div className="space-y-2 group">
        <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">
          Image Format
        </label>
        <div className="flex bg-slate-200/60 dark:bg-charcoal-800/60 p-1 rounded-lg">
          {(['png', 'jpeg'] as ImageFormat[]).map((fmt) => (
            <button 
              key={fmt} 
              onClick={() => handleExportChange('format', fmt)} 
              className={segmentedButtonClass(exportConfig.format === fmt)}
            >
              {fmt === 'jpeg' ? 'JPG' : 'PNG'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isBottomSheet = isMobile && mobileMode === 'bottom-sheet';
  
  const sidebarClasses = isBottomSheet 
    ? `
        fixed bottom-0 left-0 right-0 z-40 w-full 
        bg-white dark:bg-charcoal-900
        border-t border-slate-200 dark:border-charcoal-800
        rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
        max-h-[60vh] flex flex-col
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `
    : `
        fixed inset-y-0 left-0 z-30 w-full md:w-80 
        bg-slate-50 dark:bg-charcoal-900
        border-r border-slate-200 dark:border-charcoal-800
        transform transition-transform duration-300 ease-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full shadow-2xl md:shadow-none
      `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-charcoal-900 dark:text-white uppercase tracking-wide font-heading">
                Settings
              </h2>
              <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono hidden xs:block">
                {mode === 'image-to-pdf' ? 'Page Layout' : 'Export Options'}
              </p>
            </div>
          </div>
          
          {isBottomSheet && onClose && (
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="p-6 space-y-8 pb-32 md:pb-6">
           {renderFormFields()}
        </div>

        {!isMobile && !isBottomSheet && (
          <div className="p-6 border-t border-slate-200 dark:border-charcoal-800 bg-white/50 dark:bg-charcoal-900/50 backdrop-blur-sm mt-auto">
            {onGenerate && (
              <motion.button 
                onClick={onGenerate} 
                disabled={isGenerating || imageCount === 0} 
                whileTap={buttonTap} 
                className="
                  relative overflow-hidden w-full rounded-xl h-12
                  font-bold text-sm tracking-wide text-white 
                  shadow-lg shadow-brand-purple/25 
                  transition-all duration-200 ease-out 
                  disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed
                  bg-brand-purple hover:bg-brand-purpleDark
                  border border-transparent
                  group
                "
              >
                {isGenerating && (
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-white/20" 
                    initial={{ width: '0%' }} 
                    animate={{ width: `${progress}%` }} 
                    transition={{ duration: 0.1, ease: "linear" }} 
                  />
                )}
                <div className="relative flex items-center justify-center gap-2 z-10 h-full">
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{getActionLabel()}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                    </>
                  )} 
                </div>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
