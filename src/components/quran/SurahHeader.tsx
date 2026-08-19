"use client";

import * as React from "react";
import Link from "next/link";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The reader's sticky header.
 *
 * Appears only once the reader has moved past the surah's own title block, so
 * nothing floats over the opening of a surah. Carries where you are, how far
 * through you are, and the controls — so the reading surface below it stays
 * free of permanent chrome.
 *
 * The progress bar is position, not achievement: it says where in the surah
 * this ayah sits, and disappears with the header when you scroll back up.
 */
export type ReadingMode = "plain" | "tajweed" | "words";

export interface SurahHeaderProps {
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  currentAyah: number;
  ayahCount: number;
  mode: ReadingMode;
  onModeChange: (m: ReadingMode) => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  /** Shown once the title block has scrolled away. */
  visible: boolean;
}

const MODES: { value: ReadingMode; label: string }[] = [
  { value: "plain", label: "Reading" },
  { value: "tajweed", label: "Tajweed" },
  { value: "words", label: "Word by word" },
];

export function SurahHeader({
  nameArabic,
  nameTransliterated,
  nameEnglish,
  currentAyah,
  ayahCount,
  mode,
  onModeChange,
  showTranslation,
  onToggleTranslation,
  visible,
}: SurahHeaderProps) {
  const pct = ayahCount > 0 ? Math.min(100, (currentAyah / ayahCount) * 100) : 0;

  return (
    <div
      data-sticky-header
      className={cn(
        // Sticks *below* the platform's own search bar (z-30, 77px tall),
        // not underneath it — hence the offset and the lower layer.
        "sticky z-20 -mx-4 px-4 bg-background/95 backdrop-blur-sm border-b border-border",
        "motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      )}
      aria-hidden={!visible}
      style={{ top: "var(--app-header-h)" }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <Link
          href="/knowledge/quran"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          ← All surahs
        </Link>

        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-sm font-semibold text-foreground truncate">
            {nameTransliterated}
          </span>
          <span lang="ar" dir="rtl" className="font-arabic text-sm text-foreground-secondary">
            {nameArabic}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">
            {nameEnglish}
          </span>
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap" aria-live="polite">
          Ayah {currentAyah} of {ayahCount}
        </span>

        <div className="flex items-center gap-2 ms-auto">
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => onModeChange(m.value)}
                aria-pressed={mode === m.value}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === m.value
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={onToggleTranslation}
            aria-pressed={showTranslation}
            title={showTranslation ? "Hide translation" : "Show translation"}
            aria-label={showTranslation ? "Hide translation" : "Show translation"}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Position through the surah. */}
      <div
        className="h-0.5 -mx-4 bg-muted"
        role="progressbar"
        aria-label={`Position in ${nameTransliterated}`}
        aria-valuenow={currentAyah}
        aria-valuemin={1}
        aria-valuemax={ayahCount}
      >
        <div
          className="h-full bg-primary-600 motion-safe:transition-[width] motion-safe:duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
