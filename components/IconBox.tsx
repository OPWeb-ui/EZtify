
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface IconBoxProps {
  icon: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'ghost' | 'tool' | 'transparent';
  className?: string;
  active?: boolean;
  toolAccentColor?: string; // For dynamic tool colors (Hex code)
}

export const IconBox: React.FC<IconBoxProps> = ({ 
  icon, 
  size = 'md', 
  variant = 'neutral', 
  className = '',
  active = false,
  toolAccentColor
}) => {
  // STRICT SYSTEM: All icons live in a square, rounded-xl container.
  
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md p-1',       // 24px - Dense
    sm: 'w-8 h-8 rounded-lg p-1.5',     // 32px - Standard UI (Headers)
    md: 'w-10 h-10 rounded-xl p-2',     // 40px - Cards / Inputs
    lg: 'w-12 h-12 rounded-xl p-2.5',   // 48px - Featured
    xl: 'w-16 h-16 rounded-2xl p-4',    // 64px - Hero / Upload
  };

  const iconSizes = {
    xs: 14,
    sm: 18, // Optimized for 32px box
    md: 20,
    lg: 24,
    xl: 32,
  };

  // Variant Logic
  let variantClass = '';
  let style: React.CSSProperties = {};

  if (active && toolAccentColor) {
     // Active Tool State: Subtle tinted background, colored icon
     style = {
         backgroundColor: `${toolAccentColor}15`, // ~8% opacity
         color: toolAccentColor,
         borderColor: `${toolAccentColor}30` // ~12% opacity
     };
     variantClass = 'border';
  } else if (variant === 'neutral') {
     variantClass = 'bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-charcoal-500 dark:text-charcoal-400';
  } else if (variant === 'ghost') {
     variantClass = 'bg-transparent text-charcoal-500 dark:text-charcoal-400 hover:bg-slate-100 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-white';
  } else if (variant === 'brand') {
     variantClass = 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 border border-transparent shadow-sm';
  } else if (variant === 'transparent') {
     variantClass = 'bg-transparent text-charcoal-500 dark:text-charcoal-400 border-none';
  } else if (variant === 'error') {
     variantClass = 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
  } else if (variant === 'success') {
     variantClass = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
  } else if (variant === 'warning') {
     variantClass = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
  } else if (variant === 'tool') {
     // Default inactive tool state (before hover/active)
     variantClass = 'bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-charcoal-500 dark:text-charcoal-400';
  }

  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: iconSizes[size], 
        strokeWidth: 1.5, // FORCE CONSISTENT STROKE WEIGHT
        className: 'transition-transform duration-200' 
      }) 
    : icon;

  return (
    <div 
      className={`
        relative flex items-center justify-center shrink-0 
        transition-all duration-200 ease-out select-none
        ${sizeClasses[size]} 
        ${variantClass} 
        ${className}
      `}
      style={style}
    >
      {iconElement}
    </div>
  );
};
