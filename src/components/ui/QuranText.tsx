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
export interface QuranWord {
  /** The word's Uthmani form. */
  arabic: string;
  /** Its word-by-word gloss. */
  gloss: string;
}

export interface QuranTextProps {
  /** The ayah or passage, complete — never truncate or split for layout. */
  children?: React.ReactNode;
  /** Required attribution, e.g. "Al-Baqarah 2:152". */
  citation: string;
  /** Optional translation, rendered separately below the Arabic. */
  translation?: string;
  /**
   * "quote" (default): a single framed passage, for citing an ayah inside
   * other content. "reader": the compact continuous form used by the
   * Al-Hikmah mushaf reader — no ornamental frame, ayah number as the
   * end-of-ayah marker, citation carried for accessibility.
   */
  variant?: "quote" | "reader";
  /** Anchor id for deep links (reader variant), e.g. "ayah-255". */
  id?: string;
  /**
   * Word-by-word mode (reader variant): each word with its gloss beneath.
   * Takes precedence over children/tajweedMarkup.
   */
  words?: QuranWord[];
  /**
   * Tajweed mode (reader variant): rule-annotated markup
   * (`<tajweed class=rule>…</tajweed>`) rendered through a strict
   * allowlisting parser — never raw HTML.
   */
  tajweedMarkup?: string;
  /** Recite mode: the larger of the two reading sizes (token-driven). */
  reciteSize?: boolean;
  className?: string;
}

/** quran.com tajweed rule -> colour family (see globals.css .tj-*). */
const TAJWEED_RULES: Record<string, string> = {
  ham_wasl: "tj-silent",
  slnt: "tj-silent",
  laam_shamsiyah: "tj-silent",
  ghunnah: "tj-ghunnah",
  idgham_ghunnah: "tj-ghunnah",
  ikhafa: "tj-ikhfa",
  ikhafa_shafawi: "tj-ikhfa",
  idgham_shafawi: "tj-idgham",
  idgham_wo_ghunnah: "tj-idgham",
  idgham_mutajanisayn: "tj-idgham",
  idgham_mutaqaribayn: "tj-idgham",
  iqlab: "tj-iqlab",
  qalaqah: "tj-qalqalah",
  madda_normal: "tj-madd-normal",
  madda_permissible: "tj-madd-permissible",
  madda_obligatory: "tj-madd-obligatory",
  madda_necessary: "tj-madd-necessary",
};

/**
 * Parse tajweed markup into React nodes. Only `<tajweed class=x>text</tajweed>`
 * is honoured (allowlisted class map); the ayah-number `<span class=end>` and
 * any other tag are dropped. Text is emitted as plain strings, so nothing in
 * the markup can ever inject markup of its own.
 */
function renderTajweed(markup: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re =
    /<tajweed class=([a-z_]+)>([^<]*)<\/tajweed>|<span class=end>[^<]*<\/span>|<[^>]+>/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    if (m.index > last) nodes.push(markup.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <span key={key++} className={TAJWEED_RULES[m[1]]}>
          {m[2]}
        </span>
      );
    }
    last = re.lastIndex;
  }
  if (last < markup.length) nodes.push(markup.slice(last));
  return nodes;
}

export function QuranText({
  children,
  citation,
  translation,
  variant = "quote",
  id,
  words,
  tajweedMarkup,
  reciteSize,
  className,
}: QuranTextProps) {
  if (variant === "reader") {
    return (
      <figure
        id={id}
        aria-label={citation}
        className={cn("px-2 py-5 scroll-mt-24 border-b border-border/60", className)}
      >
        {words && words.length > 0 ? (
          <div dir="rtl" lang="ar" className="flex flex-wrap gap-x-2 gap-y-5">
            {words.map((w, i) => (
              <span
                key={i}
                className="inline-flex flex-col items-center px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors"
              >
                {/* Size and leading come from tokens (.quran-text--word), never
                    Tailwind utilities; pb-2 clears descenders, which overflow
                    the line box's lower leading in the Uthmani face. */}
                <span className="quran-text quran-text--word block text-foreground pb-2">
                  {w.arabic}
                </span>
                <span
                  dir="ltr"
                  lang="en"
                  className="mt-3 font-reading text-[11px] leading-snug text-muted-foreground max-w-[9rem] text-center"
                >
                  {w.gloss}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <blockquote
            lang="ar"
            dir="rtl"
            className={cn("quran-text text-foreground", reciteSize && "quran-text--recite")}
          >
            {tajweedMarkup ? renderTajweed(tajweedMarkup) : children}
          </blockquote>
        )}
        {translation && (
          <p className="mt-3 font-reading text-base text-foreground-secondary leading-relaxed">
            {translation}
          </p>
        )}
        <figcaption className="mt-2 text-xs text-muted-foreground">{citation}</figcaption>
      </figure>
    );
  }

  return (
    <figure className={cn("my-10 px-6 py-8 text-center", className)}>
      <div aria-hidden="true" className="flex items-center justify-center gap-4 mb-6">
        <span className="w-24 border-t border-border" />
        <span className="w-1.5 h-1.5 rotate-45 bg-[var(--accent-rare)]" />
        <span className="w-24 border-t border-border" />
      </div>
      <blockquote
        lang="ar"
        dir="rtl"
        className="quran-text quran-text--center text-foreground"
      >
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
