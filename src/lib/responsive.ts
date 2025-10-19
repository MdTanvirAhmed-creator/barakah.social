// Responsive design utilities and breakpoints

export const breakpoints = {
  sm: 640,  // Small devices (phones)
  md: 768,  // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices
  "2xl": 1536, // 2X large devices
} as const;

// Touch target minimum size (accessibility)
export const TOUCH_TARGET_MIN_SIZE = 44; // 44px x 44px (WCAG 2.1 AAA)

// Tap target padding helper
export const tapTarget = "min-h-[44px] min-w-[44px] p-2";

// Responsive font sizes
export const responsiveText = {
  xs: "text-xs sm:text-sm",
  sm: "text-sm sm:text-base",
  base: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
  xl: "text-xl sm:text-2xl",
  "2xl": "text-2xl sm:text-3xl",
  "3xl": "text-3xl sm:text-4xl md:text-5xl",
  "4xl": "text-4xl sm:text-5xl md:text-6xl",
};

// Responsive spacing
export const responsiveSpacing = {
  xs: "p-2 sm:p-3",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
  xl: "p-8 sm:p-12",
};

// Container responsive classes
export const responsiveContainer = "px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto";

// Grid responsive classes
export const responsiveGrid = {
  cols2: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
  cols3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
  cols4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
};

// Hook to detect current breakpoint
export function useBreakpoint() {
  if (typeof window === "undefined") return "md";

  const getBreakpoint = () => {
    const width = window.innerWidth;
    if (width < breakpoints.sm) return "xs";
    if (width < breakpoints.md) return "sm";
    if (width < breakpoints.lg) return "md";
    if (width < breakpoints.xl) return "lg";
    if (width < breakpoints["2xl"]) return "xl";
    return "2xl";
  };

  return getBreakpoint();
}

// Hook to detect if mobile
export function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < breakpoints.md;
}

// Hook to detect touch device
export function useIsTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// Swipe gesture detection
export const swipeGestures = {
  left: {
    onPanEnd: (event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x < -50 || info.velocity.x < -500) {
        return "left";
      }
    },
  },
  right: {
    onPanEnd: (event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x > 50 || info.velocity.x > 500) {
        return "right";
      }
    },
  },
  up: {
    onPanEnd: (event: any, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y < -50 || info.velocity.y < -500) {
        return "up";
      }
    },
  },
  down: {
    onPanEnd: (event: any, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y > 50 || info.velocity.y > 500) {
        return "down";
      }
    },
  },
};

// Pull-to-refresh configuration
export const pullToRefreshConfig = {
  drag: "y" as const,
  dragConstraints: { top: 0, bottom: 100 },
  dragElastic: 0.2,
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    if (info.offset.y > 80 || info.velocity.y > 500) {
      return true; // Trigger refresh
    }
    return false;
  },
};

// Responsive image sizes attribute
export const responsiveImageSizes = {
  avatar: "(max-width: 640px) 40px, (max-width: 768px) 48px, 64px",
  cover: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  full: "100vw",
  half: "(max-width: 768px) 100vw, 50vw",
  third: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
};

// Viewport height fix for mobile browsers (100vh issues)
export function setVHProperty() {
  if (typeof window === "undefined") return;

  const setHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setHeight();
  window.addEventListener("resize", setHeight);
  window.addEventListener("orientationchange", setHeight);
}

// Safe area insets for notched devices
export const safeAreaInsets = {
  top: "pt-safe",
  bottom: "pb-safe",
  left: "pl-safe",
  right: "pr-safe",
  all: "p-safe",
};

// Add to global CSS:
// @supports (padding-top: env(safe-area-inset-top)) {
//   .pt-safe { padding-top: env(safe-area-inset-top); }
//   .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
//   .pl-safe { padding-left: env(safe-area-inset-left); }
//   .pr-safe { padding-right: env(safe-area-inset-right); }
// }
