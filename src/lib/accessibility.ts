// Accessibility utilities and helpers

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within a modal/dialog
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  element.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Manage focus when opening/closing modals
 */
export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;

  saveFocus() {
    this.previousActiveElement = document.activeElement as HTMLElement;
  }

  restoreFocus() {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  setInitialFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
}

/**
 * ARIA label helpers
 */
export const ariaLabels = {
  // Navigation
  mainNavigation: "Main navigation",
  userMenu: "User menu",
  breadcrumb: "Breadcrumb",
  pagination: "Pagination",

  // Actions
  closeModal: "Close modal",
  openMenu: "Open menu",
  search: "Search",
  filter: "Filter",
  sort: "Sort",

  // Social actions
  like: (count: number) => `Like this post. ${count} ${count === 1 ? "like" : "likes"}`,
  unlike: (count: number) => `Unlike this post. ${count} ${count === 1 ? "like" : "likes"}`,
  comment: (count: number) => `Comment on this post. ${count} ${count === 1 ? "comment" : "comments"}`,
  share: "Share this post",
  bookmark: "Bookmark this post",
  unbookmark: "Remove bookmark",
  report: "Report this content",

  // Forms
  required: "required",
  optional: "optional",
  error: (message: string) => `Error: ${message}`,
  success: (message: string) => `Success: ${message}`,

  // Loading states
  loading: "Loading...",
  loadingMore: "Loading more content...",
  updating: "Updating...",

  // Profile
  profilePicture: (name: string) => `${name}'s profile picture`,
  coverPhoto: (name: string) => `${name}'s cover photo`,

  // Status
  online: "Online",
  offline: "Offline",
  verified: "Verified account",
};

/**
 * Keyboard navigation helpers
 */
export const keyboardShortcuts = {
  ESC: "Escape",
  ENTER: "Enter",
  SPACE: " ",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
};

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Check color contrast ratio (WCAG 2.1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Helper function to convert hex to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // Helper function to get relative luminance
  function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsWCAGContrast(
  color1: string,
  color2: string,
  level: "AA" | "AAA" = "AA",
  size: "normal" | "large" = "normal"
): boolean {
  const ratio = getContrastRatio(color1, color2);

  if (level === "AAA") {
    return size === "large" ? ratio >= 4.5 : ratio >= 7;
  } else {
    // AA
    return size === "large" ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Generate accessible ID for form elements
 */
let idCounter = 0;
export function generateAccessibleId(prefix: string = "a11y"): string {
  idCounter++;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Skip to main content (for keyboard navigation)
 */
export function skipToMainContent() {
  const mainContent = document.querySelector("main") || document.querySelector('[role="main"]');
  if (mainContent) {
    (mainContent as HTMLElement).focus();
    (mainContent as HTMLElement).scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * Hook for keyboard navigation in lists
 */
export function useListKeyboardNavigation(
  listRef: React.RefObject<HTMLElement>,
  onSelect?: (index: number) => void
) {
  return (e: React.KeyboardEvent) => {
    if (!listRef.current) return;

    const items = Array.from(
      listRef.current.querySelectorAll<HTMLElement>('[role="option"], [role="menuitem"], button, a')
    );

    const currentIndex = items.findIndex((item) => item === document.activeElement);

    switch (e.key) {
      case keyboardShortcuts.ARROW_DOWN:
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;

      case keyboardShortcuts.ARROW_UP:
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
        break;

      case keyboardShortcuts.HOME:
        e.preventDefault();
        items[0]?.focus();
        break;

      case keyboardShortcuts.END:
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;

      case keyboardShortcuts.ENTER:
      case keyboardShortcuts.SPACE:
        if (onSelect && currentIndex >= 0) {
          e.preventDefault();
          onSelect(currentIndex);
        }
        break;
    }
  };
}

/**
 * Visually hidden but accessible to screen readers
 * Use this class in your CSS
 */
export const srOnlyClass = "sr-only";

// Add this to your global CSS:
/*
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
*/
