
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { buttonTap } from '../utils/animations';

export const ThemeSelector: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={buttonTap}
      onClick={toggleTheme}
      className="flex items-center gap-2 h-8 px-3 rounded-md bg-nd-subtle border border-nd-border hover:border-nd-secondary transition-all"
      aria-label="Toggle Theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {theme === 'dark' ? (
          <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
            <Moon size={14} className="text-nd-primary" />
          </motion.div>
        ) : (
          <motion.div key="sun" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
            <Sun size={14} className="text-nd-primary" />
          </motion.div>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-nd-primary hidden lg:block">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </motion.button>
  );
};
