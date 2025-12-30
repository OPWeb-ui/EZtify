
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
    xs: 'w-6 h-6 rounded-lg p-1',       
    sm: 'w-8 h-8 rounded-xl p-1.5',     
    md: 'w-10 h-10 rounded-2xl p-2',     
    lg: 'w-12 h-12 rounded-2xl p-2.5',   
    xl: 'w-16 h-16 rounded-3xl p-4',    
  };

  const iconSizes = {
    xs: 14,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 32,
  };

  // Variant Logic
  let variantClass = '';
  let style: React.CSSProperties = {};

  if (active && toolAccentColor) {
     // Active Tool State: Solid colored background (Screenshot style) or tinted
     style = {
         backgroundColor: toolAccentColor, 
         color: '#FFFFFF',
         boxShadow: `0 4px 12px ${toolAccentColor}40`
     };
     variantClass = '';
  } else if (variant === 'neutral') {
     variantClass = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
  } else if (variant === 'ghost') {
     variantClass = 'bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors';
  } else if (variant === 'brand') {
     variantClass = 'bg-gray-900 text-white shadow-md';
  } else if (variant === 'transparent') {
     variantClass = 'bg-transparent text-gray-500 border-none';
  } else if (variant === 'error') {
     variantClass = 'bg-rose-50 text-rose-600 border border-rose-100';
  } else if (variant === 'tool') {
     // Default inactive tool state: White bg with shadow/border
     variantClass = 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 shadow-sm';
  }

  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: iconSizes[size], 
        strokeWidth: 2, // Thicker strokes for clarity in light mode
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
