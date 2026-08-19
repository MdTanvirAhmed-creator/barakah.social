"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The radial word menu — the reader's signature interaction.
 *
 * Opens centred on the *word*, never the cursor, so the word stays visible
 * inside the ring and the reader never loses their place. Deliberately
 * quiet: 150ms scale+fade, no bounce, no spring, nothing that would make
 * touching scripture feel playful.
 *
 * It never renders Qur'anic text itself — the word shows through the ring's
 * open centre, which keeps QuranText the only component that draws the text
 * (enforced by adab-check.sh).
 *
 * Accessibility: a real `menu` with roving focus. Arrow keys walk the ring,
 * Home/End jump to its ends, Escape closes and returns focus to the word.
 * Items are 44px targets, which is also the mobile touch minimum.
 */

export interface RadialMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Present items that exist but aren't available yet, honestly greyed. */
  disabled?: boolean;
  disabledReason?: string;
}

export interface RadialWordMenuProps {
  /** Viewport rect of the anchor word. Menu centres on it. */
  anchorRect: DOMRect | null;
  items: RadialMenuItem[];
  /** Accessible name, e.g. "Actions for word 3 of Al-Fatihah 1:2". */
  label: string;
  onClose: () => void;
}

const RADIUS = 70;
const ITEM = 44;
/** Keep the whole ring inside the viewport, with a little breathing room. */
const MARGIN = RADIUS + ITEM / 2 + 8;

export function RadialWordMenu({
  anchorRect,
  items,
  label,
  onClose,
}: RadialWordMenuProps) {
  const [mounted, setMounted] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => setMounted(true), []);

  // Enter transition on the frame after mount, so the browser has a
  // "from" state to animate out of.
  React.useEffect(() => {
    if (!anchorRect) {
      setShown(false);
      return;
    }
    setActive(0);
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [anchorRect]);

  // Focus follows the active item while open.
  React.useEffect(() => {
    if (anchorRect) itemRefs.current[active]?.focus();
  }, [anchorRect, active]);

  // Dismiss on scroll, resize, or a pointer landing outside the ring.
  React.useEffect(() => {
    if (!anchorRect) return;
    const close = () => onClose();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-radial-menu]")) onClose();
    };
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [anchorRect, onClose]);

  if (!mounted || !anchorRect || items.length === 0) return null;

  const cx = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2, MARGIN),
    window.innerWidth - MARGIN
  );
  const cy = Math.min(
    Math.max(anchorRect.top + anchorRect.height / 2, MARGIN),
    window.innerHeight - MARGIN
  );

  const step = 360 / items.length;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const last = items.length - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i === last ? 0 : i + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i === 0 ? last : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    }
  };

  return createPortal(
    <div
      data-radial-menu
      role="menu"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: "none" }}
    >
      {/* The ring's open centre: the word stays readable through it. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute rounded-full border-2 border-accent-strong/70 bg-[rgb(var(--primary-600)/0.08)]",
          "motion-safe:transition-[opacity,transform] motion-safe:duration-150 motion-safe:ease-out",
          shown ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          left: cx,
          top: cy,
          width: Math.max(anchorRect.width + 16, 40),
          height: Math.max(anchorRect.height + 8, 36),
          transform: "translate(-50%, -50%)",
        }}
      />

      {items.map((item, i) => {
        const angle = (-90 + step * i) * (Math.PI / 180);
        const x = cx + RADIUS * Math.cos(angle);
        const y = cy + RADIUS * Math.sin(angle);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            role="menuitem"
            type="button"
            tabIndex={i === active ? 0 : -1}
            // aria-disabled, not `disabled`: an unavailable item must stay
            // focusable so roving focus doesn't strand on it and so a screen
            // reader can announce *why* it is unavailable.
            aria-disabled={item.disabled || undefined}
            aria-label={
              item.disabled && item.disabledReason
                ? `${item.label} — ${item.disabledReason}`
                : item.label
            }
            title={item.disabledReason ?? item.label}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "absolute flex items-center justify-center rounded-full shadow-md",
              "bg-card border border-border text-foreground-secondary",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
              item.disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-primary-600 hover:text-white hover:border-primary-600",
              "motion-safe:transition-[opacity,transform,background-color,color] motion-safe:duration-150 motion-safe:ease-out",
              shown ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
            style={{
              left: x,
              top: y,
              width: ITEM,
              height: ITEM,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              transitionDelay: shown ? `${i * 12}ms` : "0ms",
            }}
          >
            <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
        );
      })}

      {/* The active item's name, so the ring is never a guessing game. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute px-2.5 py-1 rounded-md bg-card border border-border shadow-sm",
          "text-xs font-medium text-foreground whitespace-nowrap",
          "motion-safe:transition-opacity motion-safe:duration-150",
          shown ? "opacity-100" : "opacity-0"
        )}
        style={{
          left: cx,
          top: cy + RADIUS + ITEM / 2 + 10,
          transform: "translateX(-50%)",
        }}
      >
        {items[active]?.label}
      </span>
    </div>,
    document.body
  );
}
