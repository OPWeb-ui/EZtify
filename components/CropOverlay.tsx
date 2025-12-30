
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, RotateCcw, Crop as CropIcon } from 'lucide-react';
import { CropData } from '../types';
import { buttonTap } from '../utils/animations';

interface CropOverlayProps {
  imageUrl: string;
  initialCrop?: CropData;
  onApply: (crop: CropData | undefined) => void;
  onCancel: () => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ imageUrl, initialCrop, onApply, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<CropData>(initialCrop || { x: 0, y: 0, width: 100, height: 100 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // --- DRAG LOGIC ---
  const handlePointerDown = (e: React.PointerEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.movementX / rect.width) * 100;
    const deltaY = (e.movementY / rect.height) * 100;

    setCrop(prev => {
      let { x, y, width, height } = prev;
      const minSize = 5; // Minimum 5% size

      if (activeHandle === 'move') {
        x = Math.max(0, Math.min(100 - width, x + deltaX));
        y = Math.max(0, Math.min(100 - height, y + deltaY));
      } else {
        if (activeHandle.includes('w')) {
          const maxDelta = x + width - minSize; 
          // New x cannot push right side beyond boundary
          const newX = Math.max(0, Math.min(maxDelta, x + deltaX));
          width = width + (x - newX);
          x = newX;
        }
        if (activeHandle.includes('e')) {
          width = Math.max(minSize, Math.min(100 - x, width + deltaX));
        }
        if (activeHandle.includes('n')) {
          const maxDelta = y + height - minSize;
          const newY = Math.max(0, Math.min(maxDelta, y + deltaY));
          height = height + (y - newY);
          y = newY;
        }
        if (activeHandle.includes('s')) {
          height = Math.max(minSize, Math.min(100 - y, height + deltaY));
        }
      }
      return { x, y, width, height };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveHandle(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#111111] animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#111111] border-b border-white/10 shrink-0 z-20">
        <h3 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
          <CropIcon size={16} /> Crop Page
        </h3>
        <div className="text-[10px] font-mono text-white/40">
          {Math.round(crop.width)}% x {Math.round(crop.height)}%
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden touch-none select-none bg-[#050505]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div 
          ref={containerRef} 
          className="relative max-w-full max-h-full aspect-[auto] shadow-2xl"
        >
          {/* Main Image */}
          <img 
            src={imageUrl} 
            className="max-w-full max-h-[70vh] block object-contain pointer-events-none select-none" 
            draggable={false}
            alt="Crop target"
          />
          
          {/* Darkening Overlay (Outside Crop) */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none">
             {/* The "Hole" */}
             <div 
               className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-content border border-white/30"
               style={{
                 left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%`
               }}
             />
          </div>

          {/* Interactive Crop Box */}
          <div 
            className="absolute cursor-move touch-none"
            style={{
                left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%`
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
             {/* Grid (Rule of Thirds) */}
             <div className="absolute inset-0 flex flex-col pointer-events-none border border-white/80">
                <div className="flex-1 border-b border-white/30" />
                <div className="flex-1 border-b border-white/30" />
                <div className="flex-1" />
             </div>
             <div className="absolute inset-0 flex pointer-events-none">
                <div className="flex-1 border-r border-white/30" />
                <div className="flex-1 border-r border-white/30" />
                <div className="flex-1" />
             </div>

             {/* Corner Handles (Large hit targets for touch) */}
             <div className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center cursor-nw-resize z-30" onPointerDown={(e) => handlePointerDown(e, 'nw')}>
                <div className="w-4 h-4 bg-white border border-black shadow-sm" />
             </div>
             <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center cursor-ne-resize z-30" onPointerDown={(e) => handlePointerDown(e, 'ne')}>
                <div className="w-4 h-4 bg-white border border-black shadow-sm" />
             </div>
             <div className="absolute -bottom-3 -left-3 w-8 h-8 flex items-center justify-center cursor-sw-resize z-30" onPointerDown={(e) => handlePointerDown(e, 'sw')}>
                <div className="w-4 h-4 bg-white border border-black shadow-sm" />
             </div>
             <div className="absolute -bottom-3 -right-3 w-8 h-8 flex items-center justify-center cursor-se-resize z-30" onPointerDown={(e) => handlePointerDown(e, 'se')}>
                <div className="w-4 h-4 bg-white border border-black shadow-sm" />
             </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-20 md:h-24 bg-[#111111] border-t border-white/10 flex items-center justify-center gap-4 px-6 shrink-0 z-20 pb-safe">
         <motion.button 
            whileTap={buttonTap} 
            onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })} 
            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            title="Reset"
         >
            <RotateCcw size={20} />
         </motion.button>
         
         <div className="w-px h-8 bg-white/10 mx-2" />

         <motion.button 
            whileTap={buttonTap} 
            onClick={onCancel} 
            className="h-12 px-6 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
         >
            Cancel
         </motion.button>

         <motion.button 
            whileTap={buttonTap} 
            onClick={() => onApply(crop.width >= 99 && crop.height >= 99 ? undefined : crop)} 
            className="h-12 px-8 rounded-2xl bg-white text-[#111111] font-bold text-sm shadow-lg shadow-white/10 hover:scale-105 transition-transform flex items-center gap-2"
         >
            <Check size={18} strokeWidth={3} />
            Apply Crop
         </motion.button>
      </div>
    </div>
  );
};
