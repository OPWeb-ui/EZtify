
import { Variants } from 'framer-motion';

// --- EASING FUNCTIONS ---
// 'Tech' ease: Fast initial acceleration, precise mechanical deceleration.
export const techEase = [0.22, 1, 0.36, 1]; // "Apple-esque" mechanical snap

// --- SPRING CONFIGS ---
export const springFast = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
export const springMedium = { type: "spring", stiffness: 350, damping: 30, mass: 1 };
export const springSlow = { type: "spring", stiffness: 150, damping: 20 };

// --- STANDARD TRANSITIONS ---
export const standardLayoutTransition = { duration: 0.3, ease: techEase };

// --- INTERACTION VARIANTS ---
export const buttonTap = { scale: 0.97 };

export const buttonHover = { 
  scale: 1.02,
  transition: { duration: 0.2, ease: techEase }
};

export const cardHover = { 
  y: -4,
  boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.15)",
  transition: { duration: 0.3, ease: techEase }
};

// --- PAGE TRANSITIONS ---
export const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 8, 
    scale: 0.995, 
    filter: 'blur(2px)' 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    zIndex: 1,
    transition: { duration: 0.4, ease: techEase } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.995,
    filter: 'blur(2px)',
    zIndex: 0,
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

// --- CONTAINER STAGGERING ---
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

// --- ELEMENT REVEALS ---
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: techEase } 
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: techEase } 
  }
};

// --- MODAL / DIALOG ---
export const modalOverlayVariants: Variants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: { opacity: 1, backdropFilter: 'blur(4px)', transition: { duration: 0.3, ease: techEase } },
    exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.2, ease: "easeOut" } }
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 350, damping: 25 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.15, ease: "easeOut" } 
  }
};

// --- TOAST ---
export const toastVariants: Variants = {
    initial: { opacity: 0, x: 20, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.95, x: 20, transition: { duration: 0.2 } }
};

// --- LOADER ---
export const loaderVariants: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: techEase } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};
