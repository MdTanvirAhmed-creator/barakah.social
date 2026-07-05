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
        
        // Primary - Lapis lazuli (luminous, the identity accent)
        primary: {
          50: "#EFF4FB",
          100: "#DCE7F6",
          200: "#BDD1EC",
          300: "#6E9BD8",
          400: "#5480C4",
          500: "#3E6DB5",
          600: "#33599A",
          700: "#2A4A80",
          800: "#223A66",
          900: "#1A2C4E",
          DEFAULT: "#3E6DB5",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        
        // Secondary - Gold leaf (illumination, used sparingly)
        secondary: {
          50: "#FAF5E8",
          100: "#F2E7C8",
          200: "#E5D095",
          300: "#D8BC6E",
          400: "#D0AF5B",
          500: "#C9A24B",
          600: "#A98538",
          700: "#86682B",
          800: "#654E20",
          900: "#453516",
          DEFAULT: "#C9A24B",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        
        // Semantic colors
        success: {
          50: "#EEF5F0",
          100: "#D6E7DC",
          200: "#AFCFBB",
          300: "#87B69A",
          400: "#68A182",
          500: "#4E8C6A",
          600: "#3F7256",
          700: "#325A45",
          800: "#254333",
          900: "#182D22",
          DEFAULT: "#4E8C6A",
        },
        
        error: {
          50: "#F8EEED",
          100: "#EDD6D5",
          200: "#DBAEAC",
          300: "#CA8683",
          400: "#BF6B68",
          500: "#B5514E",
          600: "#96413F",
          700: "#763331",
          800: "#572524",
          900: "#391817",
          DEFAULT: "#B5514E",
        },
        
        warning: {
          50: "#F9F1E6",
          100: "#EFDCC2",
          200: "#DFBC88",
          300: "#D0A35F",
          400: "#C8964E",
          500: "#C08A3E",
          600: "#9E7133",
          700: "#7C5928",
          800: "#5A401D",
          900: "#3B2A13",
          DEFAULT: "#C08A3E",
        },
        
        info: {
          50: "#EFF4FB",
          100: "#DCE7F6",
          200: "#BDD1EC",
          300: "#6E9BD8",
          400: "#5480C4",
          500: "#3E6DB5",
          600: "#33599A",
          700: "#2A4A80",
          800: "#223A66",
          900: "#1A2C4E",
          DEFAULT: "#6E9BD8",
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

