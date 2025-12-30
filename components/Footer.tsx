
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { animate } from 'framer-motion';
import { motionTokens } from '../utils/animations';

export const Footer: React.FC = () => {
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    // Normalize paths for comparison
    const normalize = (p: string) => p === '/' ? '/' : (p.endsWith('/') ? p.slice(0, -1) : p);
    
    const targetPath = normalize(to.startsWith('/') ? to : `/${to}`);
    const currentPath = normalize(location.pathname);

    if (currentPath === targetPath) {
      e.preventDefault();
      const scroller = document.querySelector('.overflow-y-auto.custom-scrollbar');
      if (scroller && scroller.scrollTop > 0) {
        animate(scroller.scrollTop, 0, {
          duration: 0.6,
          ease: motionTokens.ease.out,
          onUpdate: (val) => {
            scroller.scrollTop = val;
          }
        });
      }
    }
  };

  return (
    <div className="mt-16 pt-12 border-t-2 border-stone-200 flex flex-col md:flex-row justify-between items-center gap-6">
       <div className="font-bold text-xl text-[#111111] tracking-tight">EZTIFY</div>
       <div className="flex gap-8 text-sm font-bold text-stone-50">
          <Link to="/about" onClick={(e) => handleNavClick(e, '/about')} className="text-stone-500 hover:text-[#111111] transition-colors">About</Link>
          <Link to="/faq" onClick={(e) => handleNavClick(e, '/faq')} className="text-stone-500 hover:text-[#111111] transition-colors">Help</Link>
          <span className="text-stone-300">|</span>
          <span className="text-stone-400">© 2025</span>
       </div>
    </div>
  );
};
