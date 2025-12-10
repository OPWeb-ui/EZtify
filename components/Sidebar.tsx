import React, { useState, useRef, useEffect } from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { Settings, FileText, Maximize, Scissors, Layout, Image as ImageIcon, ChevronDown, Check, ZoomIn, ZoomOut, Plus, Download, Layers, Database, Loader2 } from 'lucide-react';
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
  totalSize = 0,
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const optionButtonClass = (isActive: boolean) => `
    flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all shadow-sm outline-none
    flex items-center justify-center
    ${isActive 
      ? 'bg-brand-purple text-white border-brand-purple shadow-brand-purple/20' 
      : 'bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-brand-purple/30 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
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
        fixed inset-y-0 left-0 z-30 w-full md:w-80 glass-panel border-r border-pastel-border dark:border-charcoal-800
        dark:bg-charcoal-900
        transform transition-transform duration-300 ease-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-5 md:p-6 md:pt-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-8 md:mb-10 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl md:text-2xl font-heading font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            {mode === 'image-to-pdf' ? 'Studio Settings' : 'Export Settings'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3">
          {mode === 'image-to-pdf' ? (
            <div className="space-y-7 md:space-y-8">
              <div className="space-y-3 group">
                <Tooltip content="Choose standard paper sizes or auto-match image." side="top">
                  <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                    <FileText className="w-4 h-4" /> Page Size
                  </label>
                </Tooltip>
                <div className="grid grid-cols-3 gap-2">
                  {['auto', 'a4', 'letter'].map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => handlePdfChange('pageSize', size as any)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={buttonTap}
                      className={optionButtonClass(config.pageSize === size)}
                    >
                      {size.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors">
                  <Layout className="w-4 h-4" /> Orientation
                </label>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handlePdfChange('orientation', 'portrait')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={buttonTap}
                    className={optionButtonClass(config.orientation === 'portrait')}
                  >
                    Portrait
                  </motion.button>
                  <motion.button
                    onClick={() => handlePdfChange('orientation', 'landscape')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={buttonTap}
                    className={optionButtonClass(config.orientation === 'landscape')}
                  >
                    Landscape
                  </motion.button>
                </div>
              </div>

              <div className="space-y-3 group" ref={fitDropdownRef}>
                <Tooltip content="Control how images fit on the page." side="top">
                   <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                     <Maximize className="w-4 h-4" /> Fit Mode
                   </label>
                </Tooltip>
                <div className="relative">
                  <motion.button
                    onClick={() => setIsFitDropdownOpen(!isFitDropdownOpen)}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    className={`
                      w-full flex items-center justify-between
                      bg-white dark:bg-charcoal-800 text-sm font-bold text-charcoal-700 dark:text-charcoal-300 
                      rounded-xl px-4 py-3 border border-slate-200 dark:border-charcoal-700 
                      focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none 
                      transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-charcoal-700
                      ${isFitDropdownOpen ? 'border-brand-purple/50 ring-4 ring-brand-purple/10' : ''}
                    `}
                  >
                    <span>{selectedFitLabel}</span>
                    <motion.div
                      animate={{ rotate: isFitDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-charcoal-500 dark:text-charcoal-500" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isFitDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl shadow-xl shadow-brand-purple/10 p-1.5 overflow-hidden origin-top"
                      >
                        {fitOptions.map((option) => (
                          <motion.button
                            key={option.value}
                            onClick={() => {
                              handlePdfChange('fitMode', option.value as any);
                              setIsFitDropdownOpen(false);
                            }}
                            className={`
                              w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 last:mb-0
                              ${config.fitMode === option.value
                                ? 'bg-brand-purple/10 text-brand-purple'
                                : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'}
                            `}
                          >
                            {option.label}
                            {config.fitMode === option.value && <Check className="w-4 h-4" />}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-charcoal-800/50 my-4" />

              <div className="space-y-4 group">
                <div className="flex justify-between items-center">
                  <Tooltip content="Add white space around your images." side="top">
                     <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help">
                       <Scissors className="w-4 h-4" /> Margin
                     </label>
                  </Tooltip>
                  <span className="text-xs bg-slate-100 dark:bg-charcoal-800 px-2.5 py-1 rounded-lg text-charcoal-600 dark:text-charcoal-400 font-mono font-bold border border-slate-200 dark:border-charcoal-700">{config.margin}mm</span>
                </div>
                <motion.input
                  type="range"
                  min="0"
                  max="50"
                  whileHover={{ scale: 1.01 }}
                  value={config.margin}
                  onChange={(e) => handlePdfChange('margin', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              <div className="space-y-4 group">
                <div className="flex justify-between items-center">
                  <Tooltip content="Adjust compression to reduce file size." side="top">
                    <label className="text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help">Quality</label>
                  </Tooltip>
                  <span className="text-xs bg-slate-100 dark:bg-charcoal-800 px-2.5 py-1 rounded-lg text-charcoal-600 dark:text-charcoal-400 font-mono font-bold border border-slate-200 dark:border-charcoal-700">{Math.round(config.quality * 100)}%</span>
                </div>
                <motion.input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  whileHover={{ scale: 1.01 }}
                  value={config.quality}
                  onChange={(e) => handlePdfChange('quality', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-7 md:space-y-8">
              <div className="space-y-3 group">
                <Tooltip content="Choose image file type." side="top">
                  <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help w-fit">
                    <ImageIcon className="w-4 h-4" /> Output Format
                  </label>
                </Tooltip>
                <div className="grid grid-cols-2 gap-3">
                  {(['png', 'jpeg'] as ImageFormat[]).map((fmt) => (
                    <motion.button
                      key={fmt}
                      onClick={() => handleExportChange('format', fmt)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={buttonTap}
                      className={optionButtonClass(exportConfig.format === fmt)}
                    >
                      {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {exportConfig.format === 'jpeg' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="pt-2 space-y-4 group">
                      <div className="flex justify-between items-center">
                        <Tooltip content="Lower quality for smaller file size." side="top">
                          <label className="text-xs md:text-sm font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide group-hover:text-brand-purple transition-colors cursor-help">JPG Quality</label>
                        </Tooltip>
                        <span className="text-xs bg-slate-100 dark:bg-charcoal-800 px-2.5 py-1 rounded-lg text-charcoal-600 dark:text-charcoal-400 font-mono font-bold border border-slate-200 dark:border-charcoal-700">
                          {Math.round(exportConfig.quality * 100)}%
                        </span>
                      </div>
                      <motion.input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        whileHover={{ scale: 1.01 }}
                        value={exportConfig.quality}
                        onChange={(e) => handleExportChange('quality', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 transition-all outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {mode === 'image-to-pdf' && (
            <div className="mt-8 p-4 bg-brand-purple/5 dark:bg-brand-purple/10 rounded-2xl border border-brand-purple/10 dark:border-brand-purple/20 text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed shadow-sm">
              <p className="font-bold text-brand-purple mb-1">Pro Tip:</p>
              Use "Auto" page size if you want the PDF pages to exactly match your original image dimensions.
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="flex-shrink-0 pt-6 mt-auto space-y-4 border-t border-slate-200 dark:border-charcoal-800">
            {onZoomIn && onZoomOut && zoomLevel !== undefined && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wide">
                  <ZoomIn className="w-4 h-4" /> View
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700">
                  <motion.button onClick={onZoomOut} disabled={zoomLevel <= 0.5} whileTap={buttonTap} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom Out">
                    <ZoomOut size={16} />
                  </motion.button>
                  <span className="flex-1 text-center font-mono text-xs font-bold text-charcoal-600 dark:text-charcoal-400 select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <motion.button onClick={onZoomIn} disabled={zoomLevel >= 4} whileTap={buttonTap} className="p-2 rounded-lg text-charcoal-500 hover:text-brand-purple hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-30" title="Zoom In">
                    <ZoomIn size={16} />
                  </motion.button>
                </div>
              </div>
            )}
            
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs space-y-2">
              <div className="flex justify-between items-center text-charcoal-500 dark:text-charcoal-400 font-medium">
                <span className="flex items-center gap-2"><Layers size={14} /> Files</span>
                <span className="font-mono font-bold text-charcoal-700 dark:text-charcoal-300">{imageCount}</span>
              </div>
              <div className="flex justify-between items-center text-charcoal-500 dark:text-charcoal-400 font-medium">
                <span className="flex items-center gap-2"><Database size={14} /> Total Size</span>
                <span className="font-mono font-bold text-charcoal-700 dark:text-charcoal-300">{formatSize(totalSize)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {onAddFiles && (
                <motion.button
                  onClick={onAddFiles} disabled={isGenerating} whileTap={buttonTap} whileHover={{ scale: 1.02 }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border border-slate-200 dark:border-charcoal-700 shadow-sm hover:bg-slate-50 dark:hover:bg-charcoal-700 hover:text-brand-purple hover:border-brand-purple/30 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> <span>Add More</span>
                </motion.button>
              )}
              {onGenerate && (
                <motion.button
                  onClick={onGenerate} disabled={isGenerating || imageCount === 0} whileTap={buttonTap} whileHover={{ scale: 1.02 }}
                  className="relative group overflow-hidden w-full rounded-xl px-5 py-4 font-heading font-bold tracking-wide text-white shadow-lg shadow-brand-green/30 transition-all duration-300 ease-out disabled:opacity-50 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <div className="absolute inset-0 bg-slate-200 dark:bg-charcoal-800" />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-green via-brand-greenHover to-brand-green"
                        initial={{ width: '0%' }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2, ease: "linear" }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-greenHover to-brand-green" />
                  )}
                  <div className="relative flex items-center justify-center gap-2 z-10 text-white text-sm">
                    {getActionIcon()} <span>{getActionLabel()}</span>
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