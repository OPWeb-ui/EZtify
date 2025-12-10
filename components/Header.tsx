import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { ShareButton } from './ShareButton';
import { AppMode } from '../types';
import { ChevronDown, Check, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { buttonTap, modalVariants } from '../utils/animations';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const tools = [
    { id: 'image-to-pdf', label: 'Images to PDF', path: '/images-to-pdf' },
    { id: 'pdf-to-image', label: 'PDF to Images', path: '/pdf-to-images' },
    { id: 'compress-pdf', label: 'Compress PDF', path: '/compress-pdf' },
    { id: 'merge-pdf', label: 'Merge PDF', path: '/merge-pdf' },
    { id: 'split-pdf', label: 'Split PDF', path: '/split-pdf' },
    { id: 'zip-files', label: 'Zip Files', path: '/zip-it' }
  ] as const;

  const activeToolLabel = tools.find(t => t.id === currentMode)?.label || 'Select Tool';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolSelect = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-xl shadow-sm dark:shadow-white/5 transition-all duration-300"
    >
      {/* LEFT: Logo */}
      <div className="flex items-center gap-4 relative z-30">
        <Link 
          to="/"
          className="flex items-center gap-2.5 group outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-brand-purple/50 p-1 -ml-1"
          aria-label="EZtify Home"
        >
          <div className="transition-transform group-hover:drop-shadow-sm group-active:scale-95 duration-200">
             <Logo size="sm" />
          </div>
          <h1 className="font-heading font-bold text-xl tracking-tight text-slate-800 dark:text-charcoal-200 relative top-[1px]">
            EZ<span className="text-brand-purple">tify</span>
          </h1>
        </Link>
      </div>

      {/* CENTER: Tool Selector */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20" 
        ref={dropdownRef}
      >
        <div className="relative">
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            whileTap={{ scale: 0.98 }}
            aria-label="Select Tool"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className={`
              group flex items-center gap-2 h-9 px-3 pl-4 rounded-full text-sm font-medium transition-all duration-200 ease-out
              border outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50
              ${isDropdownOpen 
                ? 'bg-white dark:bg-charcoal-800 border-brand-purple/30 text-brand-purple shadow-sm ring-2 ring-brand-purple/10' 
                : 'bg-slate-50/50 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300/60'
              }
            `}
          >
            <span className="truncate max-w-[140px] md:max-w-none tracking-tight">{activeToolLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-full left-1/2 mt-2 w-60 bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/80 border border-slate-100 dark:border-white/5 overflow-hidden py-1.5 origin-top"
                style={{ x: "-50%" }}
                role="menu"
              >
                <div className="px-3 py-1.5 mb-1 border-b border-slate-50 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-charcoal-500">Available Tools</span>
                </div>
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    role="menuitem"
                    onClick={() => handleToolSelect(tool.path)}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors text-left outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-white/5
                      ${currentMode === tool.id 
                        ? 'text-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10' 
                        : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    {tool.label}
                    {currentMode === tool.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 md:gap-3 relative z-30">
        <Link 
          to="/about"
          className="hidden md:flex items-center h-9 px-3 rounded-full text-sm font-medium text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
          aria-label="About EZtify"
        >
          About
        </Link>
        <motion.button
          onClick={toggleTheme}
          whileTap={buttonTap}
          className="w-9 h-9 flex items-center justify-center rounded-full text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>
        <ShareButton />
      </div>
    </motion.header>
  );
};