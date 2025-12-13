
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { ShareButton } from './ShareButton';
import { AppMode } from '../types';
import { 
  ChevronDown, Moon, Sun, 
  Terminal, Hash, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { toolCategories, allTools } from '../utils/tool-list';
import { techEase } from '../utils/animations';

interface HeaderProps {
  currentMode: AppMode;
}

export const Header: React.FC<HeaderProps> = ({ currentMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentTool = allTools.find(t => t.id === currentMode);
  
  const breadcrumbs = useMemo(() => {
    if (location.pathname === '/' || location.pathname === '') return ['~', 'root'];
    if (location.pathname === '/about') return ['~', 'system', 'about'];
    return ['~', 'bin', currentTool?.id || 'unknown'];
  }, [location.pathname, currentTool]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsDropdownOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleToolSelect = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: techEase, duration: 0.4 }}
        className="h-16 fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-charcoal-950/90 backdrop-blur-md border-b border-slate-200 dark:border-charcoal-800 transition-colors duration-300"
      >
        <div className="relative h-full max-w-[1920px] mx-auto px-4 lg:px-6 flex items-center justify-between">
          
          {/* LEFT: Branding */}
          <div className="flex items-center gap-6 shrink-0 z-20">
            <Link 
              to="/"
              className="flex items-center gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50 rounded-md"
              aria-label="EZtify Console"
            >
              <div className="relative">
                 <Logo size="sm" />
                 <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-charcoal-900 animate-pulse" />
              </div>
              <div className="flex flex-col justify-center">
                {/* Hide text on mobile to save space for the dropdown */}
                <h1 className="hidden sm:block font-mono font-bold text-lg tracking-tight text-charcoal-900 dark:text-white leading-none">
                  EZtify
                </h1>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800">
                <Activity size={12} className="text-green-500" />
                <span className="text-[10px] font-mono font-bold text-charcoal-500 dark:text-charcoal-400">ONLINE</span>
            </div>
          </div>

          {/* CENTER: Module Selector */}
          <div 
            ref={dropdownRef}
            className="
              flex-1 flex justify-center px-2 z-50 min-w-0
              md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:flex-none md:px-0 md:w-auto
            " 
          >
            <div className="relative w-full max-w-[320px] md:max-w-none">
              <motion.button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full md:min-w-[320px] flex items-center justify-between gap-3 h-10 px-3 md:px-4 rounded-lg text-xs font-mono transition-all duration-200 ease-out border outline-none
                  ${isDropdownOpen 
                    ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 border-charcoal-700 shadow-xl' 
                    : 'bg-white dark:bg-charcoal-900 border-slate-200 dark:border-charcoal-800 text-charcoal-600 dark:text-slate-300 hover:border-brand-purple/50 dark:hover:border-brand-purple/50'
                  }
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                   <Terminal size={14} className={`shrink-0 ${isDropdownOpen ? "text-brand-purple" : "text-charcoal-400"}`} />
                   <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap min-w-0">
                      {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="opacity-30 shrink-0">/</span>}
                          <span className={`${i === breadcrumbs.length - 1 ? "font-bold text-brand-purple" : "opacity-60"} truncate`}>
                            {crumb}
                          </span>
                        </React.Fragment>
                      ))}
                   </div>
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-current/10 shrink-0">
                   <span className="hidden md:inline opacity-50 text-[10px] tracking-wide">CMD+K</span>
                   <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, x: "-50%", scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                    exit={{ opacity: 0, y: 8, x: "-50%", scale: 0.98 }}
                    transition={{ duration: 0.25, ease: techEase }}
                    className={`
                      fixed left-1/2 top-[72px] z-[100]
                      w-[90vw] max-w-[420px] 
                      md:w-[640px] md:max-w-none lg:w-[800px]
                      max-h-[calc(100vh-100px)]
                      bg-white dark:bg-charcoal-900 rounded-xl shadow-2xl border border-slate-200 dark:border-charcoal-700 ring-1 ring-black/5 overflow-hidden flex flex-col
                    `}
                  >
                    {/* Modules Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/30 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {toolCategories.map((category) => (
                          <div key={category.category} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <Hash size={12} className="text-brand-purple" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400 font-mono">
                                  {category.category}
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {category.tools.map((tool) => (
                                <button
                                  key={tool.id}
                                  onClick={() => handleToolSelect(tool.path)}
                                  className={`
                                    group flex items-start gap-3 p-3 rounded-lg text-left transition-all border
                                    ${currentMode === tool.id 
                                      ? 'bg-brand-purple/5 border-brand-purple/30 ring-1 ring-brand-purple/20' 
                                      : 'bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/40 hover:shadow-md hover:shadow-brand-purple/5'}
                                  `}
                                >
                                  <div className={`p-2 rounded-md shrink-0 ${currentMode === tool.id ? 'bg-brand-purple text-white' : 'bg-slate-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-300 group-hover:text-brand-purple group-hover:bg-brand-purple/10'}`}>
                                    {React.cloneElement(tool.icon, { size: 18 })}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-xs font-bold font-mono ${currentMode === tool.id ? 'text-brand-purple' : 'text-charcoal-800 dark:text-slate-200 group-hover:text-brand-purple'}`}>
                                          {tool.title}
                                        </span>
                                        {currentMode === tool.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />}
                                    </div>
                                    <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 line-clamp-1 leading-relaxed">
                                      {tool.desc}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-3 bg-slate-100 dark:bg-charcoal-900 border-t border-slate-200 dark:border-charcoal-800 flex justify-between items-center text-[10px] font-mono text-charcoal-500 shrink-0">
                        <div className="flex gap-4">
                           <span>Modules: {allTools.length}</span>
                           <span>Runtime: WASM</span>
                        </div>
                        <div className="flex gap-2">
                           <span className="bg-charcoal-200 dark:bg-charcoal-800 px-1.5 py-0.5 rounded">↑↓ Nav</span>
                           <span className="bg-charcoal-200 dark:bg-charcoal-800 px-1.5 py-0.5 rounded">↵ Exec</span>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 z-20">
            <Link 
              to="/about"
              className="hidden md:flex items-center h-9 px-3 rounded-md text-xs font-mono font-bold text-charcoal-500 hover:text-brand-purple hover:bg-brand-purple/5 transition-colors border border-transparent hover:border-brand-purple/20"
            >
              [ DOCS ]
            </Link>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-charcoal-800 hidden md:block" />

            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400 hover:text-brand-purple hover:border-brand-purple/30 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </motion.button>
            <ShareButton />
          </div>
        </div>
      </motion.header>
      
      {/* Backdrop for menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-charcoal-950/20 backdrop-blur-sm z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
