
import React from 'react';
import { PdfConfig, AppMode, ExportConfig, ImageFormat } from '../types';
import { X, Download, Settings } from 'lucide-react';
import { EZDropdown, DropdownOption } from './EZDropdown';
import { EZSlider } from './EZSlider';
import { EZSegmentedControl } from './EZSegmentedControl';
import { EZButton } from './EZButton';
import { IconBox } from './IconBox';

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

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { value: 'a4', label: 'A4 (Standard)' },
  { value: 'letter', label: 'US Letter' },
  { value: 'auto', label: 'Auto (Match Image)' },
];

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
  
  // Clean container class for the panel internals
  // This component now represents the CONTENT of the right panel.
  // The layout wrapper (floating etc) is handled by the page for max flexibility, 
  // or used as 'embedded' inside other containers.
  
  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-[#121212] w-full">
      {/* Header */}
      {!isEmbedded && (
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
             <IconBox icon={<Settings />} size="xs" variant="ghost" />
             <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-charcoal-500/80 dark:text-slate-400/80">Properties</span>
          </div>
          {isMobile && onClose && (
            <button onClick={onClose} className="p-2 text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Body - 24px Padding (p-6) */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isEmbedded ? 'p-0' : 'p-6'} space-y-8`}>
        
        {/* --- Image to PDF Settings --- */}
        {mode === 'image-to-pdf' && (
          <>
            <EZDropdown
              label="Page Size"
              value={config.pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={(val) => handlePdfChange('pageSize', val)}
              fullWidth
            />

            <EZSegmentedControl
              label="Orientation"
              value={config.orientation}
              options={[
                { value: 'portrait', label: 'Portrait' },
                { value: 'landscape', label: 'Landscape' }
              ]}
              onChange={(val) => handlePdfChange('orientation', val)}
            />

            <EZSlider
              label="Margin"
              value={config.margin}
              min={0}
              max={50}
              step={1}
              suffix="mm"
              onChange={(val) => handlePdfChange('margin', val)}
            />
          </>
        )}

        {/* --- PDF to Image Settings --- */}
        {mode === 'pdf-to-image' && (
          <>
             <EZSegmentedControl
                label="Format"
                value={exportConfig.format}
                options={[
                  { value: 'jpeg', label: 'JPG' },
                  { value: 'png', label: 'PNG' }
                ]}
                onChange={(val) => handleExportChange('format', val)}
             />

             <EZSegmentedControl
                label="Resolution"
                value={exportConfig.scale}
                options={[
                  { value: 1, label: 'Standard' },
                  { value: 2, label: 'High' },
                  { value: 3, label: 'Ultra' }
                ]}
                onChange={(val) => handleExportChange('scale', val)}
             />

             {exportConfig.format === 'jpeg' && (
                <EZSlider
                  label="Quality"
                  value={exportConfig.quality}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  suffix=""
                  onChange={(val) => handleExportChange('quality', val)}
                />
             )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!isEmbedded && onGenerate && (
        <div className="p-6 border-t border-slate-200/60 dark:border-white/10 shrink-0">
          <EZButton
            variant="primary"
            fullWidth
            onClick={onGenerate}
            isLoading={isGenerating}
            size="lg"
            icon={!isGenerating && <Download size={20} />}
          >
            {isGenerating ? 'Processing...' : 'Export'}
          </EZButton>
        </div>
      )}
    </div>
  );
};
