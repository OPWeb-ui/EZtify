
import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
  const strokeWidth = size === 'sm' ? 2 : 2.5;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: dims, height: dims }}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Document Frame */}
        <path
          d="M7 2H14.5L18 5.5V20C18 21.1046 17.1046 22 16 22H7C5.89543 22 5 21.1046 5 20V4C5 2.89543 5.89543 2 7 2Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M14 2V6H18"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Lightning Bolt */}
        <path
          d="M12.5 8L9.5 13H12.5L11.5 17L14.5 12H11.5L12.5 8Z"
          fill="#F97316"
          className="drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
        />
      </svg>
    </div>
  );
};
