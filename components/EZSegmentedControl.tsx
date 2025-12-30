
import React from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption {
  value: string | number;
  label: string | React.ReactNode;
}

interface EZSegmentedControlProps {
  options: SegmentOption[];
  value: string | number;
  onChange: (val: any) => void;
  label?: string;
}

export const EZSegmentedControl: React.FC<EZSegmentedControlProps> = ({
  options,
  value,
  onChange,
  label
}) => {
  return (
    <div className="w-full">
      {label && (
        <div className="text-[11px] font-bold text-charcoal-500/80 dark:text-slate-400/80 uppercase tracking-widest font-mono pl-0.5 mb-3">
          {label}
        </div>
      )}
      <div className="flex p-1 bg-slate-100 dark:bg-charcoal-800 rounded-xl border border-slate-200 dark:border-charcoal-700 relative isolate">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                flex-1 relative z-10 py-2 px-3 text-xs font-bold rounded-lg transition-colors
                ${isActive 
                  ? 'text-charcoal-900 dark:text-white' 
                  : 'text-charcoal-500 dark:text-slate-400 hover:text-charcoal-800 dark:hover:text-slate-200'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId={`segment-bg-${label || 'default'}`}
                  className="absolute inset-0 bg-white dark:bg-charcoal-600 shadow-sm rounded-lg -z-10 border border-black/5 dark:border-white/5"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
