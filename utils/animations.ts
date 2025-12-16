
// --- GLOBAL MOTION TOKENS ---
// Reference: Linear Design System
// Constraint: Precise, Engineered, Non-decorative

export const motionTokens = {
  duration: {
    instant: 0,
    fast: 0.12, // 120ms - Exits, micro-interactions
    base: 0.16, // 160ms - Standard UI changes, Toasts
    slow: 0.22, // 220ms - Large layout shifts
  },
  ease: {
    // The "Linear" curve: Quick acceleration, precise snapping finish
    out: [0.16, 1, 0.3, 1] as const, 
    linear: "linear" as const,
  },
  translate: {
    sm: 4,
    md: 8,
  }
};

// Export commonly used easing for manual transitions
export const techEase = motionTokens.ease.out;

// --- STANDARD TRANSITIONS ---
// Use this for almost all UI elements
export const standardLayoutTransition = { 
  duration: motionTokens.duration.base, 
  ease: motionTokens.ease.out 
};

// --- INTERACTION VARIANTS ---
// Subtle, non-intrusive feedback
export const buttonTap = { 
  opacity: 0.8,
  scale: 0.99, // Extremely subtle scale
  transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.out }
};

export const cardHover = { 
  y: -2, // Minimal lift
  transition: { duration: motionTokens.duration.base, ease: motionTokens.ease.out }
};

// --- TOAST ANIMATIONS (STRICT) ---
export const toastVariants = {
  initial: { 
    opacity: 0, 
    y: motionTokens.translate.md,
    scale: 1 // No scale pop
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: motionTokens.duration.base, 
      ease: motionTokens.ease.out 
    } 
  },
  exit: { 
    opacity: 0, 
    y: motionTokens.translate.sm, 
    scale: 1,
    transition: { 
      duration: motionTokens.duration.fast, 
      ease: motionTokens.ease.out 
    } 
  }
};

// --- PAGE TRANSITIONS ---
export const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 4,
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: motionTokens.duration.slow, ease: motionTokens.ease.out } 
  },
  exit: { 
    opacity: 0, 
    y: -4,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.out } 
  }
};

// --- MODAL / DIALOG ---
export const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: motionTokens.duration.base } },
    exit: { opacity: 0, transition: { duration: motionTokens.duration.fast } }
};

export const modalContentVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: motionTokens.duration.base, ease: motionTokens.ease.out } 
  },
  exit: { 
    opacity: 0, 
    y: 4,
    scale: 0.98, 
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.out } 
  }
};

// --- STAGGER ---
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Tighter stagger
      delayChildren: 0.01
    }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: motionTokens.duration.base, ease: motionTokens.ease.out } 
  }
};
