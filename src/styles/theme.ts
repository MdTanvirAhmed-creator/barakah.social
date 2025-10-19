// Barakah.Social Design System
// Islamic-inspired color palette with modern aesthetics

export const theme = {
  // Color Palette
  colors: {
    // Primary - Deep Teal (represents peace and spirituality)
    primary: {
      50: "#F0FDFA",
      100: "#CCFBF1",
      200: "#99F6E4",
      300: "#5EEAD4",
      400: "#2DD4BF",
      500: "#14B8A6",
      600: "#0F766E", // Main primary
      700: "#0D9488",
      800: "#115E59",
      900: "#134E4A",
      950: "#042F2E",
    },

    // Secondary - Gold Accent (represents prosperity and light)
    secondary: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      200: "#FDE68A",
      300: "#FCD34D",
      400: "#FBBF24",
      500: "#F59E0B", // Main secondary
      600: "#D97706",
      700: "#B45309",
      800: "#92400E",
      900: "#78350F",
      950: "#451A03",
    },

    // Neutral - Warm grays
    neutral: {
      50: "#FAFAF9",
      100: "#F5F5F4",
      200: "#E7E5E4",
      300: "#D6D3D1",
      400: "#A8A29E",
      500: "#78716C",
      600: "#57534E",
      700: "#44403C",
      800: "#292524",
      900: "#1C1917",
      950: "#0C0A09",
    },

    // Success - Green (represents growth and blessings)
    success: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      200: "#BBF7D0",
      300: "#86EFAC",
      400: "#4ADE80",
      500: "#10B981", // Main success
      600: "#059669",
      700: "#047857",
      800: "#065F46",
      900: "#064E3B",
      950: "#022C22",
    },

    // Warning - Amber
    warning: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      200: "#FDE68A",
      300: "#FCD34D",
      400: "#FBBF24",
      500: "#F59E0B",
      600: "#D97706",
      700: "#B45309",
      800: "#92400E",
      900: "#78350F",
    },

    // Error - Soft Red (gentle, not harsh)
    error: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      200: "#FECACA",
      300: "#FCA5A5",
      400: "#F87171",
      500: "#EF4444", // Main error
      600: "#DC2626",
      700: "#B91C1C",
      800: "#991B1B",
      900: "#7F1D1D",
      950: "#450A0A",
    },

    // Info - Blue
    info: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
    },

    // Background colors
    background: {
      primary: "#FAFAF9",
      secondary: "#F5F5F4",
      tertiary: "#FFFFFF",
      dark: "#1C1917",
      darkSecondary: "#292524",
      darkTertiary: "#44403C",
    },

    // Text colors
    text: {
      primary: "#1C1917",
      secondary: "#57534E",
      tertiary: "#78716C",
      inverse: "#FAFAF9",
      disabled: "#A8A29E",
      link: "#0F766E",
      linkHover: "#0D9488",
    },

    // Border colors
    border: {
      light: "#E7E5E4",
      medium: "#D6D3D1",
      dark: "#A8A29E",
      focus: "#0F766E",
      error: "#EF4444",
    },

    // Surface colors (for cards, modals, etc.)
    surface: {
      light: "#FFFFFF",
      medium: "#F5F5F4",
      dark: "#E7E5E4",
      elevated: "#FFFFFF",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
  },

  // Typography System
  typography: {
    // Font families
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      secondary: "'Amiri', 'Traditional Arabic', 'Times New Roman', serif",
      mono: "'Fira Code', 'Courier New', monospace",
    },

    // Font sizes with line heights
    fontSize: {
      xs: { size: "0.75rem", lineHeight: "1rem" }, // 12px
      sm: { size: "0.875rem", lineHeight: "1.25rem" }, // 14px
      base: { size: "1rem", lineHeight: "1.5rem" }, // 16px
      lg: { size: "1.125rem", lineHeight: "1.75rem" }, // 18px
      xl: { size: "1.25rem", lineHeight: "1.875rem" }, // 20px
      "2xl": { size: "1.5rem", lineHeight: "2rem" }, // 24px
      "3xl": { size: "1.875rem", lineHeight: "2.25rem" }, // 30px
      "4xl": { size: "2.25rem", lineHeight: "2.5rem" }, // 36px
      "5xl": { size: "3rem", lineHeight: "1" }, // 48px
      "6xl": { size: "3.75rem", lineHeight: "1" }, // 60px
      "7xl": { size: "4.5rem", lineHeight: "1" }, // 72px
      "8xl": { size: "6rem", lineHeight: "1" }, // 96px
      "9xl": { size: "8rem", lineHeight: "1" }, // 128px
    },

    // Font weights
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },

    // Letter spacing
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },

    // Line heights
    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },

  // Spacing Scale (4px base)
  spacing: {
    0: "0px",
    0.5: "2px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    3.5: "14px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px",
    11: "44px",
    12: "48px",
    14: "56px",
    16: "64px",
    20: "80px",
    24: "96px",
    28: "112px",
    32: "128px",
    36: "144px",
    40: "160px",
    44: "176px",
    48: "192px",
    52: "208px",
    56: "224px",
    60: "240px",
    64: "256px",
    72: "288px",
    80: "320px",
    96: "384px",
  },

  // Border Radius Tokens
  borderRadius: {
    none: "0px",
    xs: "2px",
    sm: "4px",
    base: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
    circle: "50%",
  },

  // Border Width
  borderWidth: {
    0: "0px",
    1: "1px",
    2: "2px",
    4: "4px",
    8: "8px",
  },

  // Shadow System (elevation levels)
  shadows: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
    
    // Colored shadows for emphasis
    primary: "0 10px 15px -3px rgba(15, 118, 110, 0.2), 0 4px 6px -4px rgba(15, 118, 110, 0.1)",
    secondary: "0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -4px rgba(245, 158, 11, 0.1)",
    success: "0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -4px rgba(16, 185, 129, 0.1)",
    error: "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)",
  },

  // Animation & Transition Tokens
  animation: {
    // Durations
    duration: {
      instant: "75ms",
      fast: "150ms",
      base: "200ms",
      moderate: "300ms",
      slow: "500ms",
      slower: "700ms",
      slowest: "1000ms",
    },

    // Timing functions (easing)
    timingFunction: {
      linear: "linear",
      ease: "ease",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      // Custom Islamic-inspired easing (smooth and gentle)
      barakah: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },

    // Common transitions
    transition: {
      all: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      colors: "color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      shadow: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    },

    // Keyframe animations
    keyframes: {
      fadeIn: {
        from: { opacity: "0" },
        to: { opacity: "1" },
      },
      fadeOut: {
        from: { opacity: "1" },
        to: { opacity: "0" },
      },
      slideInRight: {
        from: { transform: "translateX(-100%)" },
        to: { transform: "translateX(0)" },
      },
      slideInLeft: {
        from: { transform: "translateX(100%)" },
        to: { transform: "translateX(0)" },
      },
      slideInUp: {
        from: { transform: "translateY(100%)" },
        to: { transform: "translateY(0)" },
      },
      slideInDown: {
        from: { transform: "translateY(-100%)" },
        to: { transform: "translateY(0)" },
      },
      scaleIn: {
        from: { transform: "scale(0.95)", opacity: "0" },
        to: { transform: "scale(1)", opacity: "1" },
      },
      scaleOut: {
        from: { transform: "scale(1)", opacity: "1" },
        to: { transform: "scale(0.95)", opacity: "0" },
      },
      spin: {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" },
      },
      pulse: {
        "0%, 100%": { opacity: "1" },
        "50%": { opacity: "0.5" },
      },
      bounce: {
        "0%, 100%": {
          transform: "translateY(-25%)",
          animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
        },
        "50%": {
          transform: "translateY(0)",
          animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
        },
      },
    },
  },

  // Z-index scale
  zIndex: {
    hide: "-1",
    base: "0",
    dropdown: "1000",
    sticky: "1100",
    fixed: "1200",
    modalBackdrop: "1300",
    modal: "1400",
    popover: "1500",
    tooltip: "1600",
    notification: "1700",
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: "475px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Container sizes
  container: {
    xs: "475px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Icon sizes
  iconSize: {
    xs: "12px",
    sm: "16px",
    base: "20px",
    md: "24px",
    lg: "32px",
    xl: "40px",
    "2xl": "48px",
  },

  // Opacity scale
  opacity: {
    0: "0",
    5: "0.05",
    10: "0.1",
    20: "0.2",
    25: "0.25",
    30: "0.3",
    40: "0.4",
    50: "0.5",
    60: "0.6",
    70: "0.7",
    75: "0.75",
    80: "0.8",
    90: "0.9",
    95: "0.95",
    100: "1",
  },
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeShadows = typeof theme.shadows;

// Helper function to access theme values
export const getThemeValue = (path: string): string => {
  const keys = path.split(".");
  let value: any = theme;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return "";
  }
  
  return typeof value === "string" ? value : "";
};

// Export default
export default theme;

