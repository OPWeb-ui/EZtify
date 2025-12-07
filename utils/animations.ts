import { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.99, 
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

// Standard button tap/hover physics
export const buttonTap = { scale: 0.95 };
export const buttonHover = { 
  scale: 1.05, 
  transition: { type: "spring", stiffness: 400, damping: 17 } 
};

export const cardHover = { 
  y: -4, 
  transition: { type: "spring", stiffness: 300, damping: 20 } 
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 50, damping: 20 } 
  }
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", duration: 0.4, bounce: 0.3 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10, 
    transition: { duration: 0.2 } 
  }
};

// Reusable Button Style Variants
export const primaryButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, filter: "brightness(1.05)" },
  tap: { scale: 0.96 }
};

export const secondaryButtonVariants = {
  initial: { scale: 1, backgroundColor: "rgba(255, 255, 255, 0.8)" },
  hover: { 
    scale: 1.03, 
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderColor: "rgba(139, 92, 246, 0.3)"
  },
  tap: { scale: 0.96 }
};

export const iconButtonVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, backgroundColor: "rgba(139, 92, 246, 0.1)" },
  tap: { scale: 0.9 }
};
