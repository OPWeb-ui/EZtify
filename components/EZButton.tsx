
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { buttonTap } from '../utils/animations';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface EZButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const EZButton = React.forwardRef<HTMLButtonElement, EZButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {

  // Base: Pill-shaped, medium weight font, clean focus
  const baseStyles = "relative inline-flex items-center justify-center font-sans font-semibold tracking-tight rounded-2xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden";
  
  const variants = {
    // Primary: High contrast black/dark background (Matches "Buy Now" / "Upgrade")
    primary: "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 shadow-md hover:shadow-lg border border-transparent focus-visible:ring-gray-900",
    
    // Secondary: White surface, subtle border (Matches card actions)
    secondary: "bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm focus-visible:ring-gray-400",
    
    // Tertiary: Low emphasis, blends in
    tertiary: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:ring-gray-400",
    
    // Destructive: Subtle red
    destructive: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 focus-visible:ring-rose-500",
    
    // Ghost: Icon-only feel
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-5 text-sm rounded-xl",
    lg: "h-12 px-6 text-base rounded-2xl",
    icon: "h-10 w-10 p-0 rounded-xl"
  };

  return (
    <motion.button
      ref={ref}
      whileTap={!disabled && !isLoading ? buttonTap : undefined}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit z-10">
          <Loader2 className="animate-spin w-4 h-4" />
        </div>
      )}

      {/* Content */}
      <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
});

EZButton.displayName = "EZButton";
