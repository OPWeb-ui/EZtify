import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 0.15,
  className = '',
  maxWidth = 'max-w-xs'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const variants = {
    initial: { opacity: 0, y: side === 'top' ? 2 : side === 'bottom' ? -2 : 0, x: side === 'left' ? 2 : side === 'right' ? -2 : 0, scale: 0.95 },
    animate: { opacity: 1, y: 0, x: 0, scale: 1 },
    exit: { opacity: 0, y: side === 'top' ? 2 : side === 'bottom' ? -2 : 0, x: side === 'left' ? 2 : side === 'right' ? -2 : 0, scale: 0.95 }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onClick={() => setIsVisible(false)}
      role="tooltip"
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.15, delay, ease: "easeOut" }}
            className={`
              absolute z-[100] px-3 py-1.5
              bg-charcoal-900/90 dark:bg-white/90 backdrop-blur-md
              text-white dark:text-charcoal-900
              text-[11px] font-semibold tracking-wide rounded-lg shadow-xl shadow-black/10 pointer-events-none
              ${maxWidth} text-center leading-snug whitespace-nowrap
              ${positionClasses[side]}
            `}
          >
            {content}
            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 rotate-45 bg-charcoal-900/90 dark:bg-white/90
                ${side === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
                ${side === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
                ${side === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
                ${side === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};