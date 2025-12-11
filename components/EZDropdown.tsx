
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface EZDropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (value: any) => void;
  label?: string; // Optional label displayed before the value or outside
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
}

export const EZDropdown: React.FC<EZDropdownProps> = ({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select',
  className = '',
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div 
      className={`relative inline-block text-left ${fullWidth ? 'w-full' : ''}`} 
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-3
          h-10 /* Enforce standard 40px height */
          bg-white dark:bg-charcoal-800 
          border border-slate-200 dark:border-charcoal-700 
          rounded-xl text-sm font-medium text-charcoal-700 dark:text-slate-200 
          hover:bg-slate-50 dark:hover:bg-charcoal-700 
          focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all
          ${fullWidth ? 'w-full' : 'min-w-[140px]'}
          ${className}
        `}
      >
        <span className="truncate flex items-center gap-2">
          {label && <span className="opacity-60 font-normal text-xs uppercase tracking-wider">{label}:</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown 
          size={16} 
          className={`text-charcoal-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`
              absolute z-50 mt-1 origin-top-left 
              bg-white dark:bg-charcoal-800 
              rounded-xl shadow-xl shadow-brand-purple/5
              border border-slate-100 dark:border-charcoal-700 
              overflow-hidden ring-1 ring-black/5 focus:outline-none py-1
              ${fullWidth ? 'w-full' : 'w-auto min-w-full'} /* Ensure min-width matches trigger */
            `}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar px-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors mb-0.5
                      ${isSelected 
                        ? 'bg-brand-purple/5 text-brand-purple font-semibold' 
                        : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                      }
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check size={14} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
