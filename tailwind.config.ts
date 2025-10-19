import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Colors - Islamic-inspired palette
      colors: {
        // Base colors using CSS variables
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: {
          DEFAULT: "rgb(var(--foreground) / <alpha-value>)",
          secondary: "rgb(var(--foreground-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--foreground-tertiary) / <alpha-value>)",
          inverse: "rgb(var(--foreground-inverse) / <alpha-value>)",
        },
        
        // Primary - Deep Teal
        primary: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0F766E",
          700: "#0D9488",
          800: "#115E59",
          900: "#134E4A",
          DEFAULT: "#0F766E",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        
        // Secondary - Gold
        secondary: {
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
          DEFAULT: "#F59E0B",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        
        // Semantic colors
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          DEFAULT: "#10B981",
        },
        
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          DEFAULT: "#EF4444",
        },
        
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
          DEFAULT: "#F59E0B",
        },
        
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
          DEFAULT: "#3B82F6",
        },
        
        // Component colors
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        
        // Borders and inputs
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      
      // Border radius with Islamic-inspired naming
      borderRadius: {
        xs: "0.125rem",
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      
      // Font families
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["Amiri", "Traditional Arabic", "Times New Roman", "serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },
      
      // Box shadows with elevation system
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none",
        
        // Colored shadows
        "primary": "0 10px 15px -3px rgb(15 118 110 / 0.2), 0 4px 6px -4px rgb(15 118 110 / 0.1)",
        "secondary": "0 10px 15px -3px rgb(245 158 11 / 0.2), 0 4px 6px -4px rgb(245 158 11 / 0.1)",
        "success": "0 10px 15px -3px rgb(16 185 129 / 0.2), 0 4px 6px -4px rgb(16 185 129 / 0.1)",
        "error": "0 10px 15px -3px rgb(239 68 68 / 0.2), 0 4px 6px -4px rgb(239 68 68 / 0.1)",
      },
      
      // Animation & transitions
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        moderate: "300ms",
        slow: "500ms",
      },
      
      transitionTimingFunction: {
        barakah: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      
      // Keyframes
      keyframes: {
        // Radix UI animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        
        // Custom animations
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-down": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      
      // Animations
      animation: {
        // Radix UI
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        
        // Custom
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-left": "slide-in-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-up": "slide-in-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-down": "slide-in-down 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-in": "scale-in 0.2s ease-in-out",
        "scale-out": "scale-out 0.2s ease-in-out",
        "spin": "spin 1s linear infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

