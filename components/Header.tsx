
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { ShareButton } from './ShareButton';
import { AppMode } from '../types';
import {
  ChevronDown, Moon, Sun,
  Terminal, Activity, Command, ArrowRight,
  HelpCircle
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

  const currentTool = useMemo(() => allTools.find(t => t.id === currentMode), [currentMode]);

  // --- BREADCRUMB LOGIC (Global Contract) ---
  // Format: Home (~) -> Category -> Tool
  // Single Source of Truth: Location Path & Tool Metadata
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;

    // 1. Root / Home
    if (path === '/' || path === '') {
      return ['~', 'Home'];
    }

    // 2. Static System Pages
    if (path === '/about') return ['~', 'System', 'About'];
    if (path === '/faq') return ['~', 'System', 'FAQ'];

    // 3. Active Tool Route
    if (currentTool) {
      const category = toolCategories.find(cat => cat.tools.some(t => t.id === currentTool.id));
      const categoryName = category ? category.category : 'Tool';
      return ['~', categoryName, currentTool.title];
    }

    // 4. Fallback for Unknown Routes (404s)
    return ['~', 'System', 'Unknown'];
  }, [location.pathname, currentTool]);

  // Keyboard Shortcuts
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

  // Click Outside
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

  const menuVariants = {
    hidden: { opacity: 0, y: -4, scale: 0.99 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
    },
    exit: {
      opacity: 0,
      y: -4,
      scale: 0.99,
      transition: { duration: 0.15, ease: "easeOut" }
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: techEase }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-charcoal-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-charcoal-800"
        style={{ 
          height: 'calc(4rem + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between gap-2">

          {/* Logo Area */}
          <div className="flex items-center gap-2 sm:gap-6 z-20 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none"
              aria-label="Home"
            >
              <div className="relative">
                 <Logo size="sm" />
                 <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white dark:ring-charcoal-950" />
              </div>
              <span className="hidden sm:block font-mono font-bold text-lg tracking-tight text-charcoal-900 dark:text-white">
                EZtify
              </span>
            </Link>

            {/* Status Indicator (Desktop) */}
            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-slate-100/50 dark:bg-charcoal-900/50 border border-slate-200 dark:border-charcoal-800">
                <Activity size={10} className="text-green-500" />
                <span className="text-[10px] font-mono font-bold text-charcoal-500 dark:text-charcoal-400">READY</span>
            </div>
          </div>

          {/* Search Trigger (Tools Button) */}
          <div
            ref={dropdownRef}
            className="flex-1 flex justify-center px-2 sm:px-4 md:absolute md:inset-x-0 md:pointer-events-none md:top-[env(safe-area-inset-top)] md:h-16 md:items-center"
          >
            <div className="pointer-events-auto w-full max-w-md min-w-[120px]">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`
                  w-full flex items-center justify-between gap-2 sm:gap-3 h-10 px-3 rounded-lg
                  border transition-all duration-200
                  ${isDropdownOpen
                    ? 'bg-charcoal-100 dark:bg-charcoal-800 border-charcoal-300 dark:border-charcoal-600 shadow-inner'
                    : 'bg-slate-50 dark:bg-charcoal-900/50 border-slate-200 dark:border-charcoal-800 hover:border-brand-purple/30 hover:bg-white dark:hover:bg-charcoal-800'
                  }
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden text-charcoal-600 dark:text-charcoal-300">
                   <Terminal size={14} className={isDropdownOpen ? "text-brand-purple" : "opacity-70"} />
                   <div className="flex items-center gap-1.5 text-xs font-mono overflow-hidden">
                      {breadcrumbs.map((crumb, i) => (
                        <span key={i} className={`truncate ${i === breadcrumbs.length - 1 ? 'font-bold text-charcoal-900 dark:text-white' : 'opacity-50'}`}>
                          {i > 0 && <span className="opacity-50 mr-1.5">/</span>}
                          {crumb}
                        </span>
                      ))}
                   </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                   <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-700 text-[9px] font-mono text-charcoal-400">
                      <Command size={8} /> K
                   </kbd>
                   <ChevronDown size={14} className={`text-charcoal-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-20">
            <Link
              to="/faq"
              className="hidden md:flex text-xs font-mono font-bold text-charcoal-500 hover:text-brand-purple transition-colors items-center gap-1"
            >
              <HelpCircle size={14} /> FAQ
            </Link>
            <Link
              to="/about"
              className="hidden md:flex text-xs font-mono font-bold text-charcoal-500 hover:text-brand-purple transition-colors"
            >
              [DOCS]
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-charcoal-800 hidden md:block" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <ShareButton />
          </div>
        </div>
      </motion.header>

      {/* Mega Menu Overlay */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-white/20 dark:bg-black/40 backdrop-blur-sm"
              style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`
                fixed z-50
                /* Mobile: Full Width Panel */
                left-0 w-full bg-white dark:bg-charcoal-900
                /* Desktop: Centered Floating Panel */
                md:h-auto md:max-h-[85vh] md:w-[850px] md:rounded-xl
                md:left-0 md:right-0 md:mx-auto
                md:border md:border-slate-200 md:dark:border-charcoal-800
                md:shadow-2xl md:shadow-charcoal-950/20
                flex flex-col overflow-hidden
              `}
              style={{
                top: 'calc(4rem + env(safe-area-inset-top))',
                // On mobile, height needs to respect safe area bottom
                height: 'calc(100vh - 4rem - env(safe-area-inset-top))',
              }}
            >
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6 pb-[env(safe-area-inset-bottom)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  {toolCategories.map((category, idx) => (
                    <div
                      key={category.category}
                      className={`space-y-3 ${category.category === 'Power Tools' ? 'md:col-span-2' : ''}`}
                    >
                      <div className="flex items-center gap-2 px-2 pb-1 border-b border-slate-100 dark:border-charcoal-800/50">
                          <Terminal size={12} className="text-charcoal-400" />
                          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-charcoal-500 dark:text-charcoal-400">
                            {category.category}
                          </h3>
                      </div>

                      <div className={`grid gap-2 ${category.category === 'Power Tools' ? 'grid-cols-1' : 'grid-cols-1'}`}>
                        {category.tools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolSelect(tool.path)}
                            className={`
                              group relative flex items-start gap-4 p-3 rounded-lg text-left transition-all duration-200
                              border border-transparent
                              hover:bg-slate-50 dark:hover:bg-charcoal-800
                              hover:border-slate-200 dark:hover:border-charcoal-700
                              ${currentMode === tool.id ? 'bg-slate-50 dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700' : ''}
                            `}
                          >
                            <div className={`
                              shrink-0 p-2 rounded-md transition-colors duration-200
                              ${currentMode === tool.id
                                ? 'bg-brand-purple text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-charcoal-950 text-charcoal-500 dark:text-charcoal-400 group-hover:text-brand-purple group-hover:bg-white dark:group-hover:bg-charcoal-900 group-hover:shadow-sm'
                              }
                            `}>
                              {React.cloneElement(tool.icon, { size: 18, strokeWidth: 2 })}
                            </div>

                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`
                                  text-sm font-bold font-mono tracking-tight transition-colors
                                  ${currentMode === tool.id ? 'text-brand-purple' : 'text-charcoal-800 dark:text-slate-200 group-hover:text-charcoal-900 dark:group-hover:text-white'}
                                `}>
                                  {tool.title}
                                </span>
                                {currentMode === tool.id && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
                                )}
                              </div>
                              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-500 leading-relaxed mt-0.5 line-clamp-1 group-hover:text-charcoal-600 dark:group-hover:text-charcoal-400 transition-colors">
                                {tool.desc}
                              </p>
                            </div>

                            {/* Hover Arrow (Desktop) */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 hidden md:block text-charcoal-300 dark:text-charcoal-600">
                               <ArrowRight size={14} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu Footer */}
              <div className="shrink-0 p-3 bg-slate-50 dark:bg-charcoal-950 border-t border-slate-200 dark:border-charcoal-800 flex justify-between items-center text-[10px] font-mono text-charcoal-400 dark:text-charcoal-600 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                  <div className="flex gap-4">
                     <span className="flex items-center gap-1"><Activity size={10} /> v1.0.0</span>
                     <span>WASM_READY</span>
                  </div>
                  
                  {/* Desktop Hints */}
                  <div className="hidden md:flex gap-3">
                     <span className="bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 px-1.5 py-0.5 rounded">↑↓ Navigate</span>
                     <span className="bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 px-1.5 py-0.5 rounded">↵ Select</span>
                     <span className="bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 px-1.5 py-0.5 rounded">ESC Close</span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex md:hidden gap-4 font-bold text-charcoal-500 dark:text-slate-400">
                     <Link to="/about" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-1 hover:text-brand-purple transition-colors">
                        <Terminal size={12} /> About
                     </Link>
                     <Link to="/faq" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-1 hover:text-brand-purple transition-colors">
                        <HelpCircle size={12} /> FAQ
                     </Link>
                  </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
