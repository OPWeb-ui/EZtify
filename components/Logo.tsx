import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC<{ size?: 'sm' | 'lg' | 'mono' }> = ({ size = 'lg' }) => {
  const isSmall = size === 'sm';
  const isMono = size === 'mono';
  
  const width = isSmall ? 32 : 64;
  const height = isSmall ? 32 : 64;

  // Creative Purple Palette
  const colors = {
    purple: '#8B5CF6',
    blue: '#60A5FA',
    mint: '#6EE7B7'
  };

  return (
    <div className="relative flex items-center justify-center">
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={isMono ? {} : { rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="fusionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.purple} />
            <stop offset="50%" stopColor={colors.blue} />
            <stop offset="100%" stopColor={colors.mint} />
          </linearGradient>
        </defs>

        <motion.path
          d="M20 20 H80 V80 H20 Z"
          stroke={isMono ? "currentColor" : "url(#fusionGradient)"}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ opacity: 0.9 }}
        />

        <motion.rect
          x="35"
          y="35"
          width="40"
          height="40"
          stroke={isMono ? "currentColor" : "url(#fusionGradient)"}
          strokeWidth="8"
          rx="4"
          fill="none"
          animate={{
            x: [35, 40, 35],
            y: [35, 40, 35],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ opacity: 0.7 }}
        />
        
        {/* Abstract "Flow" line */}
        <motion.path
          d="M10 90 Q 50 40 90 10"
          stroke={isMono ? "currentColor" : "#A78BFA"} // Soft purple hint
          strokeWidth="4"
          strokeDasharray="4 6"
          fill="none"
          style={{ opacity: 0.4 }}
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.svg>
      {!isSmall && !isMono && (
         <div className="absolute inset-0 bg-brand-purple/20 blur-3xl -z-10 rounded-full animate-pulse" />
      )}
    </div>
  );
};