
import React from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  mode: AppMode;
  config: PdfConfig;
  exportConfig: ExportConfig;
  onConfigChange: (newConfig: PdfConfig) => void;
  onExportConfigChange: (newConfig: ExportConfig) => void;
  isOpen: boolean;
  isMobile: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  onClose?: () => void;
  variant?: 'default' | 'embedded';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  mode, config, exportConfig, onConfigChange, onExportConfigChange,
  isOpen, isMobile, onClose, onGenerate, isGenerating, variant = 'default' 
}) => {
  
  if (!isOpen) return null;

  const handlePdfChange = <K extends keyof PdfConfig>(key: K, value: PdfConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleExportChange = <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
    onExportConfigChange({ ...exportConfig, [key]: value });
  };

  const isEmbedded = variant === 'embedded';
  const containerClass = isEmbedded
    ? 'w-full h-full bg-transparent' 
    : isMobile 
      ? 'fixed inset-0 z-50 flex flex-col bg-white dark:bg-charcoal-900' 
      : 'w-72 shrink-0 relative flex flex-col bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800';

  // Shared Animation Props
  const segmentBg = (
    <motion.div 
      layoutId="segment-active"
      className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg z-0"
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
    />
  );

  return (
    <aside className={containerClass}>
      {!isEmbedded && (
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-charcoal-800 shrink-0 bg-slate-50 dark:bg-charcoal-850">
          <span className="text-xs font-bold uppercase tracking-wide text-charcoal-600 dark:text-slate-300">Properties</span>
          {isMobile && onClose && (
            <button onClick={onClose} className="p-2 text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'p-0' : 'p-4'} space-y-6`}>
        
        {/* --- Image to PDF Settings --- */}
        {mode === 'image-to-pdf' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider pl-1">Page Size</label>
              <div className="relative">
                <select 
                  value={config.pageSize}
                  onChange={(e) => handlePdfChange('pageSize', e.target.value as any)}
                  className="w-full h-10 px-3 bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl text-sm font-medium text-charcoal-900 dark:text-slate-200 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="a4">A4 (Standard)</option>
                  <option value="letter">US Letter</option>
                  <option value="auto">Auto (Match Image)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider pl-1">Orientation</label>
              <div className="flex bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 p-1 relative isolate">
                {['portrait', 'landscape'].map((opt) => {
                  const isActive = config.orientation === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handlePdfChange('orientation', opt as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors relative z-10 ${isActive ? 'text-brand-purple' : 'text-charcoal-500 dark:text-slate-400 hover:text-charcoal-700 dark:hover:text-slate-200'}`}
                    >
                      {opt}
                      {isActive && <motion.div layoutId="orientation-bg" className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider">Margin</label>
                <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-slate-300 bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded border border-slate-200 dark:border-charcoal-700">{config.margin}mm</span>
              </div>
              <input 
                type="range" 
                min="0" max="50" 
                value={config.margin}
                onChange={(e) => handlePdfChange('margin', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-brand-purple"
              />
            </div>
          </>
        )}

        {/* --- PDF to Image Settings --- */}
        {mode === 'pdf-to-image' && (
          <>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                   Output Format
                </label>
                <div className="flex bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 p-1 relative isolate">
                  {(['jpeg', 'png'] as ImageFormat[]).map((fmt) => {
                    const isActive = exportConfig.format === fmt;
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleExportChange('format', fmt)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-colors relative z-10 ${isActive ? 'text-brand-purple' : 'text-charcoal-500 dark:text-slate-400 hover:text-charcoal-700 dark:hover:text-slate-200'}`}
                      >
                        {fmt === 'jpeg' ? 'JPG' : 'PNG'}
                        {isActive && <motion.div layoutId="format-bg" className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      </button>
                    );
                  })}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                   Resolution
                </label>
                <div className="flex bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 p-1 relative isolate">
                  {[1, 2, 3].map((scale) => {
                    const isActive = exportConfig.scale === scale;
                    return (
                      <button
                        key={scale}
                        onClick={() => handleExportChange('scale', scale)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors relative z-10 ${isActive ? 'text-brand-purple' : 'text-charcoal-500 dark:text-slate-400 hover:text-charcoal-700 dark:hover:text-slate-200'}`}
                      >
                        {scale}x
                        {isActive && <motion.div layoutId="res-bg" className="absolute inset-0 bg-white dark:bg-charcoal-700 shadow-sm rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-charcoal-400 dark:text-charcoal-500 px-1 pt-1">
                   {exportConfig.scale === 1 ? 'Standard (72 DPI)' : exportConfig.scale === 2 ? 'High (144 DPI)' : 'Ultra (216 DPI)'}
                </p>
             </div>

             {exportConfig.format === 'jpeg' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       Quality
                    </label>
                    <span className="text-[10px] font-mono font-bold text-charcoal-600 dark:text-slate-300 bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded border border-slate-200 dark:border-charcoal-700">
                       {Math.round(exportConfig.quality * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" max="1.0" step="0.1"
                    value={exportConfig.quality}
                    onChange={(e) => handleExportChange('quality', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                  />
                </div>
             )}
          </>
        )}
      </div>

      {!isEmbedded && onGenerate && (
        <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 shrink-0 bg-slate-50 dark:bg-charcoal-900">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full h-12 bg-brand-purple text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-purpleDark transition-all disabled:opacity-50 shadow-md shadow-brand-purple/20"
          >
            {isGenerating ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Export</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      )}
    </aside>
  );
};
