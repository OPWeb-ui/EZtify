
import React from 'react';
import { motion } from 'framer-motion';
import { IconBox } from './IconBox';
import { Settings } from 'lucide-react';

interface FloatingPanelProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ 
  children, 
  title = "Configuration", 
  footer,
  className = ''
}) => {
  return (
    <div className={`w-96 shrink-0 z-20 p-4 h-full flex flex-col pointer-events-none ${className}`}>
      <div className="flex-1 bg-nd-surface rounded-3xl shadow-2xl border border-nd-border flex flex-col overflow-hidden pointer-events-auto">
        
        {/* Header */}
        {(title) && (
          <div className="h-16 border-b border-nd-border flex items-center px-6 shrink-0 bg-nd-subtle/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-nd-secondary">
              {title}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-nd-border shrink-0 bg-nd-subtle/50 space-y-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
