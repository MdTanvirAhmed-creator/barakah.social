"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Sunrise, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeName = "courtyard" | "dusk";

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function currentTheme(): ThemeName {
  if (typeof document === "undefined") return "courtyard";
  return document.documentElement.dataset.theme === "dusk" ? "dusk" : "courtyard";
}

export function applyTheme(t: ThemeName) {
  if (t === "dusk") document.documentElement.dataset.theme = "dusk";
  else delete document.documentElement.dataset.theme;
  document.cookie = `bk-theme=${t};path=/;max-age=31536000`;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "dusk" ? "#14231F" : "#E7DECB");
  listeners.forEach((l) => l());
}

/**
 * Courtyard ⇄ Dusk. The cookie is read server-side on the next request
 * (no flash); useSyncExternalStore keeps hydration clean and every
 * mounted toggle in sync.
 */
export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "courtyard" as ThemeName);

  const toggle = useCallback(() => {
    applyTheme(theme === "dusk" ? "courtyard" : "dusk");
  }, [theme]);

  const Icon = theme === "dusk" ? Sunrise : Sunset;
  const label = theme === "dusk" ? "Switch to Courtyard (light)" : "Switch to Dusk (dark)";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 min-h-[44px]",
        "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/50",
        "transition-colors duration-quick ease-sakina",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        className
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      {showLabel && <span className="text-sm">{theme === "dusk" ? "Dusk" : "Courtyard"}</span>}
    </button>
  );
}
