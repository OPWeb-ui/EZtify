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
    { id: 'image-to-pdf', label: 'Images → PDF', path: '/images-to-pdf' },
    { id: 'pdf-to-image', label: 'PDF → Images', path: '/pdf-to-images' },
    { id: 'compress-pdf', label: 'Compress PDF', path: '/compress-pdf' },
    { id: 'merge-pdf', label: 'Merge PDF', path: '/merge-pdf' },
    { id: 'split-pdf', label: 'Split PDF', path: '/split-pdf' },
    { id: 'zip-files', label: 'Zip It!', path: '/zip-it' }
  ] as const;

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
      transition={{ duration: 0.5 }}
      className="h-16 flex items-center justify-between px-4 md:px-8 bg-white/60 dark:bg-charcoal-950/80 backdrop-blur-xl border-b border-white/20 dark:border-charcoal-800 absolute top-0 left-0 right-0 z-50 transition-colors duration-300"
    >
      {/* Left: Logo (Links to Home) */}
      <Link 
        to="/"
        className="relative z-10 group" 
      >
        <motion.div 
          className="flex items-center gap-2.5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="transition-transform group-hover:drop-shadow-sm">
             <Logo size="sm" />
          </div>
          <h1 className="font-heading font-bold text-xl tracking-tight text-charcoal-900 dark:text-white transition-colors relative top-[1px]">
            EZ<span className="text-brand-purple">tify</span>
          </h1>
        </motion.div>
      </Link>

      {/* Center: Tools Dropdown */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center" 
        ref={dropdownRef}
      >
        <motion.button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative overflow-hidden group
            h-10 px-4 rounded-xl font-heading font-bold text-sm transition-all whitespace-nowrap
            flex items-center gap-2 border shadow-sm
            ${isDropdownOpen 
              ? 'bg-brand-purple/5 border-brand-purple/20 text-brand-purple' 
              : 'bg-white/60 dark:bg-charcoal-800/80 border-slate-200 dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:border-brand-purple/30'}
          `}
        >
          <span className="relative z-10">Select Tool</span>
          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 opacity-60"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-1/2 mt-3 w-56 bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-charcoal-800 overflow-hidden py-1.5 origin-top"
              style={{ x: "-50%" }}
            >
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 dark:text-charcoal-500 font-bold px-4 py-2 border-b border-slate-50 dark:border-charcoal-800 mb-1">
                Select Tool
              </div>
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.path)}
                  whileHover={{ backgroundColor: "rgba(109, 40, 217, 0.05)", x: 4 }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors
                    ${currentMode === tool.id 
                      ? 'bg-brand-purple/5 dark:bg-brand-purple/10 text-brand-purple' 
                      : 'text-charcoal-600 dark:text-charcoal-300 dark:hover:text-white'}
                  `}
                >
                  {tool.label}
                  {currentMode === tool.id && <Check className="w-4 h-4" />}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Share & Theme */}
      <div className="flex items-center gap-2 md:gap-3 relative z-10">
        <Link 
          to="/about"
          className="hidden md:block text-sm font-bold text-charcoal-600 dark:text-charcoal-300 transition-colors mr-2"
        >
          <motion.span
             whileHover={{ color: "#6D28D9", scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="inline-block"
          >
            About
          </motion.span>
        </Link>
        <motion.button
          onClick={toggleTheme}
          whileTap={buttonTap}
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400 border border-transparent hover:border-slate-200 dark:hover:border-charcoal-700 transition-all"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>
        <ShareButton />
      </div>
    </motion.header>
  );
};