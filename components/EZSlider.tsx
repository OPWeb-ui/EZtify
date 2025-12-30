
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface EZSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  suffix?: string;
  disabled?: boolean;
}

export const EZSlider: React.FC<EZSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  suffix = '',
  disabled = false
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate percentage for display
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault(); // Prevent scrolling
    setIsDragging(true);
    updateValueFromPointer(e);
    
    // Global pointer events for drag continuation
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    updateValueFromPointer(e);
  };

  const handleGlobalPointerUp = () => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    window.removeEventListener('pointerup', handleGlobalPointerUp);
  };

  const updateValueFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const rawPercent = x / rect.width;
    
    let newValue = min + (rawPercent * (max - min));
    
    // Snap to step
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    // Clamp
    newValue = Math.min(Math.max(newValue, min), max);
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let newValue = value;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = value - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = value + step;
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    newValue = Math.min(Math.max(newValue, min), max);
    onChange(newValue);
  };

  return (
    <div className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header Info */}
      <div className="flex justify-between items-center mb-3 px-0.5">
        {label && (
          <label className="text-[11px] font-bold text-charcoal-500/80 dark:text-slate-400/80 uppercase tracking-widest font-mono">
            {label}
          </label>
        )}
        <div className="text-xs font-mono font-bold text-charcoal-900 dark:text-white bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded">
          {Math.round(value)}{suffix}
        </div>
      </div>

      {/* Track Container */}
      <div 
        className="relative h-8 flex items-center cursor-pointer touch-none group"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Background Track - Thick iOS Style */}
        <div className="absolute w-full h-2 bg-slate-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
           {/* Active Fill (Animated) */}
           <motion.div 
             className="h-full bg-[var(--ez-accent)]"
             style={{ width: `${percentage}%` }}
             layout // Smooth layout transitions
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
           />
        </div>

        {/* Thumb */}
        <motion.div 
          className="absolute w-6 h-6 bg-white rounded-full shadow-md border border-slate-200 dark:border-slate-600 z-10 flex items-center justify-center top-1"
          style={{ 
            left: `${percentage}%`, 
            x: '-50%' // Center anchor
          }}
          layout
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          animate={{ scale: isDragging ? 1.1 : 1 }}
        >
           {/* Inner Dot */}
           <div className={`w-2 h-2 rounded-full transition-colors ${isDragging ? 'bg-[var(--ez-accent)]' : 'bg-slate-300 dark:bg-slate-500'}`} />
        </motion.div>
        
        {/* Focus Ring (Accessibility) */}
        <div className="absolute inset-0 rounded-md pointer-events-none transition-opacity opacity-0 group-focus-within:opacity-100 ring-2 ring-[var(--ez-accent)]/30 ring-offset-2 ring-offset-white dark:ring-offset-charcoal-900" />
      </div>
    </div>
  );
};
