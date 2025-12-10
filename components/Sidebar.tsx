import React, { useState, useRef, useEffect } from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { Settings, FileText, Maximize, Scissors, Layout, Image as ImageIcon, ChevronDown, Check, ZoomIn, ZoomOut, Plus, Download, Loader2 } from 'lucide-react';
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
  status
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
      if (status) return `${status} ${progress > 0 && progress < 100 ? `(${progress}%)` : ''}`.trim();
      if (progress >= 100) return 'Saving...';
      return `Processing... (${progress}%)`;
    }
    if (mode === 'image-to-pdf') return 'Convert & Download';
    if (mode === 'pdf-to-image') return 'Download Images';
    return 'Download';
  };

  const getActionIcon = () => {
    if (isGenerating) return <Loader2 className="w-5 h-5 animate-spin" />;
    return <Download className="w-5 h-5 group-hover:animate-bounce" />;
  };

  // OLED Compatible Segmented Controls - Updated for Softer Look
  const segmentedButtonClass = (isActive: boolean) => `
    flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 tracking-wide
    ${isActive
      ? 'bg-white dark:bg-charcoal-800 text-brand-purple shadow-sm ring-1 ring-slate-100 dark:ring-white/5'
      : 'text-slate-600 dark:text-charcoal-400 hover:bg-white/60 dark:hover:bg-charcoal-800/60 hover:text-slate-700 dark:hover:text-charcoal-200'
    }
  `;

  const fitOptions = [
    { value: 'contain', label: 'Contain (Whole Image)' },
    { value: 'cover', label: 'Cover (Fill Page)' },
    { value: 'fill', label: 'Stretch to Fill' },
  ];

  const selectedFitLabel = fitOptions.find(o => o.value === config.fitMode)?.label || 'Contain';

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-30 w-full md:w-80 
        bg-white dark:bg-charcoal-900
        border-r border-slate-200/60 dark:border-white/5
        transform transition-transform duration-300 ease-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full shadow-2xl md:shadow-none
      `}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Settings Content */}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-8 md:mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shadow-sm shadow-brand-purple/10">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-heading font-extrabold text-charcoal-900 dark:text-charcoal-200 tracking-tight">
              {mode === 'image-to-pdf' ? 'Studio Settings' : 'Export Settings'}
            </h2>
          </div>
          
          <div className="space-y-6">
              {mode === 'image-to-pdf' ? (
                <>
                  <div className="space-y-3 group">
                    <Tooltip content="Use 'Auto' to match original image dimensions." side="top">
                      <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                        <FileText className="w-4 h-4" /> Page Size
                      </label>
                    </Tooltip>
                    <div className="flex bg-slate-100 dark:bg-charcoal-950 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
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
                    <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors">
                      <Layout className="w-4 h-4" /> Orientation
                    </label>
                    <div className="flex bg-slate-100 dark:bg-charcoal-950 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                      <button onClick={() => handlePdfChange('orientation', 'portrait')} className={segmentedButtonClass(config.orientation === 'portrait')}>Portrait</button>
                      <button onClick={() => handlePdfChange('orientation', 'landscape')} className={segmentedButtonClass(config.orientation === 'landscape')}>Landscape</button>
                    </div>
                  </div>

                  <div className="space-y-3 group" ref={fitDropdownRef}>
                    <Tooltip content="Control how images scale within the page." side="top">
                        <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                          <Maximize className="w-4 h-4" /> Fit Mode
                        </label>
                    </Tooltip>
                    <div className="relative">
                      <motion.button 
                        onClick={() => setIsFitDropdownOpen(!isFitDropdownOpen)} 
                        whileTap={{ scale: 0.98 }} 
                        className={`
                          w-full flex items-center justify-between 
                          bg-white dark:bg-charcoal-800 
                          text-sm font-medium text-slate-700 dark:text-charcoal-300 
                          rounded-xl px-4 py-3 border border-slate-200 dark:border-white/5 
                          focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/5 outline-none 
                          transition-all shadow-sm hover:border-slate-300 dark:hover:border-charcoal-600
                          ${isFitDropdownOpen ? 'border-brand-purple/50 ring-4 ring-brand-purple/5' : ''}
                        `}
                      >
                        <span>{selectedFitLabel}</span>
                        <motion.div animate={{ rotate: isFitDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-charcoal-500" />
                        </motion.div>
                      </motion.button>
                      
                      <AnimatePresence>
                        {isFitDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            transition={{ duration: 0.2 }} 
                            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl shadow-xl shadow-brand-purple/5 p-1.5 overflow-hidden origin-top"
                          >
                            {fitOptions.map((option) => (
                              <button 
                                key={option.value} 
                                onClick={() => { handlePdfChange('fitMode', option.value as any); setIsFitDropdownOpen(false); }} 
                                className={`
                                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 last:mb-0
                                  ${config.fitMode === option.value 
                                    ? 'bg-brand-purple/5 text-brand-purple' 
                                    : 'text-slate-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
                                `}
                              >
                                {option.label}
                                {config.fitMode === option.value && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-4 group">
                    <div className="flex justify-between items-center">
                      <Tooltip content="Add white space around your images." side="top">
                        <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help">
                          <Scissors className="w-4 h-4" /> Margin
                        </label>
                      </Tooltip>
                      <span className="text-xs bg-slate-100 dark:bg-charcoal-950 px-2.5 py-1 rounded-lg text-slate-600 dark:text-charcoal-400 font-mono font-bold border border-slate-200 dark:border-white/5">
                        {config.margin}mm
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={config.margin} 
                      onChange={(e) => handlePdfChange('margin', parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none focus:ring-2 focus:ring-brand-purple/30" 
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3 group">
                  <Tooltip content="Choose image file type." side="top">
                    <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                      <ImageIcon className="w-4 h-4" /> Output Format
                    </label>
                  </Tooltip>
                  <div className="flex bg-slate-100 dark:bg-charcoal-950 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
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
        </div>

        {/* Desktop Footer Actions */}
        {!isMobile && (
          <div className="p-5 md:p-6 space-y-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-charcoal-900/50">
            {onZoomIn && onZoomOut && zoomLevel !== undefined && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-charcoal-500 uppercase tracking-wide">
                  <ZoomIn className="w-4 h-4" /> View Scale
                </label>
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <motion.button onClick={onZoomOut} disabled={zoomLevel <= 0.5} whileTap={buttonTap} className="p-2 rounded-lg text-slate-500 hover:text-brand-purple hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom Out"><ZoomOut size={16} /></motion.button>
                  <span className="flex-1 text-center font-mono text-xs font-bold text-slate-600 dark:text-charcoal-400 select-none">{Math.round(zoomLevel * 100)}%</span>
                  <motion.button onClick={onZoomIn} disabled={zoomLevel >= 4} whileTap={buttonTap} className="p-2 rounded-lg text-slate-500 hover:text-brand-purple hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom In"><ZoomIn size={16} /></motion.button>
                </div>
              </div>
            )}
            
            <div className="space-y-3 pt-2">
              {onGenerate && (
                <motion.button 
                  onClick={onGenerate} 
                  disabled={isGenerating || imageCount === 0} 
                  whileTap={buttonTap} 
                  whileHover={{ scale: 1.02 }} 
                  className="relative group overflow-hidden w-full rounded-xl px-5 py-4 font-heading font-bold tracking-wide text-white shadow-xl shadow-brand-green/20 hover:shadow-brand-green/30 transition-all duration-300 ease-out disabled:opacity-50 disabled:shadow-none bg-brand-green"
                >
                  {isGenerating ? (
                    <>
                      <div className="absolute inset-0 bg-slate-900/10" />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-white/20" 
                        initial={{ width: '0%' }} 
                        animate={{ width: `${progress}%` }} 
                        transition={{ duration: 0.2, ease: "linear" }} 
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="relative flex items-center justify-center gap-2 z-10 text-white text-sm">
                    {getActionIcon()} 
                    <span>{getActionLabel()}</span>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};