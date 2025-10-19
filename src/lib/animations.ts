import { Variants } from "framer-motion";

// Page transition variants
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Slide in from right (for modals, panels)
export const slideInRight: Variants = {
  initial: {
    x: "100%",
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Slide up (for bottom sheets)
export const slideUp: Variants = {
  initial: {
    y: "100%",
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Scale animation (for modals)
export const scaleIn: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Fade animation
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// Card hover effects
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
  },
};

// Button tap effect
export const buttonTap = {
  whileTap: { scale: 0.95 },
  transition: { duration: 0.1 },
};

// Bounce animation for notifications
export const bounce: Variants = {
  initial: {
    scale: 0,
    y: 50,
  },
  animate: {
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Shake animation for errors
export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// Pulse animation for notifications/badges
export const pulse = {
  scale: [1, 1.1, 1],
  transition: {
    repeat: Infinity,
    duration: 2,
  },
};

// Flip card animation
export const flipCard: Variants = {
  initial: { rotateY: 0 },
  flip: {
    rotateY: 180,
    transition: { duration: 0.6 },
  },
};

// Expand/collapse animation
export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
};

// Gradient shift animation for backgrounds
export const gradientShift = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Toast notification variants
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.3,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

// Swipe-to-dismiss variants
export const swipeToDismiss = {
  drag: "x" as const,
  dragConstraints: { left: 0, right: 300 },
  dragElastic: 0.2,
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      return true; // Trigger dismiss
    }
    return false;
  },
};

// Tab switch animation
export const tabAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2 },
};

// Number count-up animation
export function createCountUpAnimation(from: number, to: number) {
  return {
    initial: { count: from },
    animate: { count: to },
    transition: { duration: 1, ease: "easeOut" },
  };
}
