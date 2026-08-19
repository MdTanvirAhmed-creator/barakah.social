"use client";

import * as React from "react";

/**
 * Opens the radial menu from a word, on every input:
 *
 *   - mouse / trackpad / pen: a plain click
 *   - touch: a long press (500ms), so ordinary scrolling never triggers it
 *   - keyboard: Enter or Space on the focused word
 *
 * A touch that moves more than a few pixels is a scroll, not a press, so the
 * pending long-press is cancelled — the reader can always drag through the
 * mushaf without the menu snapping open under a thumb.
 */
const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 8;

export function useWordActivation(onActivate: (rect: DOMRect) => void) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const fired = React.useRef(false);

  const clear = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  React.useEffect(() => clear, [clear]);

  const activate = React.useCallback(
    (el: HTMLElement) => onActivate(el.getBoundingClientRect()),
    [onActivate]
  );

  return React.useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        fired.current = false;
        if (e.pointerType !== "touch") return;
        const el = e.currentTarget;
        start.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          fired.current = true;
          // A press that becomes the menu shouldn't also select text.
          window.getSelection?.()?.removeAllRanges();
          activate(el);
        }, LONG_PRESS_MS);
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        if (!start.current) return;
        const dx = Math.abs(e.clientX - start.current.x);
        const dy = Math.abs(e.clientY - start.current.y);
        if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clear();
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        // Touch already had its long-press; don't double-fire on the
        // synthetic click that follows.
        if (fired.current) {
          fired.current = false;
          return;
        }
        if (e.detail === 0) return; // keyboard-synthesised click
        activate(e.currentTarget);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e.currentTarget);
        }
      },
    }),
    [activate, clear]
  );
}
