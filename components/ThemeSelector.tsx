
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';
import { buttonTap } from '../utils/animations';

interface ThemeOption {
  id: Theme;
  label: string;
  icon: React.ReactNode;
}

const options: ThemeOption[] = [
  { id: 'light', label: 'Light', icon: <Sun size={16} /> },
  { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
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

  const activeOption = options.find(o => o.id === theme) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <motion.button
        whileTap={buttonTap}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 outline-none
          ${isOpen 
            ? 'bg-nd-surface border-nd-border text-nd-primary ring-2 ring-nd-primary/10' 
            : 'bg-transparent border-transparent hover:bg-nd-surface text-nd-secondary hover:text-nd-primary'}
        `}
        aria-label="Select Theme"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center">
          {activeOption.icon}
        </span>
        <span className="text-xs font-medium hidden sm:inline-block">
          {activeOption.label}
        </span>
        <ChevronDown 
          size={12} 
          className={`text-nd-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="
              absolute right-0 top-full mt-2 w-32
              bg-white dark:bg-charcoal-900 
              border border-slate-200 dark:border-charcoal-800 
              rounded-xl shadow-xl shadow-black/5 dark:shadow-black/40
              overflow-hidden z-[100]
              p-1.5
            "
          >
            {options.map((option) => {
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                    ${isActive 
                      ? 'bg-slate-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-white' 
                      : 'text-charcoal-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-charcoal-800/50 hover:text-charcoal-900 dark:hover:text-slate-200'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check size={14} className="text-brand-purple" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
