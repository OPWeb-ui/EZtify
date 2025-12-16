
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { ToolDrawer } from './ToolDrawer';
import { AppMode } from '../types';
import { Command, Grid3X3 } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { toolCategories, allTools } from '../utils/tool-list';

interface HeaderProps {
  currentMode: AppMode;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, isMobile }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const currentTool = useMemo(() => allTools.find(t => t.id === currentMode), [currentMode]);

  // Breadcrumb Logic: Path > Tool
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '') return null; // Home doesn't need crumbs
    if (path === '/about') return ['System', 'About'];
    if (path === '/faq') return ['System', 'FAQ'];
    if (currentTool) {
      const category = toolCategories.find(cat => cat.tools.some(t => t.id === currentTool.id));
      const categoryName = category ? category.category : 'Tool';
      return [categoryName, currentTool.title];
    }
    return ['System', 'Unknown'];
  }, [location.pathname, currentTool]);

  // Global Keyboard Shortcut for Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[50] h-12 bg-nd-base/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/50 flex items-center px-4 md:px-6 transition-colors duration-200">
        
        {/* Left: Branding / Context */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 mr-2">
          <Link to="/" className="flex items-center gap-2 group shrink-0 outline-none" aria-label="Home">
            <div className="w-5 h-5 text-nd-primary transition-colors opacity-90 group-hover:opacity-100">
               <Logo size="sm" /> 
            </div>
            <span className="font-semibold text-sm tracking-tight text-nd-primary hidden sm:block opacity-90 group-hover:opacity-100">
              EZtify
            </span>
          </Link>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0 rotate-12" />

          {/* Breadcrumbs / Tool Selector */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-nd-secondary hover:text-nd-primary transition-colors min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-nd-primary/20 rounded-md py-1 px-1 -ml-1"
          >
            {breadcrumbs ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="opacity-60 hidden sm:inline whitespace-nowrap">{breadcrumbs[0]}</span>
                <span className="opacity-40 hidden sm:inline">/</span>
                <span className="text-nd-primary font-semibold truncate block">
                  {breadcrumbs[1]}
                </span>
              </div>
            ) : (
              <span className="text-nd-secondary hover:text-nd-primary transition-colors whitespace-nowrap">Overview</span>
            )}
            <span className="opacity-30 shrink-0">
               <Grid3X3 size={12} />
            </span>
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-4 mr-2">
            <Link to="/about" className="text-xs font-medium text-nd-secondary hover:text-nd-primary transition-colors">
              About
            </Link>
            <Link to="/faq" className="text-xs font-medium text-nd-secondary hover:text-nd-primary transition-colors">
              FAQ
            </Link>
          </nav>

          {!isMobile && (
            <div className="hidden md:flex items-center gap-2 text-[10px] text-nd-muted font-mono bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">
              <Command size={10} /> K
            </div>
          )}
          
          {/* Theme Selector */}
          <ThemeSelector />
        </div>
      </header>

      {/* Drawer */}
      <ToolDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        isMobile={isMobile} 
      />
    </>
  );
};
