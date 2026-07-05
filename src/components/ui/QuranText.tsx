import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The ONLY component allowed to render Qur'anic text.
 *
 * Adab, enforced structurally:
 *  - Uthmanic face only (.quran-text -> --font-quran), never a UI font
 *  - complete, static, never animated (the class disables all motion)
 *  - attribution is REQUIRED (surah/ayah), rendered with the text
 *  - generous breathing room; never inside tap targets or transient UI
 *
 * scripts/adab-check.sh verifies no Qur'anic text appears outside this
 * component, and never in CSS/SVG/backgrounds/loaders.
 */
export interface QuranTextProps {
  /** The ayah or passage, complete — never truncate or split for layout. */
  children: React.ReactNode;
  /** Required attribution, e.g. "Al-Baqarah 2:152". */
  citation: string;
  /** Optional translation, rendered separately below the Arabic. */
  translation?: string;
  className?: string;
}

export function QuranText({ children, citation, translation, className }: QuranTextProps) {
  return (
    <figure className={cn("my-10 px-6 py-8 text-center", className)}>
      <div aria-hidden="true" className="flex items-center justify-center gap-4 mb-6">
        <span className="w-24 border-t border-border" />
        <span className="w-1.5 h-1.5 rotate-45 bg-[var(--accent-rare)]" />
        <span className="w-24 border-t border-border" />
      </div>
      <blockquote lang="ar" dir="rtl" className="quran-text text-2xl text-foreground">
        {children}
      </blockquote>
      {translation && (
        <p className="mt-5 font-reading text-base text-foreground-secondary leading-relaxed max-w-prose mx-auto">
          {translation}
        </p>
      )}
      <figcaption className="mt-4 text-sm text-foreground-secondary">{citation}</figcaption>
      <div aria-hidden="true" className="flex items-center justify-center gap-4 mt-6">
        <span className="w-24 border-t border-border" />
        <span className="w-1.5 h-1.5 rotate-45 bg-[var(--accent-rare)]" />
        <span className="w-24 border-t border-border" />
      </div>
    </figure>
  );
}
