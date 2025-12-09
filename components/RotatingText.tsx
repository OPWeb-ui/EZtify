import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "100% private. Processed instantly in your browser.",
  "Select only the pages you need. Everything stays on your device."
];

export const RotatingText: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto relative flex items-center justify-center min-h-[3rem] px-4 py-1">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-charcoal-500/80 dark:text-slate-400 text-sm font-medium tracking-wide text-center leading-relaxed w-full"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
