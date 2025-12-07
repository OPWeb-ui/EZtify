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
        w-full max-w-4xl ${heightClass} bg-slate-100 rounded-lg border border-slate-200 border-dashed 
        flex items-center justify-center relative overflow-hidden group
      `}>
        <div className="text-slate-400 text-xs font-mono uppercase tracking-widest font-bold z-10">
          Advertisement
        </div>
        
        {/* Subtle background pattern to indicate this is a reserved slot */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
    </div>
  );
};