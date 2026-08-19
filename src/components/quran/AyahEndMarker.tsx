"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The end-of-ayah marker — a rosette with the ayah's number inside it.
 *
 * Drawn as an SVG rather than typed as U+06DD so its size, stroke and colour
 * follow our tokens, and so no Qur'anic character ever appears outside
 * QuranText (adab-check.sh enforces that boundary).
 *
 * It is also the ayah's handle: the plan calls it the ayah's identity, so it
 * carries the actions for that ayah rather than being decoration. Rendered
 * as a real button with an accessible name, so it is reachable by keyboard
 * and announced as "Actions for Al-Baqarah 2:255".
 */
export interface AyahEndMarkerProps {
  ayahNumber: number;
  /** Accessible name, e.g. "Al-Baqarah 2:255". */
  citation: string;
  onActivate?: (rect: DOMRect) => void;
  className?: string;
}

export function AyahEndMarker({
  ayahNumber,
  citation,
  onActivate,
  className,
}: AyahEndMarkerProps) {
  const label = `Actions for ${citation}`;

  const content = (
    <svg
      viewBox="0 0 40 40"
      className="w-[1em] h-[1em] align-middle"
      style={{ fontSize: "var(--quran-marker-size)" }}
      aria-hidden="true"
      focusable="false"
    >
      {/* An eight-point rosette: the same octagonal geometry as the girih
          watermark, so the mushaf and the rest of the platform rhyme. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
        transform="translate(20 20)"
      >
        <rect x="-11" y="-11" width="22" height="22" rx="1.5" />
        <rect x="-11" y="-11" width="22" height="22" rx="1.5" transform="rotate(45)" />
      </g>
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{ fontSize: `${40 * 0.6 * 0.55}px` }}
        className="font-reading"
      >
        {ayahNumber}
      </text>
    </svg>
  );

  if (!onActivate) {
    return (
      <span className={cn("inline-block text-accent-strong", className)} aria-hidden="true">
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="menu"
      title={citation}
      onClick={(e) => onActivate(e.currentTarget.getBoundingClientRect())}
      className={cn(
        "inline-block align-middle text-accent-strong rounded-full",
        "transition-opacity duration-150 hover:opacity-70",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600",
        className
      )}
    >
      {content}
    </button>
  );
}
