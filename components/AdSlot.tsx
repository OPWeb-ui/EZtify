import React from 'react';

interface AdSlotProps {
  zone: 'hero' | 'footer' | 'sidebar';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ zone, className = '' }) => {
  // In a real implementation, this would contain the ad script or iframe.
  // For now, it renders a safe placeholder that reserves space to prevent CLS.
  
  const heightClass = zone === 'hero' ? 'min-h-[250px] md:min-h-[90px]' : 'min-h-[250px]';
  
  return (
    <div className={`w-full flex items-center justify-center my-8 ${className}`}>
      <div className={`
        w-full max-w-4xl ${heightClass} 
        bg-slate-50/50 dark:bg-charcoal-900/40 backdrop-blur-sm
        rounded-2xl border border-slate-200 dark:border-charcoal-700 border-dashed 
        flex items-center justify-center relative overflow-hidden group transition-colors duration-300
        hover:bg-slate-100/50 dark:hover:bg-charcoal-800/40
      `}>
        <div className="text-charcoal-400 dark:text-charcoal-600 text-[10px] font-mono uppercase tracking-[0.2em] font-bold z-10 select-none">
          Advertisement
        </div>
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Subtle Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      </div>
    </div>
  );
};