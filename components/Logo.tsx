import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC<{ size?: 'sm' | 'lg' | 'mono' }> = ({ size = 'lg' }) => {
  const isSmall = size === 'sm';
  const isMono = size === 'mono';
  
  // Increased base size for better readability of the detailed mark
  const width = isSmall ? 40 : 80;
  const height = isSmall ? 40 : 80;

  return (
    <div className="relative flex items-center justify-center">
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Document Gradient (Brand Colors: Purple -> Blue) */}
          <linearGradient id="ezDocGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" /> 
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          {/* Bolt Gradient (Electric Yellow) */}
          <linearGradient id="ezBoltGradient" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" /> {/* Yellow 200 */}
            <stop offset="50%" stopColor="#FACC15" /> {/* Yellow 400 */}
            <stop offset="100%" stopColor="#EAB308" /> {/* Yellow 500 */}
          </linearGradient>
          
          {/* Soft Glow for Bolt */}
          <filter id="ezYellowGlow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
             <feFlood floodColor="#FACC15" floodOpacity="0.6" result="glowColor" />
             <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredGlow" />
             <feMerge>
                <feMergeNode in="coloredGlow"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Document Outline - Uses Brand Gradient */}
        <motion.path 
          d="M26 14 H62 L82 34 V86 H26 V14 Z"
          stroke={isMono ? "currentColor" : "url(#ezDocGradient)"}
          strokeWidth={isSmall ? 6 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ opacity: isMono ? 1 : 0.8 }}
        />
        
        {/* Document Folded Corner */}
        <motion.path 
          d="M62 14 V34 H82"
          stroke={isMono ? "currentColor" : "url(#ezDocGradient)"}
          strokeWidth={isSmall ? 6 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
          style={{ opacity: isMono ? 1 : 0.8 }}
        />

        {/* Lightning Bolt (Central Power Element) - YELLOW */}
        <motion.path
          d="M58 20 L34 54 H54 L44 90 L80 44 H58 L70 20 H58 Z"
          fill={isMono ? "currentColor" : "url(#ezBoltGradient)"}
          stroke={isMono ? "transparent" : "white"}
          strokeWidth={isMono ? 0 : 2}
          filter={!isMono ? "url(#ezYellowGlow)" : undefined}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ 
             scale: 1, 
             opacity: 1, 
             y: 0,
             filter: !isMono 
               ? ["brightness(1)", "brightness(1.2) drop-shadow(0 0 5px rgba(250, 204, 21, 0.5))", "brightness(1)"] 
               : undefined
          }}
          transition={{ 
             scale: { type: "spring", stiffness: 400, damping: 18, delay: 0.2 },
             filter: { duration: 2, repeat: Infinity, ease: "easeInOut" } // Smooth pulsing
          }}
        />
        
        {/* Inner energy flash animation */}
        {!isMono && (
           <motion.path
             d="M58 20 L34 54 H54 L44 90 L80 44 H58 L70 20 H58 Z"
             fill="white"
             fillOpacity="0.5"
             stroke="none"
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 0.8, 0] }}
             transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 1], ease: "easeOut" }}
             style={{ mixBlendMode: 'overlay' }}
           />
        )}
      </motion.svg>
    </div>
  );
};
