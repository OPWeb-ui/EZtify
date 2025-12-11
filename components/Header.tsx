import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { ShareButton } from './ShareButton';
import { AppMode } from '../types';
import { ChevronDown, Check, Moon, Sun, Layers, ImageIcon, FileText, Minimize2, FileOutput, Scissors, FolderArchive, ArrowLeftRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const tools = [
    { id: 'image-to-pdf', label: 'Images to PDF', path: '/images-to-pdf', icon: <Layers size={18} /> },
    { id: 'pdf-to-image', label: 'PDF to Images', path: '/pdf-to-images', icon: <ImageIcon size={18} /> },
    { id: 'word-to-pdf', label: 'Word to PDF', path: '/word-to-pdf', icon: <FileText size={18} /> },
    { id: 'compress-pdf', label: 'Compress PDF', path: '/compress-pdf', icon: <Minimize2 size={18} /> },
    { id: 'merge-pdf', label: 'Merge PDF', path: '/merge-pdf', icon: <FileOutput size={18} /> },
    { id: 'split-pdf', label: 'Split PDF', path: '/split-pdf', icon: <Scissors size={18} /> },
    { id: 'reorder-pdf', label: 'Reorder PDF', path: '/reorder-pdf', icon: <ArrowLeftRight size={18} /> },
    { id: 'zip-files', label: 'Zip Files', path: '/zip-it', icon: <FolderArchive size={18} /> },
    { id: 'pdf-viewer', label: 'PDF Viewer', path: '/pdf-viewer', icon: <Eye size={18} /> }
  ] as const;

  const activeToolLabel = tools.find(t => t.id === currentMode)?.label || 'Tools';

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
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-b border-slate-100 dark:border-white/5 pt-safe transition-colors duration-300"
      >
        {/* LEFT: Logo */}
        <div className="flex items-center gap-4 relative z-30">
          <Link 
            to="/"
            className="flex items-center gap-2.5 group outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-brand-purple/50 p-1 -ml-1 ui-element"
            aria-label="EZtify Home"
          >
            <div className="transition-transform group-hover:scale-105 duration-200">
               <Logo size="sm" />
            </div>
            <h1 className="font-heading font-bold text-xl tracking-tight text-charcoal-900 dark:text-white relative top-[1px]">
              EZ<span className="text-brand-purple">tify</span>
            </h1>
          </Link>
        </div>

        {/* CENTER: Tool Selector */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pt-safe" 
          ref={dropdownRef}
        >
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileTap={{ scale: 0.95 }}
              aria-label="Select Tool"
              className={`
                group flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold transition-all duration-200 ease-out
                border outline-none ui-element
                ${isDropdownOpen 
                  ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 border-transparent shadow-layer-2' 
                  : 'bg-white dark:bg-charcoal-850 border-slate-200 dark:border-white/10 text-charcoal-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 shadow-layer-1'
                }
              `}
            >
              <span className="truncate max-w-[140px] md:max-w-none tracking-tight">{activeToolLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-1/2 mt-3 w-64 bg-white dark:bg-charcoal-850 rounded-2xl shadow-layer-3 dark:shadow-layer-dark-3 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden origin-top"
                  style={{ x: "-50%" }}
                >
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.path)}
                        className={`
                          w-full flex items-center justify-between px-3 py-3 text-sm font-semibold transition-colors text-left outline-none relative rounded-lg
                          ${currentMode === tool.id 
                            ? 'text-brand-purple bg-brand-purple/5' 
                            : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                           <span className={currentMode === tool.id ? 'text-brand-purple' : 'text-charcoal-400 dark:text-slate-500'}>
                              {tool.icon}
                           </span>
                           <span>{tool.label}</span>
                        </div>
                        {currentMode === tool.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 md:gap-3 relative z-30">
          <Link 
            to="/about"
            className="hidden md:flex items-center h-9 px-3 rounded-full text-sm font-bold text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white transition-colors"
          >
            About
          </Link>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ui-element"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.button>
          <ShareButton />
        </div>
      </motion.header>
      
      {/* Backdrop for menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal-950/20 backdrop-blur-none z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};