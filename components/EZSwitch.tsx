
import React from 'react';
import { motion } from 'framer-motion';

interface EZSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const EZSwitch: React.FC<EZSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <label className="text-[10px] font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-3 cursor-pointer" onClick={() => onChange(!checked)}>
          {label}
        </label>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50
          ${checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-charcoal-600'}
        `}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
          initial={false}
          animate={{
            x: checked ? 20 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      </button>
    </div>
  );
};
