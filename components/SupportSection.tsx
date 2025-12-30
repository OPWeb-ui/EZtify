import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Mail, Copy, Check, Send, ArrowUpRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLayoutContext } from './Layout';

// Physics for the Trigger Button entry/idle
const jumpSpring = {
  type: "spring",
  stiffness: 600,
  damping: 25,
  mass: 1,
  restDelta: 0.001
};

// Physics for the 1-second shrinking ticks
const shrinkSpring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  mass: 0.5
};

// Physics for the Support Box modal
const boxTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1]
};

export const SupportSection: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [idleTick, setIdleTick] = useState(0); 
  const [isCopied, setIsCopied] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAwakeRef = useRef(true);
  const email = "eztifyapps@gmail.com";

  // Strictly restrict visibility to Landing, About, and FAQ (Help)
  const allowedPaths = ['/', '/about', '/faq'];
  const isPathAllowed = allowedPaths.includes(location.pathname);

  const wakeUp = useCallback(() => {
    // Restore presence instantly
    if (!isAwakeRef.current || !isVisible) {
      setIsVisible(true);
      setIdleTick(0);
      isAwakeRef.current = true;
    } else if (idleTick !== 0) {
      setIdleTick(0);
    }
    
    // Clear current countdown
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Initiate shrinking sequence if workspace remains idle
    if (!isOpen) {
      intervalRef.current = setInterval(() => {
        setIdleTick(prev => {
          if (prev >= 4) {
            setIsVisible(false);
            isAwakeRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 5;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [isOpen, isVisible, idleTick]);

  useEffect(() => {
    if (!isPathAllowed) return;

    // Listen to global events for idle reset
    const handleInteraction = () => wakeUp();

    window.addEventListener('scroll', handleInteraction, { passive: true, capture: true });
    window.addEventListener('mousemove', handleInteraction, { passive: true });
    window.addEventListener('mousedown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });

    wakeUp(); 

    return () => {
      window.removeEventListener('scroll', handleInteraction, { capture: true });
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [wakeUp, isPathAllowed]);

  // Handle modal state changes
  useEffect(() => {
    if (!isPathAllowed) return;
    
    if (isOpen) {
      setIsVisible(true);
      isAwakeRef.current = true;
      setIdleTick(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      wakeUp();
    }
  }, [isOpen, wakeUp, isPathAllowed]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2400);
    } catch (err) {
      console.error('Copy failed');
    }
  };

  // If path is not allowed (e.g. in a tool workspace), do not render
  if (!isPathAllowed) return null;

  // Trigger variants
  const triggerVariants = {
    initial: { 
      y: 100, 
      scale: 0.5, 
      opacity: 0 
    },
    visible: (tick: number) => ({
      y: 0,
      scale: 1 - (tick * 0.08),
      opacity: 1,
      backgroundColor: `rgba(17, 17, 17, ${0.9 - (tick * 0.1)})`,
      backdropFilter: `blur(${24 - (tick * 4)}px)`,
      transition: {
        y: jumpSpring,
        scale: shrinkSpring,
        opacity: { duration: 0.2 }
      }
    }),
    hidden: {
      y: [0, -35, 150], // Anticipation hop then drop
      scale: [null, 1.1, 0.4],
      opacity: [1, 1, 0],
      transition: {
        y: { times: [0, 0.3, 1], duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        scale: { times: [0, 0.3, 1], duration: 0.7 },
        opacity: { times: [0, 0.7, 1], duration: 0.7 }
      }
    }
  };

  return (
    <>
      {/* 1. SUPPORT BOX (MODAL) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1500] flex items-end justify-end p-6 md:p-8 pointer-events-none isolate">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-stone-900/10 backdrop-blur-[4px] pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={boxTransition}
              className="relative w-full max-w-[340px] bg-white border border-stone-200/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] rounded-[2.5rem] overflow-hidden pointer-events-auto mb-20 md:mb-24"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#111111] flex items-center justify-center text-white shadow-md shrink-0">
                      <Mail size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-[#111111] tracking-tight">Support</h3>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 text-stone-300 hover:text-[#111111] hover:bg-stone-50 rounded-full transition-all duration-200"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                </div>

                <p className="text-[14px] text-stone-500 font-medium leading-[1.6] mb-8">
                  Questions about document processing or a new feature? Our team is here to help.
                </p>

                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.location.href = `mailto:${email}`}
                    className="w-full h-14 bg-[#111111] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:opacity-90 active:opacity-100 transition-all duration-200"
                  >
                    <Send size={18} strokeWidth={2.5} />
                    <span>Send Message</span>
                  </motion.button>

                  <div className="relative">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopy}
                      className="w-full h-14 bg-stone-50 text-stone-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-100 transition-all duration-200 border border-stone-100"
                    >
                      <AnimatePresence mode="wait">
                        {isCopied ? (
                          <motion.div 
                            key="copied"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2 text-accent-lime"
                          >
                            <Check size={18} strokeWidth={3} />
                            <span>Copied</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="copy"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <Copy size={18} strokeWidth={2.2} />
                            <span>Copy Email</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono truncate">{email}</span>
                <ArrowUpRight size={14} className="text-stone-300" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. THE JUMPING & SHRINKING TRIGGER */}
      <motion.button
        layout
        initial="initial"
        animate={isVisible ? "visible" : "hidden"}
        variants={triggerVariants}
        custom={idleTick}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={isVisible ? { 
          scale: 1.1, 
          y: -5,
          backgroundColor: "rgba(0, 0, 0, 1)",
          transition: jumpSpring
        } : {}}
        whileTap={{ scale: 0.9 }}
        className={`
          fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[1600] 
          text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center 
          overflow-hidden border border-white/10 select-none w-14 h-14 md:w-16 md:h-16 rounded-full
          ${isOpen ? 'ring-[10px] ring-black/5' : ''}
          ${!isVisible && !isOpen ? 'pointer-events-none' : 'pointer-events-auto'}
        `}
      >
        <motion.div 
          layout 
          className="relative flex items-center justify-center w-full h-full"
        >
          <MessageCircle 
            size={24} 
            strokeWidth={2.5} 
            className={`transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'rotate-[360deg] scale-110' : ''}`}
          />
        </motion.div>
      </motion.button>
    </>
  );
};