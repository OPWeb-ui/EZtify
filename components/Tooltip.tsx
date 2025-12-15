
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: Placement;
  delay?: number; // ms
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<Placement>(side);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Positioning Logic ---
  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    // Default Gap
    const gap = 8;
    
    // Estimated tooltip dimensions (since we render conditionally, we guess or measure after. 
    // For smoothness, we'll estimate a max width/height based on content length or fixed constants).
    // A safer way is to just center it relative to rect and adjust.
    
    let top = 0;
    let left = 0;
    let finalPlacement = side;

    // Viewport boundaries
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Basic calculation based on side
    switch (side) {
      case 'top':
        top = rect.top + scrollY - gap;
        left = rect.left + scrollX + rect.width / 2;
        if (rect.top < 50) finalPlacement = 'bottom'; // Auto-flip
        break;
      case 'bottom':
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + rect.width / 2;
        if (rect.bottom > vh - 50) finalPlacement = 'top';
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - gap;
        if (rect.left < 100) finalPlacement = 'right';
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + gap;
        if (rect.right > vw - 100) finalPlacement = 'left';
        break;
    }

    // Re-calc if flipped
    if (finalPlacement !== side) {
       if (finalPlacement === 'top') {
          top = rect.top + scrollY - gap;
          left = rect.left + scrollX + rect.width / 2;
       } else if (finalPlacement === 'bottom') {
          top = rect.bottom + scrollY + gap;
          left = rect.left + scrollX + rect.width / 2;
       } else if (finalPlacement === 'left') {
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - gap;
       } else if (finalPlacement === 'right') {
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + gap;
       }
    }

    setCoords({ top, left });
    setPlacement(finalPlacement);
  };

  // --- Handlers ---

  const show = () => {
    updatePosition();
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(show, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hide();
  };

  // Mobile Long Press
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      show();
    }, 400); // 400ms long press
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    hide();
  };

  // Auto-hide on scroll/resize
  useEffect(() => {
    if (isVisible) {
      const handleScroll = () => hide();
      window.addEventListener('scroll', handleScroll, { capture: true });
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, { capture: true });
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isVisible]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  // --- Animation Variants ---
  const variants = {
    initial: { opacity: 0, scale: 0.9, y: placement === 'top' ? 4 : placement === 'bottom' ? -4 : 0, x: placement === 'left' ? 4 : placement === 'right' ? -4 : 0 },
    animate: { opacity: 1, scale: 1, y: 0, x: 0 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
  };

  const transformStyle = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)'
  };

  // --- Render ---
  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-flex relative ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={hide} // Hide on click action
        role="tooltip"
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                transform: transformStyle[placement],
                zIndex: 9999,
                pointerEvents: 'none'
              }}
              className="fixed"
            >
              <div className="
                px-2.5 py-1.5
                bg-charcoal-900 dark:bg-charcoal-800 
                border border-white/10 dark:border-charcoal-600
                text-white dark:text-slate-200
                text-[11px] font-medium font-mono tracking-wide 
                rounded-lg shadow-xl shadow-black/20 
                whitespace-nowrap max-w-xs
              ">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
