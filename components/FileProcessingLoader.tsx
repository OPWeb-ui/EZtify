
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu } from 'lucide-react';
import { loaderVariants } from '../utils/animations';

const LOG_MESSAGES = [
  "> INITIALIZING_WASM_RUNTIME...",
  "> ALLOCATING_SHARED_MEMORY...",
  "> PARSING_BINARY_STREAM...",
  "> OPTIMIZING_ASSETS...",
  "> EXECUTING_TRANSFORM...",
  "> FINALIZING_OUTPUT_BUFFER..."
];

export const FileProcessingLoader: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate log stream
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < LOG_MESSAGES.length) {
        setLogs(prev => [...prev, LOG_MESSAGES[logIndex]].slice(-4)); // Keep last 4 lines
        logIndex++;
      }
    }, 400);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 100);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // Generate ASCII progress bar
  const totalBars = 20;
  const filledBars = Math.floor((progress / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const asciiBar = `[${'#'.repeat(filledBars)}${'.'.repeat(emptyBars)}]`;

  return (
    <motion.div
      variants={loaderVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-charcoal-950/95 backdrop-blur-md rounded-[24px] overflow-hidden"
    >
      <div className="w-full max-w-md p-6 font-mono text-xs md:text-sm text-charcoal-700 dark:text-brand-purple">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 border-b border-dashed border-charcoal-200 dark:border-brand-purple/30 pb-2">
          <Terminal size={16} className="animate-pulse" />
          <span className="font-bold">SYSTEM_PROCESS_ACTIVE</span>
        </div>

        {/* Log Window */}
        <div className="h-32 flex flex-col justify-end space-y-1 mb-6 opacity-80">
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="truncate"
            >
              {log}
            </motion.div>
          ))}
          <motion.div 
            animate={{ opacity: [0, 1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="text-brand-purple"
          >
            _
          </motion.div>
        </div>

        {/* Progress Section */}
        <div className="space-y-1">
          <div className="flex justify-between font-bold">
            <span>STATUS: PROCESSING</span>
            <span>{progress}%</span>
          </div>
          <div className="text-charcoal-400 dark:text-brand-purple/50 tracking-wider">
            {asciiBar}
          </div>
        </div>

        {/* Decorative Hex Dump */}
        <div className="absolute bottom-4 right-4 opacity-10 text-[8px] pointer-events-none text-right hidden md:block">
           0x0000FA34 B8 00 00 00 00<br/>
           0x0000FA39 89 C3 48 83 EC<br/>
           0x0000FA3E 48 8B 05 93 2F<br/>
           WASM_OPCODE::EXEC
        </div>

      </div>
    </motion.div>
  );
};
