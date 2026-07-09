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
        background: {
          DEFAULT: "rgb(var(--background) / <alpha-value>)",
          secondary: "rgb(var(--background-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--background-tertiary) / <alpha-value>)",
        },
        foreground: {
          DEFAULT: "rgb(var(--foreground) / <alpha-value>)",
          secondary: "rgb(var(--foreground-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--foreground-tertiary) / <alpha-value>)",
          inverse: "rgb(var(--foreground-inverse) / <alpha-value>)",
        },
        
        // Primary - Zellij teal (the working accent)
        primary: {
          50: "#E6F2F0",
          100: "#C7E4DF",
          200: "#96CCC4",
          300: "#62B0A5",
          400: "#3B978A",
          500: "#1C7F72",
          600: "#17685E",
          700: "#12524A",
          800: "#0D3D37",
          900: "#092A26",
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        
        // Secondary - Gold leaf (illumination, rare marks — never buttons)
        secondary: {
          50: "#F7F1E1",
          100: "#EDE0BD",
          200: "#DDC78A",
          300: "#CCAD58",
          400: "#BE9A3F",
          500: "#B0872A",
          600: "#927022",
          700: "#735819",
          800: "#564213",
          900: "#3A2C0C",
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        
        // Semantic colors
        success: {
          50: "#E8F2EF",
          100: "#C9E2DB",
          200: "#9BC8BC",
          300: "#6DAD9C",
          400: "#489382",
          500: "#2E7D6B",
          600: "#266657",
          700: "#1E5045",
          800: "#163B33",
          900: "#0F2822",
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
        },
        
        error: {
          50: "#F7EDEC",
          100: "#EBD4D3",
          200: "#D9ABA9",
          300: "#C78280",
          400: "#BC6966",
          500: "#B0504C",
          600: "#92413E",
          700: "#733331",
          800: "#552524",
          900: "#381817",
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
        },
        
        warning: {
          50: "#F7F1E1",
          100: "#EDE0BD",
          200: "#DDC78A",
          300: "#CCAD58",
          400: "#BE9A3F",
          500: "#B0872A",
          600: "#927022",
          700: "#735819",
          800: "#564213",
          900: "#3A2C0C",
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
        },
        
        info: {
          50: "#EAF0F8",
          100: "#CCDCEE",
          200: "#A3C0DF",
          300: "#6F9CCB",
          400: "#4A7DB8",
          500: "#2B5FA6",
          600: "#234E88",
          700: "#1C3E6C",
          800: "#142E50",
          900: "#0D1F36",
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
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
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        reading: ["var(--font-reading)", "Georgia", "serif"],
        arabic: ["var(--font-arabic)", "Traditional Arabic", "serif"],
        "arabic-display": ["var(--font-arabic-display)", "var(--font-arabic)", "serif"],
        "arabic-ui": ["var(--font-arabic-ui)", "var(--font-arabic)", "serif"],
        quran: ["var(--font-quran)", "var(--font-arabic)", "serif"],
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
        
        // Luminance, not weight: the lapis glow and gold-leaf light
        "primary": "var(--glow)",
        "glow": "var(--glow)",
        "glow-leaf": "var(--glow-leaf)",
        "focus-ring": "var(--focus-ring)",
        "secondary": "var(--glow-leaf)",
        "success": "0 6px 16px -4px rgb(78 140 106 / 0.25)",
        "error": "0 6px 16px -4px rgb(181 81 78 / 0.25)",
      },
      
      // Animation & transitions
      transitionDuration: {
        fast: "180ms",
        DEFAULT: "180ms",
        quick: "180ms",
        moderate: "280ms",
        slow: "420ms",
        arrival: "700ms",
      },
      
      transitionTimingFunction: {
        // sakina: gentle ease-out, no overshoot, no bounce
        sakina: "cubic-bezier(0.22, 1, 0.36, 1)",
        barakah: "cubic-bezier(0.22, 1, 0.36, 1)",
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
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-left": "slide-in-left 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-up": "slide-in-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-down": "slide-in-down 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
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

