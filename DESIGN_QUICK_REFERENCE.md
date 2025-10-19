# Design System Quick Reference 🎨

## Color Palette

### Primary - Deep Teal 🌊
```
bg-primary-600    #0F766E    Main brand color
bg-primary-700    #0D9488    Hover state
bg-primary-500    #14B8A6    Lighter variant
text-primary      Automatic  Uses CSS variable
```

### Secondary - Gold ✨
```
bg-secondary-500  #F59E0B    Main accent
bg-secondary-600  #D97706    Hover state
bg-secondary-400  #FBBF24    Lighter variant
```

### Semantic
```
bg-success        #10B981    Green (growth, blessings)
bg-error          #EF4444    Soft red (gentle errors)
bg-warning        #F59E0B    Amber
bg-info           #3B82F6    Blue
```

---

## Typography

### Fonts
```tsx
className="font-sans"      // Inter (default)
className="font-arabic"    // Amiri (Arabic)
className="font-mono"      // Fira Code
```

### Sizes
```
text-xs      12px    Labels, captions
text-sm      14px    Small text
text-base    16px    Body text (default)
text-lg      18px    Emphasized
text-xl      20px    Large text
text-2xl     24px    Sub-headings
text-3xl     30px    Headings
text-4xl     36px    Page titles
text-5xl     48px    Hero text
text-6xl     60px    Display
```

### Weights
```
font-light      300
font-normal     400  (default)
font-medium     500
font-semibold   600  (headings)
font-bold       700
font-extrabold  800
```

---

## Spacing

```
p-1     4px      m-1     4px
p-2     8px      m-2     8px
p-3     12px     m-3     12px
p-4     16px     m-4     16px
p-6     24px     m-6     24px
p-8     32px     m-8     32px
p-12    48px     m-12    48px
p-16    64px     m-16    64px
```

---

## Border Radius

```
rounded-sm      4px
rounded         6px     (default)
rounded-md      8px
rounded-lg      12px
rounded-xl      16px
rounded-2xl     20px
rounded-3xl     24px
rounded-full    9999px  (pill/circle)
```

---

## Shadows

```
shadow-sm       Subtle
shadow          Default
shadow-md       Medium elevation
shadow-lg       High elevation
shadow-xl       Maximum elevation

shadow-primary     Teal glow
shadow-secondary   Gold glow
shadow-success     Green glow
shadow-error       Red glow
```

---

## Common Patterns

### Buttons
```tsx
// Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md shadow-md">
  Primary
</button>

// Secondary
<button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-md">
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
  Card content
</div>
```

### Inputs
```tsx
<input 
  className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
  placeholder="Enter text..."
/>
```

### Hero Section
```tsx
<section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
  <h1 className="text-5xl font-bold mb-4">Hero Title</h1>
  <p className="text-xl">Subtitle</p>
</section>
```

---

## Special Effects

### Text Gradients
```tsx
<h1 className="text-gradient-primary">Teal Gradient</h1>
<h1 className="text-gradient-secondary">Gold Gradient</h1>
<h1 className="text-gradient-barakah">Brand Gradient</h1>
```

### Glassmorphism
```tsx
<div className="glass rounded-xl p-6">
  Glass effect card
</div>
```

### Islamic Pattern
```tsx
<div className="pattern-islamic min-h-screen">
  Background with pattern
</div>
```

### Arabic Text
```tsx
<p className="font-arabic text-2xl" lang="ar" dir="rtl">
  بِسْمِ اللهِ
</p>
```

---

## Animations

### Built-in
```tsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up</div>
<div className="animate-spin">Spins</div>
<div className="animate-pulse">Pulses</div>
```

### Transitions
```tsx
<button className="transition-colors hover:bg-primary-700">
  Color transition
</button>

<div className="transition-all hover:scale-105">
  Multiple transitions
</div>

<button className="transition-barakah hover:scale-110">
  Bouncy transition
</button>
```

---

## Dark Mode

### Toggle
```tsx
<button onClick={() => document.documentElement.classList.toggle('dark')}>
  Toggle Dark Mode
</button>
```

### Auto Colors
```tsx
<div className="bg-background text-foreground">
  Auto dark mode
</div>
```

### Manual
```tsx
<div className="bg-white dark:bg-gray-900">
  Custom dark style
</div>
```

---

## Responsive Design

### Breakpoints
```
sm:     640px   Phone landscape
md:     768px   Tablet
lg:     1024px  Desktop
xl:     1280px  Large desktop
2xl:    1536px  Extra large
```

### Usage
```tsx
<div className="text-base md:text-lg lg:text-xl">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

---

## Accessibility

### Focus States
```tsx
// Automatically applied to all interactive elements
<button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Accessible button
</button>
```

### Screen Readers
```tsx
<button aria-label="Close dialog">
  ×
</button>

<img src="..." alt="Descriptive text" />

<span aria-hidden="true">🎨</span>
```

---

## Common Layouts

### Container
```tsx
<div className="container-custom">
  Centered with max-width
</div>
```

### Flex
```tsx
<div className="flex items-center justify-between gap-4">
  Flexbox layout
</div>
```

### Grid
```tsx
<div className="grid grid-cols-3 gap-6">
  Grid layout
</div>
```

### Stack
```tsx
<div className="flex flex-col space-y-4">
  Vertical stack
</div>
```

---

## Pro Tips

### Combine Utilities
```tsx
<button className="
  bg-primary-600 
  hover:bg-primary-700 
  active:bg-primary-800
  text-white 
  font-semibold 
  px-6 py-3 
  rounded-lg 
  shadow-md 
  hover:shadow-lg
  transition-all
  focus:ring-2 focus:ring-primary focus:ring-offset-2
">
  Perfect Button
</button>
```

### Use Custom Properties
```css
background: var(--primary);
color: var(--foreground);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
```

### Theme Values in JS
```typescript
import { theme } from "@/styles/theme";

const color = theme.colors.primary[600];
const space = theme.spacing[4];
```

---

## Cheat Sheet

### Most Used Classes
```
Container:     container-custom
Background:    bg-background, bg-card
Text:          text-foreground, text-foreground-secondary
Padding:       p-4, p-6, p-8
Margin:        mt-4, mb-6, my-8
Rounded:       rounded-md, rounded-lg
Shadow:        shadow-md, shadow-lg
Transition:    transition-colors, transition-all
Hover:         hover:bg-primary-700, hover:scale-105
Focus:         focus:ring-2, focus:ring-primary
```

### Color Combinations
```
Primary Button:     bg-primary-600 text-white
Secondary Button:   bg-secondary-500 text-white
Success Alert:      bg-success-50 text-success-700 border-success-200
Error Alert:        bg-error-50 text-error-700 border-error-200
Card:               bg-card text-card-foreground shadow-md
```

---

## File Locations

- **Theme**: `src/styles/theme.ts`
- **Global CSS**: `src/styles/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Documentation**: `DESIGN_SYSTEM.md`

---

## Quick Links

- 🎨 [Full Design System](./DESIGN_SYSTEM.md)
- 📊 [Implementation Summary](./DESIGN_SYSTEM_SUMMARY.md)
- 🚀 [Project Setup](./SETUP.md)

---

**Print this page for quick reference while coding!** 📄

