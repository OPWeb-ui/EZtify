import { Variants } from 'framer-motion';

// Founder Signature Easing: Fast entrance, very soft exit. 
// Matches the CSS cubic-bezier(0.16, 1, 0.3, 1)
const signatureEase = [0.16, 1, 0.3, 1];

export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: signatureEase } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: "easeIn" } 
  }
};

// Micro-interactions
export const buttonTap = { scale: 0.98 }; // Subtler tap

export const buttonHover = { 
  scale: 1.02, 
  transition: { duration: 0.2, ease: signatureEase } 
};

export const cardHover = { 
  y: -4, 
  transition: { duration: 0.3, ease: signatureEase } 
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Faster stagger for perceived speed
      delayChildren: 0.05
    }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: signatureEase } 
  }
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: signatureEase } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    y: 4, 
    transition: { duration: 0.15, ease: "easeOut" } 
  }
};

// Reusable Button Style Variants
export const primaryButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.01, filter: "brightness(1.05)", transition: { duration: 0.2, ease: signatureEase } },
  tap: { scale: 0.98 }
};

export const secondaryButtonVariants = {
  initial: { scale: 1, backgroundColor: "rgba(255, 255, 255, 0.8)" },
  hover: { 
    scale: 1.01, 
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderColor: "rgba(124, 58, 237, 0.3)",
    transition: { duration: 0.2, ease: signatureEase }
  },
  tap: { scale: 0.98 }
};

export const iconButtonVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.05, backgroundColor: "rgba(124, 58, 237, 0.1)", transition: { duration: 0.2, ease: signatureEase } },
  tap: { scale: 0.95 }
};