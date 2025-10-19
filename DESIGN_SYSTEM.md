# Barakah.Social Design System 🎨

## Islamic-Inspired, Modern, Accessible

---

## 📚 Table of Contents

1. [Philosophy](#philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Shadows & Elevation](#shadows--elevation)
7. [Animations](#animations)
8. [Accessibility](#accessibility)
9. [Dark Mode](#dark-mode)
10. [Usage Examples](#usage-examples)

---

## Philosophy

The Barakah.Social design system is inspired by Islamic principles of harmony, balance, and beauty while maintaining modern web standards and accessibility best practices.

### Core Principles:
- **Peace & Tranquility**: Deep teal (#0F766E) represents spiritual calm
- **Prosperity & Light**: Gold accent (#F59E0B) symbolizes enlightenment
- **Warmth**: Neutral grays with warm undertones for comfortable reading
- **Accessibility**: WCAG 2.1 AA compliant color contrasts
- **RTL Support**: Prepared for Arabic and other RTL languages

---

## Color Palette

### Primary Colors - Deep Teal 🌊

The primary color represents peace, spirituality, and growth.

```typescript
primary: {
  50:  "#F0FDFA",  // Lightest
  100: "#CCFBF1",
  200: "#99F6E4",
  300: "#5EEAD4",
  400: "#2DD4BF",
  500: "#14B8A6",
  600: "#0F766E",  // Main primary
  700: "#0D9488",
  800: "#115E59",
  900: "#134E4A",  // Darkest
}
```

**Usage:**
```tsx
<button className="bg-primary-600 hover:bg-primary-700">
  Click me
</button>
```

### Secondary Colors - Gold ✨

The secondary color represents prosperity, warmth, and celebration.

```typescript
secondary: {
  50:  "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",  // Main secondary
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
}
```

### Semantic Colors

#### Success - Green 🌱
```typescript
success: {
  DEFAULT: "#10B981",
  // Represents growth, blessings, positive actions
}
```

#### Error - Soft Red ⚠️
```typescript
error: {
  DEFAULT: "#EF4444",
  // Gentle, not harsh - respectful error indication
}
```

#### Warning - Amber ⚡
```typescript
warning: {
  DEFAULT: "#F59E0B",
  // Same as secondary - consistent golden tone
}
```

#### Info - Blue ℹ️
```typescript
info: {
  DEFAULT: "#3B82F6",
  // Clear, informative communication
}
```

### Neutral Colors - Warm Grays

```typescript
neutral: {
  50:  "#FAFAF9",  // Background
  100: "#F5F5F4",
  200: "#E7E5E4",
  300: "#D6D3D1",
  400: "#A8A29E",
  500: "#78716C",
  600: "#57534E",
  700: "#44403C",
  800: "#292524",
  900: "#1C1917",  // Dark mode background
}
```

---

## Typography

### Font Families

#### Primary - Inter
Modern, clean, highly legible sans-serif font for UI and body text.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Features:**
- Variable font with optical size adjustments
- Excellent readability at all sizes
- Professional and modern

#### Secondary - Amiri (Arabic)
Beautiful traditional Arabic font for Islamic content and quotes.

```css
font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif;
```

**Usage:**
```tsx
<p className="font-arabic" lang="ar">
  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
</p>
```

### Type Scale

| Size | Pixels | Line Height | Usage |
|------|--------|-------------|-------|
| xs | 12px | 16px | Labels, captions |
| sm | 14px | 20px | Small text |
| base | 16px | 24px | Body text |
| lg | 18px | 28px | Emphasized text |
| xl | 20px | 30px | Large text |
| 2xl | 24px | 32px | Sub-headings |
| 3xl | 30px | 36px | Headings |
| 4xl | 36px | 40px | Page titles |
| 5xl | 48px | 1 | Hero text |
| 6xl | 60px | 1 | Display text |

### Font Weights

```typescript
fontWeight: {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
}
```

### Headings

All headings automatically use:
- `font-weight: 600` (semibold)
- `line-height: 1.2`
- `letter-spacing: -0.025em` (slight tightening)

```tsx
<h1>Main Page Title</h1>        // 48px → 72px
<h2>Section Title</h2>           // 36px → 60px
<h3>Subsection</h3>              // 30px → 48px
<h4>Card Title</h4>              // 20px → 24px
<h5>Small Heading</h5>           // 18px → 20px
<h6>Tiny Heading</h6>            // 16px → 18px
```

---

## Spacing & Layout

### Spacing Scale (4px base)

```typescript
spacing: {
  0:  "0px",
  1:  "4px",    // 0.25rem
  2:  "8px",    // 0.5rem
  3:  "12px",   // 0.75rem
  4:  "16px",   // 1rem
  5:  "20px",   // 1.25rem
  6:  "24px",   // 1.5rem
  8:  "32px",   // 2rem
  10: "40px",   // 2.5rem
  12: "48px",   // 3rem
  16: "64px",   // 4rem
  20: "80px",   // 5rem
  24: "96px",   // 6rem
  32: "128px",  // 8rem
}
```

**Usage:**
```tsx
<div className="p-4">            // padding: 16px
<div className="mt-8 mb-4">      // margin-top: 32px, margin-bottom: 16px
<div className="space-y-6">      // gap between children: 24px
```

### Border Radius

```typescript
borderRadius: {
  xs:   "2px",
  sm:   "4px",
  base: "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  "2xl": "20px",
  "3xl": "24px",
  full: "9999px",
}
```

**Usage:**
```tsx
<div className="rounded-md">     // 8px
<div className="rounded-lg">     // 12px
<button className="rounded-full"> // Pill shape
```

---

## Shadows & Elevation

### Shadow System

```typescript
shadows: {
  xs:   "0 1px 2px rgba(0,0,0,0.05)",
  sm:   "0 1px 3px rgba(0,0,0,0.1)",
  base: "0 4px 6px rgba(0,0,0,0.1)",
  md:   "0 10px 15px rgba(0,0,0,0.1)",
  lg:   "0 20px 25px rgba(0,0,0,0.1)",
  xl:   "0 25px 50px rgba(0,0,0,0.25)",
}
```

### Colored Shadows

For emphasis and visual hierarchy:

```tsx
<div className="shadow-primary">    // Teal shadow
<div className="shadow-secondary">  // Gold shadow
<div className="shadow-success">    // Green shadow
<div className="shadow-error">      // Red shadow
```

**Example:**
```tsx
<button className="bg-primary-600 shadow-primary hover:shadow-lg">
  Sign Up
</button>
```

---

## Animations

### Duration

```typescript
duration: {
  fast: "150ms",
  base: "200ms",
  moderate: "300ms",
  slow: "500ms",
}
```

### Easing Functions

```typescript
timingFunction: {
  ease: "ease",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  barakah: "cubic-bezier(0.34, 1.56, 0.64, 1)",  // Bouncy, joyful
}
```

### Built-in Animations

```tsx
// Fade
<div className="animate-fade-in">Content</div>

// Slide
<div className="animate-slide-in-up">Modal</div>
<div className="animate-slide-in-left">Sidebar</div>

// Scale
<div className="animate-scale-in">Popup</div>

// Loading
<div className="animate-spin">⏳</div>
<div className="animate-pulse">Loading...</div>
```

### Custom Transition

```tsx
<button className="transition-barakah hover:scale-105">
  Click me
</button>
```

---

## Components

### Buttons

```tsx
// Primary
<button className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-md shadow-md transition-colors">
  Primary Action
</button>

// Secondary
<button className="bg-secondary-500 text-white hover:bg-secondary-600 px-6 py-3 rounded-md shadow-md">
  Secondary
</button>

// Outline
<button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-md">
  Outline
</button>

// Ghost
<button className="text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-md">
  Ghost
</button>
```

### Cards

```tsx
<div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content...</p>
</div>
```

### Inputs

```tsx
<input 
  className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
  placeholder="Enter text..."
/>
```

---

## Accessibility

### Focus Styles

All interactive elements have accessible focus indicators:

```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--primary);
}
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI components**: 3:1 minimum

### Screen Reader Support

```tsx
// Use semantic HTML
<button aria-label="Close dialog">×</button>

// Add descriptions
<img src="..." alt="Descriptive text" />

// Hide decorative elements
<span aria-hidden="true">🎨</span>
```

### Keyboard Navigation

All interactive elements are keyboard accessible:
- Tab to focus
- Enter/Space to activate
- Escape to close modals
- Arrow keys for navigation

---

## Dark Mode

### Activation

```tsx
// Add dark mode class to html element
<html className="dark">
```

### Auto Colors

Most colors automatically adjust in dark mode:

```tsx
<div className="bg-background text-foreground">
  {/* Automatically switches between light/dark */}
</div>
```

### Manual Dark Mode Styles

```tsx
<div className="bg-white dark:bg-gray-900">
  {/* Explicitly set dark mode style */}
</div>
```

### Dark Mode Color Palette

Light Mode → Dark Mode:
- Background: `#FAFAF9` → `#1C1917`
- Foreground: `#1C1917` → `#FAFAF9`
- Card: `#FFFFFF` → `#292524`
- Border: `#E7E5E4` → `#44403C`

---

## Usage Examples

### Hero Section

```tsx
<section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
  <div className="container-custom">
    <h1 className="text-5xl md:text-6xl font-bold mb-4">
      Welcome to <span className="text-gradient-barakah">Barakah.Social</span>
    </h1>
    <p className="text-xl mb-8">Connect with purpose</p>
    <button className="bg-secondary-500 hover:bg-secondary-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-secondary">
      Get Started
    </button>
  </div>
</section>
```

### Glass Card

```tsx
<div className="glass rounded-xl p-6">
  <h3 className="text-2xl font-semibold mb-4">Glass Effect</h3>
  <p>Beautiful glassmorphism card</p>
</div>
```

### Islamic Pattern Background

```tsx
<div className="pattern-islamic min-h-screen">
  <div className="container-custom py-12">
    {/* Content */}
  </div>
</div>
```

### Text Gradients

```tsx
<h2 className="text-gradient-primary text-4xl font-bold">
  Gradient Text
</h2>

<span className="text-gradient-barakah">
  Barakah Gradient
</span>
```

### Animated Card

```tsx
<div className="animate-slide-up">
  <div className="bg-card rounded-lg shadow-md hover:shadow-xl p-6 transition-all hover:-translate-y-1">
    <h3>Hover me!</h3>
  </div>
</div>
```

### Arabic Content

```tsx
<div className="font-arabic text-2xl text-center" lang="ar" dir="rtl">
  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
</div>
```

---

## Best Practices

### Do's ✅
- Use semantic color names (`primary`, `success`) over raw hex values
- Apply consistent spacing using the spacing scale
- Use the animation system for smooth transitions
- Test in both light and dark modes
- Ensure RTL support for Arabic content
- Maintain color contrast ratios

### Don'ts ❌
- Don't use arbitrary color values
- Don't mix spacing systems (use 4px base)
- Don't disable focus indicators
- Don't forget alt text for images
- Don't use color alone to convey information
- Don't override the design system unnecessarily

---

## Resources

- **Theme File**: `src/styles/theme.ts`
- **Global Styles**: `src/styles/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Component Examples**: See components in `src/components/ui/`

---

## Support

The Barakah.Social design system is built with:
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Custom Properties**: Theme variables
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library

For questions or contributions, please refer to the project documentation.

---

*Designed with ❤️ for the Barakah.Social community*

