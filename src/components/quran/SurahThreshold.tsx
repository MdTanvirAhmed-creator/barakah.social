"use client";

import * as React from "react";
import { BookOpen, Play, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuranText } from "@/components/ui/QuranText";
import { GirihPattern, TazhibCorner } from "@/components/ui/girih";

/**
 * The threshold — how a surah opens, before its text begins.
 *
 * The plan placed this on a route of its own, ahead of the reader. It lives
 * at the top of the reader instead, for two reasons: the per-ayah deep links
 * we already ship (/knowledge/quran/2#ayah-255) would break behind a
 * click-through, and a returning reader should not have to pass a gate to
 * reach the text. Scrolling is the only thing between this and the mushaf.
 *
 * Everything shown is sourced: the revelation order comes from Tanzil's
 * metadata, and any commentary is named and attributed, never summarised or
 * generated.
 */
export interface SurahThresholdProps {
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  revelationPlace: "makkah" | "madinah";
  revelationOrder: number | null;
  ayahCount: number;
  /** The surah's opening ayah, shown as its epigraph. */
  openingAyah?: { text: string; translation?: string; citation: string };
  /** Where this reader left off in *this* surah, if anywhere. */
  continueAyah?: number | null;
  /** How many ayat of this surah they have marked memorised. */
  memorisedCount?: number;
  /** Named commentary on the surah's opening, already attributed. */
  intro?: { editionName: string; text: string } | null;
  onBeginReading: () => void;
  onListen: () => void;
  onContinue: () => void;
  onOpenIntro?: () => void;
}

export function SurahThreshold({
  nameArabic,
  nameTransliterated,
  nameEnglish,
  revelationPlace,
  revelationOrder,
  ayahCount,
  openingAyah,
  continueAyah,
  memorisedCount = 0,
  intro,
  onBeginReading,
  onListen,
  onContinue,
  onOpenIntro,
}: SurahThresholdProps) {
  return (
    <section
      aria-labelledby="surah-title"
      className="relative overflow-hidden rounded-lg border border-border bg-card px-6 py-10 mb-10"
    >
      <GirihPattern subtle />
      <TazhibCorner corner="top-end" size={44} />

      <div className="relative text-center">
        {/* Facts, not decoration: where and when it came. */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full craft-tile-teal text-accent-strong font-medium">
            {revelationPlace === "makkah" ? "Makkan" : "Madinan"}
          </span>
          {revelationOrder && (
            <span className="px-2.5 py-1 rounded-full craft-tile-lapis text-accent-strong font-medium">
              {ordinal(revelationOrder)} revealed
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {ayahCount} ayat
          </span>
        </div>

        <h1
          id="surah-title"
          lang="ar"
          dir="rtl"
          className="font-arabic arabic-center text-5xl text-foreground mt-6"
        >
          {nameArabic}
        </h1>
        <p className="mt-3 font-display text-2xl text-foreground">{nameTransliterated}</p>
        <p className="mt-1 text-foreground-secondary">{nameEnglish}</p>

        {openingAyah && (
          <QuranText
            citation={openingAyah.citation}
            translation={openingAyah.translation}
            className="!my-8"
          >
            {openingAyah.text}
          </QuranText>
        )}

        {/* Where this reader stands — private, and never a score. */}
        {(continueAyah || memorisedCount > 0) && (
          <p className="text-sm text-foreground-secondary mb-5">
            {continueAyah ? `You last read ayah ${continueAyah}.` : null}
            {continueAyah && memorisedCount > 0 ? " " : null}
            {memorisedCount > 0
              ? `You have marked ${memorisedCount} of ${ayahCount} ayat memorised.`
              : null}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {continueAyah ? (
            <Button onClick={onContinue} className="bg-primary-600 hover:bg-primary-700">
              <ArrowDown className="w-4 h-4 me-2" />
              Continue from ayah {continueAyah}
            </Button>
          ) : (
            <Button onClick={onBeginReading} className="bg-primary-600 hover:bg-primary-700">
              <BookOpen className="w-4 h-4 me-2" />
              Begin reading
            </Button>
          )}
          {continueAyah && (
            <Button variant="outline" onClick={onBeginReading}>
              <BookOpen className="w-4 h-4 me-2" />
              From the beginning
            </Button>
          )}
          <Button variant="outline" onClick={onListen}>
            <Play className="w-4 h-4 me-2" />
            Listen
          </Button>
        </div>

        {intro && (
          <div className="mt-8 mx-auto max-w-prose text-start">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {intro.editionName}, on the opening of this surah
            </p>
            <p
              lang="ar"
              dir="rtl"
              className="arabic text-sm leading-loose text-foreground-secondary line-clamp-4"
            >
              {intro.text}
            </p>
            {onOpenIntro && (
              <button
                onClick={onOpenIntro}
                className="mt-2 text-xs font-medium text-accent-strong hover:underline"
              >
                Read the full tafsir
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
