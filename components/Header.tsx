
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { ToolDrawer } from './ToolDrawer';
import { AppMode } from '../types';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { motionTokens, physicalSpring, bouncySpring } from '../utils/animations';
import { allTools } from '../utils/tool-list';

interface HeaderProps {
  currentMode: AppMode;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, isMobile }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const currentTool = allTools.find(t => t.id === currentMode);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    const normalize = (p: string) => p === '/' ? '/' : (p.endsWith('/') ? p.slice(0, -1) : p);
    const targetPath = normalize(to.startsWith('/') ? to : `/${to}`);
    const currentPath = normalize(location.pathname);

    if (currentPath === targetPath) {
      e.preventDefault();
      const scroller = document.getElementById('eztify-public-scroller');
      if (scroller && scroller.scrollTop > 0) {
        animate(scroller.scrollTop, 0, {
          duration: 0.8,
          ease: motionTokens.ease.out,
          onUpdate: (val) => {
            scroller.scrollTop = val;
          }
        });
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] h-16 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E5E5E0] flex items-center px-4 md:px-8">
        {/* Brand Area */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-2.5 group outline-none shrink-0">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={bouncySpring}>
              <Logo size="sm" />
            </motion.div>
            <span className={`font-bold text-lg tracking-tighter text-[#111111] ${isMobile && currentTool ? 'hidden' : 'block'}`}>EZTIFY</span>
          </Link>

          {/* Breadcrumb extension for Tools */}
          <AnimatePresence mode="wait">
            {currentTool && (
              <motion.div
                key="tool-breadcrumb"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5 pointer-events-none select-none overflow-hidden"
              >
                <span className="text-stone-200 font-light text-xl shrink-0">/</span>
                <span className="text-stone-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap truncate">
                  {currentTool.title}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8 shrink-0">
          <Link 
            to="/pdf-workspace" 
            className="text-sm font-bold text-stone-500 hover:text-black transition-colors"
          >
            Workspace
          </Link>
          <Link 
            to="/about" 
            onClick={(e) => handleNavClick(e, '/about')} 
            className="text-sm font-bold text-stone-500 hover:text-black transition-colors"
          >
            About
          </Link>
          <Link 
            to="/faq" 
            onClick={(e) => handleNavClick(e, '/faq')} 
            className="text-sm font-bold text-stone-500 hover:text-black transition-colors"
          >
            Help
          </Link>
          
          <motion.button 
            onClick={() => setIsDrawerOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={physicalSpring}
            className="flex items-center gap-2 px-5 py-2 bg-[#111111] text-white rounded-full text-xs font-bold hover:bg-black shadow-sm"
          >
            All Tools
          </motion.button>
        </nav>

        {/* Mobile Menu Trigger */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsDrawerOpen(true)}
          className="md:hidden p-2 text-stone-800 hover:bg-stone-200 rounded-lg transition-colors shrink-0 ml-2"
        >
          <Menu size={24} />
        </motion.button>
      </header>

      <ToolDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} isMobile={isMobile} />
    </>
  );
};
