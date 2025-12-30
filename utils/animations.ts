
// --- GLOBAL MOTION TOKENS ---
// Reference: Linear / Apple Design Systems
// Constraint: Precise, Engineered, Physically Believable

export const motionTokens = {
  duration: {
    instant: 0,
    fast: 0.12, 
    base: 0.16, 
    slow: 0.22, 
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as const, 
    linear: "linear" as const,
  },
  translate: {
    sm: 4,
    md: 8,
  }
};

// --- PHYSICAL SPRING TOKENS ---
// These define the "weight" and "friction" of the UI elements
export const physicalSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 35,
  mass: 0.8,
  restDelta: 0.001
};

export const heavySpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 1.2
};

export const bouncySpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 1
};

// --- STANDARD TRANSITIONS ---
export const standardLayoutTransition = { 
  duration: motionTokens.duration.base, 
  ease: motionTokens.ease.out 
};

// --- INTERACTION VARIANTS ---
// Tactical feedback for buttons and cards
export const buttonTap = { 
  scale: 0.96,
  transition: physicalSpring
};

export const cardHover = { 
  y: -6,
  scale: 1.01,
  transition: physicalSpring
};

// --- TOAST ANIMATIONS ---
export const toastVariants = {
  initial: { opacity: 0, y: motionTokens.translate.md },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: physicalSpring 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 } 
  }
};

// --- PAGE TRANSITIONS ---
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: motionTokens.ease.out } 
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 } 
  }
};

// --- MODAL / DIALOG ---
export const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0 }
};

export const modalContentVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: physicalSpring 
  },
  exit: { 
    opacity: 0, 
    y: 10,
    scale: 0.98, 
    transition: { duration: 0.2 } 
  }
};

// --- STAGGER ---
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: physicalSpring 
  }
};
