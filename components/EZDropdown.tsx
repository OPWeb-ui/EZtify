
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  label?: string;
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside or scrolling
  useEffect(() => {
    const handleDismiss = (event: Event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const menu = document.getElementById(`ez-dropdown-${label || 'menu'}`);
        if (menu && menu.contains(event.target as Node)) {
            return;
        }
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const menuHeight = Math.min(options.length * 36 + 10, 240);

            let newPlacement: 'bottom' | 'top' = 'bottom';
            if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                newPlacement = 'top';
            }

            setCoords({
                top: newPlacement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
                left: rect.left,
                width: rect.width
            });
            setPlacement(newPlacement);
        }
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleDismiss);
      document.addEventListener('touchstart', handleDismiss);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', () => setIsOpen(false), { capture: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleDismiss);
      document.removeEventListener('touchstart', handleDismiss);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', () => setIsOpen(false), { capture: true });
    };
  }, [isOpen, options.length, label]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-charcoal-500/80 dark:text-slate-400/80 uppercase tracking-widest font-mono pl-0.5 mb-2">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className={`
          flex items-center justify-between gap-2 px-3
          h-10
          bg-white dark:bg-charcoal-800 
          border border-slate-200 dark:border-charcoal-700 
          rounded-xl text-sm font-medium text-charcoal-700 dark:text-slate-200 
          hover:bg-slate-50 dark:hover:bg-charcoal-700 
          focus:outline-none focus:ring-2 focus:ring-[var(--ez-accent)]/20 transition-all
          ${fullWidth ? 'w-full' : 'min-w-[140px]'}
        `}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          className={`text-charcoal-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={`ez-dropdown-${label || 'menu'}`}
              initial={{ opacity: 0, y: placement === 'bottom' ? -6 : 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === 'bottom' ? -6 : 6, scale: 0.98 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              style={{
                  position: 'fixed',
                  top: placement === 'bottom' ? coords.top : 'auto',
                  bottom: placement === 'top' ? (window.innerHeight - coords.top) : 'auto',
                  left: coords.left,
                  width: coords.width,
                  zIndex: 9999
              }}
              className={`
                bg-white dark:bg-charcoal-800 
                rounded-xl shadow-xl shadow-[var(--ez-accent-soft)]
                border border-slate-200 dark:border-charcoal-700 
                overflow-hidden ring-1 ring-black/5 focus:outline-none py-1
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
                          ? 'bg-[var(--ez-accent-soft)] text-[var(--ez-accent)] font-semibold' 
                          : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                        }
                      `}
                      style={isSelected ? { backgroundColor: 'var(--ez-accent-soft)', color: 'var(--ez-accent)' } : {}}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check size={14} className="flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
