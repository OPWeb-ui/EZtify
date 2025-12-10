import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface FullScreenLoaderProps {
  onAnimationComplete: () => void;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ onAnimationComplete }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const controls = animate(count, 100, {
      duration: 1.2,
      ease: [0.42, 0, 0.58, 1],
      onComplete: () => {
        setTimeout(onAnimationComplete, 200);
      },
    });

    return () => controls.stop();
  }, [onAnimationComplete, count]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-pastel-bg/80 dark:bg-charcoal-950/80 backdrop-blur-md"
    >
      <div className="relative w-24 h-24">
        {/* Background Circle */}
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(109, 40, 217, 0.1)"
            strokeWidth="10"
            fill="transparent"
          />
        </svg>
        {/* Progress Circle */}
        <motion.svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="#6D28D9"
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
            style={{ pathLength: useTransform(count, [0, 100], [0, 1]) }}
          />
        </motion.svg>
        {/* Percentage Text */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-xl font-bold font-mono text-brand-purple"
        >
          {rounded}
        </motion.span>
      </div>
      <p className="mt-4 text-sm font-medium text-charcoal-500 dark:text-slate-400">Loading your canvas...</p>
    </motion.div>
  );
};
