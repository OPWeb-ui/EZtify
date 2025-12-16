
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { Tool } from '../utils/tool-list';

interface ToolCarouselProps {
  title: string;
  tools: Tool[];
}

export const ToolCarousel: React.FC<ToolCarouselProps> = ({ title, tools }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Handle Scroll Buttons
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check scroll position to toggle arrows
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Convert Vertical Wheel Scroll to Horizontal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is scrolling vertically, hijack it for horizontal scroll
      if (e.deltaY !== 0) {
        // Prevent default only if we can actually scroll in that direction
        // This ensures natural page scrolling if we hit the edge
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;
        
        if (
          (e.deltaY > 0 && scrollLeft < maxScroll) || 
          (e.deltaY < 0 && scrollLeft > 0)
        ) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    
    // Initial Check
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    el.addEventListener('scroll', checkScrollPosition);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScrollPosition);
      el.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  return (
    <div className="w-full py-6 md:py-8 group/carousel">
      {/* Section Title */}
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="px-4 md:px-12 mb-4 md:mb-6 text-xl md:text-2xl font-heading font-bold text-charcoal-800 dark:text-white flex items-center gap-3"
      >
        {title}
        <div className="h-px flex-1 bg-slate-200 dark:bg-charcoal-800 ml-4" />
      </motion.h2>

      <div className="relative">
        
        {/* Left Arrow */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 md:w-16 z-20 bg-gradient-to-r from-pastel-bg dark:from-charcoal-950 to-transparent flex items-center justify-start pl-2 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll('left')}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-charcoal-700 flex items-center justify-center text-charcoal-700 dark:text-white hover:bg-brand-purple hover:text-white dark:hover:bg-brand-purple transition-colors"
          >
            <ChevronLeft size={20} />
          </motion.button>
        </div>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="
            flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory 
            px-4 md:px-12 pb-8 pt-2
            scrollbar-hide scroll-smooth
          "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <motion.div 
            className="flex gap-4 md:gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "100px" }}
            variants={{
              visible: {
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} className="w-48 aspect-square flex-shrink-0" />
            ))}
          </motion.div>
        </div>

        {/* Right Arrow */}
        <div className={`absolute right-0 top-0 bottom-0 w-12 md:w-16 z-20 bg-gradient-to-l from-pastel-bg dark:from-charcoal-950 to-transparent flex items-center justify-end pr-2 transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => scroll('right')}
             className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-charcoal-700 flex items-center justify-center text-charcoal-700 dark:text-white hover:bg-brand-purple hover:text-white dark:hover:bg-brand-purple transition-colors"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>

      </div>
    </div>
  );
};