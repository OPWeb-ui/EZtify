
import React, { useState, useRef, useEffect } from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { Sliders, ScanLine, Expand, Scaling, RectangleVertical, Image, ChevronDown, Check, ZoomIn, ZoomOut, Plus, Download, Loader2, PanelBottom } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonTap } from '../utils/animations';

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
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onAddFiles,
  onGenerate,
  isGenerating,
  progress = 0,
  status,
  showFilmstripToggle,
  isFilmstripVisible,
  onToggleFilmstrip
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
      if (status) return `${status.toUpperCase()} [${Math.floor(progress)}%]`.trim();
      return `PROCESSING... [${Math.floor(progress)}%]`;
    }
    if (mode === 'image-to-pdf') return 'CONVERT_&_SAVE';
    if (mode === 'pdf-to-image') return 'EXTRACT_IMAGES';
    return 'DOWNLOAD_OUTPUT';
  };

  const segmentedButtonClass = (isActive: boolean) => `
    flex-1 px-3 py-2 text-[10px] font-bold font-mono rounded-md transition-all duration-200 tracking-wider
    ${isActive
      ? 'bg-white dark:bg-charcoal-700 text-brand-purple shadow-sm ring-1 ring-black/5 dark:ring-white/5'
      : 'text-charcoal-500 dark:text-charcoal-400 hover:bg-white/50 dark:hover:bg-charcoal-800/50'
    }
  `;

  const fitOptions = [
    { value: 'contain', label: 'Contain (Fit Whole)' },
    { value: 'cover', label: 'Cover (Fill Page)' },
    { value: 'fill', label: 'Stretch (Distort)' },
  ];

  const selectedFitLabel = fitOptions.find(o => o.value === config.fitMode)?.label || 'Contain';

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-30 w-full md:w-80 
        bg-slate-50 dark:bg-charcoal-900
        border-r border-slate-200 dark:border-charcoal-800
        transform transition-transform duration-300 ease-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full shadow-2xl md:shadow-none
      `}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Settings Header */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-charcoal-800 bg-white/50 dark:bg-charcoal-850/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple border border-brand-purple/20">
              <Sliders className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-charcoal-900 dark:text-white tracking-wide uppercase">
                Configuration
              </h2>
              <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono">
                {mode === 'image-to-pdf' ? 'Layout Parameters' : 'Output Settings'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
              {mode === 'image-to-pdf' ? (
                <>
                  <div className="space-y-3 group">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                      <ScanLine className="w-3 h-3" strokeWidth={1.5} /> Page_Size
                    </label>
                    <div className="flex bg-slate-200/50 dark:bg-charcoal-800/50 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
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

                  <div className="space-y-3 group">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                      <RectangleVertical className="w-3 h-3" strokeWidth={1.5} /> Orientation
                    </label>
                    <div className="flex bg-slate-200/50 dark:bg-charcoal-800/50 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                      <button onClick={() => handlePdfChange('orientation', 'portrait')} className={segmentedButtonClass(config.orientation === 'portrait')}>PORTRAIT</button>
                      <button onClick={() => handlePdfChange('orientation', 'landscape')} className={segmentedButtonClass(config.orientation === 'landscape')}>LANDSCAPE</button>
                    </div>
                  </div>

                  <div className="space-y-3 group" ref={fitDropdownRef}>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                      <Expand className="w-3 h-3" strokeWidth={1.5} /> Scaling_Mode
                    </label>
                    <div className="relative">
                      <motion.button 
                        onClick={() => setIsFitDropdownOpen(!isFitDropdownOpen)} 
                        whileTap={{ scale: 0.98 }} 
                        className={`
                          w-full flex items-center justify-between 
                          bg-white dark:bg-charcoal-800 
                          text-xs font-mono font-medium text-charcoal-700 dark:text-charcoal-200 
                          rounded-lg px-3 py-2.5 border border-slate-200 dark:border-charcoal-700 
                          focus:border-brand-purple/50 focus:ring-2 focus:ring-brand-purple/10 outline-none 
                          transition-all shadow-sm
                          ${isFitDropdownOpen ? 'border-brand-purple/50 ring-2 ring-brand-purple/10' : ''}
                        `}
                      >
                        <span>{selectedFitLabel}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-charcoal-400 transition-transform ${isFitDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                      </motion.button>
                      
                      <AnimatePresence>
                        {isFitDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -5 }} 
                            className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-lg shadow-xl overflow-hidden"
                          >
                            {fitOptions.map((option) => (
                              <button 
                                key={option.value} 
                                onClick={() => { handlePdfChange('fitMode', option.value as any); setIsFitDropdownOpen(false); }} 
                                className={`
                                  w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors
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
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                        <Scaling className="w-3 h-3" strokeWidth={1.5} /> Margin_Padding
                      </label>
                      <span className="text-[10px] bg-slate-200 dark:bg-charcoal-800 px-2 py-0.5 rounded text-charcoal-600 dark:text-charcoal-300 font-mono font-bold">
                        {config.margin}mm
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={config.margin} 
                      onChange={(e) => handlePdfChange('margin', parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none" 
                    />
                  </div>

                  {/* New Quality Slider */}
                  <div className="space-y-3 group">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                        <Image className="w-3 h-3" strokeWidth={1.5} /> Quality (JPEG)
                      </label>
                      <span className="text-[10px] bg-slate-200 dark:bg-charcoal-800 px-2 py-0.5 rounded text-charcoal-600 dark:text-charcoal-300 font-mono font-bold">
                        {Math.round(config.quality * 100)}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1"
                      value={config.quality} 
                      onChange={(e) => handlePdfChange('quality', parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none" 
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3 group">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                    <Image className="w-3 h-3" strokeWidth={1.5} /> Image_Format
                  </label>
                  <div className="flex bg-slate-200/50 dark:bg-charcoal-800/50 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
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
              )}
        </div>

        {/* Desktop Footer Actions */}
        {!isMobile && (
          <div className="p-6 border-t border-slate-200 dark:border-charcoal-800 bg-white/50 dark:bg-charcoal-850/50">
            {(onZoomIn || showFilmstripToggle) && (
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-2 text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-mono">
                  <ZoomIn className="w-3 h-3" strokeWidth={1.5} /> Viewport_Control
                </label>
                
                <div className="flex items-center gap-2">
                  {onZoomIn && onZoomOut && zoomLevel !== undefined && (
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-charcoal-800 rounded-lg border border-slate-200 dark:border-charcoal-700 shadow-sm flex-1">
                      <motion.button onClick={onZoomOut} disabled={zoomLevel <= 0.5} whileTap={buttonTap} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-500 transition-colors disabled:opacity-30"><ZoomOut size={14} strokeWidth={1.5} /></motion.button>
                      <span className="flex-1 text-center font-mono text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400 select-none">{Math.round(zoomLevel * 100)}%</span>
                      <motion.button onClick={onZoomIn} disabled={zoomLevel >= 4} whileTap={buttonTap} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-charcoal-700 text-charcoal-500 transition-colors disabled:opacity-30"><ZoomIn size={14} strokeWidth={1.5} /></motion.button>
                    </div>
                  )}
                  
                  {showFilmstripToggle && onToggleFilmstrip && (
                    <motion.button
                      whileTap={buttonTap}
                      onClick={onToggleFilmstrip}
                      className={`
                        p-2 rounded-lg border transition-all shadow-sm
                        ${isFilmstripVisible 
                          ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' 
                          : 'bg-white dark:bg-charcoal-800 text-charcoal-500 border-slate-200 dark:border-charcoal-700 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                        }
                      `}
                      title="Toggle Filmstrip"
                    >
                      <PanelBottom size={16} strokeWidth={1.5} />
                    </motion.button>
                  )}
                </div>
              </div>
            )}
            
            {onGenerate && (
              <motion.button 
                onClick={onGenerate} 
                disabled={isGenerating || imageCount === 0} 
                whileTap={buttonTap} 
                className="relative group overflow-hidden w-full rounded-xl px-5 py-4 font-mono font-bold tracking-wider text-white shadow-lg shadow-brand-purple/20 transition-all duration-300 ease-out disabled:opacity-50 disabled:shadow-none bg-charcoal-900 dark:bg-white dark:text-charcoal-900 hover:bg-brand-purple dark:hover:bg-slate-200 text-xs"
              >
                {isGenerating ? (
                  <>
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/5" />
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/10" 
                      initial={{ width: '0%' }} 
                      animate={{ width: `${progress}%` }} 
                      transition={{ duration: 0.2, ease: "linear" }} 
                    />
                  </>
                ) : null}
                <div className="relative flex items-center justify-center gap-2 z-10">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" strokeWidth={1.5} />} 
                  <span>{getActionLabel()}</span>
                </div>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
