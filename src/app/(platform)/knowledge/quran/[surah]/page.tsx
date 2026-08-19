"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Languages, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuranText, QuranWord } from "@/components/ui/QuranText";
import { GirihLoader, IlluminatedDivider } from "@/components/ui/girih";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

/**
 * Strips Arabic combining marks (harakat, maddah, superscript alef, tatweel)
 * for comparison only — never for display. Scripture is rendered verbatim.
 */
function stripArabicMarks(s: string): string {
  // Combining marks: harakat (U+064B-U+065F), Qur'anic annotation
  // (U+0610-U+061A, U+06D6-U+06ED), superscript alef (U+0670), tatweel.
  return s.replace(
    /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,
    ""
  );
}

interface Surah {
  number: number;
  name_arabic: string;
  name_transliterated: string;
  name_english: string;
  revelation_place: "makkah" | "madinah";
  ayah_count: number;
}

interface Ayah {
  id: number;
  ayah: number;
  text_uthmani: string;
  translation?: string;
}

export default function SurahReaderPage() {
  const params = useParams();
  const surahNumber = Number(params?.surah);
  const supabase = createClient();
  const { success } = useToast();

  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayat, setAyat] = useState<Ayah[]>([]);
  const [bismillah, setBismillah] = useState<string>("");
  const [showTranslation, setShowTranslation] = useState(true);
  const [loading, setLoading] = useState(true);

  // Reading modes: plain Uthmani, tajweed colouring, or word-by-word.
  // Both extra datasets are fetched lazily on first use, then cached.
  const [mode, setMode] = useState<"plain" | "tajweed" | "words">("plain");
  const [tajweedByAyah, setTajweedByAyah] = useState<Record<number, string> | null>(null);
  const [wordsByAyah, setWordsByAyah] = useState<Record<number, QuranWord[]> | null>(null);
  const [modeLoading, setModeLoading] = useState(false);

  const switchMode = async (next: "plain" | "tajweed" | "words") => {
    setMode(next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    if (next === "tajweed" && !tajweedByAyah) {
      setModeLoading(true);
      const ids = ayat.map((a) => a.id);
      const { data } = await sb
        .from("quran_tajweed")
        .select("ayah_id, markup")
        .in("ayah_id", ids);
      const map: Record<number, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((data as any[]) ?? []).forEach((r) => (map[r.ayah_id] = r.markup));
      setTajweedByAyah(map);
      setModeLoading(false);
    }
    if (next === "words" && !wordsByAyah) {
      setModeLoading(true);
      const map: Record<number, QuranWord[]> = {};
      // A long surah holds thousands of words — page through in ranges.
      for (let from = 0; ; from += 1000) {
        const { data } = await sb
          .from("quran_words")
          .select("ayah_id, position, text_uthmani, translation, quran_ayat!inner(surah)")
          .eq("quran_ayat.surah", surahNumber)
          .order("ayah_id")
          .order("position")
          .range(from, from + 999);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data as any[]) ?? [];
        rows.forEach((r) => {
          (map[r.ayah_id] ??= []).push({ arabic: r.text_uthmani, gloss: r.translation });
        });
        if (rows.length < 1000) break;
      }
      setWordsByAyah(map);
      setModeLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      setLoading(false);
      return;
    }
    // Per-surah caches reset on navigation.
    setTajweedByAyah(null);
    setWordsByAyah(null);
    setMode("plain");
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [{ data: meta }, { data: rows }, { data: basmalah }] = await Promise.all([
        sb.from("quran_surahs").select("*").eq("number", surahNumber).maybeSingle(),
        sb
          .from("quran_ayat")
          .select("id, ayah, text_uthmani, quran_translations(text)")
          .eq("surah", surahNumber)
          .order("ayah"),
        // Canonical basmalah = ayah 1:1, used to present the bismillah
        // prefix on its own line (mushaf convention; stored text untouched).
        sb.from("quran_ayat").select("text_uthmani").eq("surah", 1).eq("ayah", 1).maybeSingle(),
      ]);
      setSurah((meta as Surah) ?? null);
      setBismillah((basmalah?.text_uthmani as string) ?? "");
      setAyat(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((rows as any[]) ?? []).map((r) => ({
          id: r.id,
          ayah: r.ayah,
          text_uthmani: r.text_uthmani,
          translation: r.quran_translations?.[0]?.text,
        }))
      );
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber]);

  // Scroll to a deep-linked ayah once content is in — and again after the
  // Uthmani face finishes loading, since the font swap reflows the page.
  useEffect(() => {
    if (loading || !window.location.hash) return;
    const scroll = () =>
      document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
    scroll();
    document.fonts?.ready.then(scroll).catch(() => {});
  }, [loading]);

  const copyAyahLink = (ayahNumber: number) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/knowledge/quran/${surahNumber}#ayah-${ayahNumber}`
    );
    success(`Link to ${surah?.name_transliterated} ${surahNumber}:${ayahNumber} copied`);
  };

  /**
   * Tanzil prefixes the Bismillah to ayah 1 of every surah except 1 and 9.
   * Present it on its own line per mushaf convention — display only, the
   * stored text is passed through verbatim.
   *
   * Matching ignores harakat: a few surahs (95, 97) carry an extra shadda
   * on the bā', so an exact prefix comparison silently fails to split them.
   */
  const presentAyah = (a: Ayah): { prefix?: string; text: string } => {
    if (a.ayah !== 1 || surahNumber === 1 || surahNumber === 9 || !bismillah) {
      return { text: a.text_uthmani };
    }
    const wordCount = bismillah.trim().split(/\s+/).length;
    const parts = a.text_uthmani.trim().split(/\s+/);
    const candidate = parts.slice(0, wordCount).join(" ");
    if (stripArabicMarks(candidate) !== stripArabicMarks(bismillah)) {
      return { text: a.text_uthmani };
    }
    return {
      // Keep the surah's own orthography for the prefix, not surah 1's.
      prefix: candidate,
      text: parts.slice(wordCount).join(" "),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GirihLoader />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-foreground-secondary">This surah could not be found.</p>
        <Link href="/knowledge/quran">
          <Button variant="outline">Back to the Qur&rsquo;an</Button>
        </Link>
      </div>
    );
  }

  const firstAyahPresentation = ayat.length ? presentAyah(ayat[0]) : undefined;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container-custom py-8 max-w-3xl">
        {/* Surah header */}
        <div className="text-center mb-6">
          <Link
            href="/knowledge/quran"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All surahs
          </Link>
          <h1 lang="ar" dir="rtl" className="font-arabic text-4xl text-foreground mt-4">
            {surah.name_arabic}
          </h1>
          <p className="mt-2 font-display text-xl text-foreground">
            {surah.name_transliterated}{" "}
            <span className="text-foreground-secondary font-normal">— {surah.name_english}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {surah.revelation_place === "makkah" ? "Makkan" : "Madinan"} · {surah.ayah_count} ayat
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {/* Reading mode */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(
                [
                  { value: "plain", label: "Reading" },
                  { value: "tajweed", label: "Tajweed" },
                  { value: "words", label: "Word by word" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => switchMode(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === opt.value
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranslation((v) => !v)}
            >
              <Languages className="w-4 h-4 me-2" />
              {showTranslation ? "Hide translation" : "Show translation"}
            </Button>
          </div>

          {/* Tajweed legend */}
          {mode === "tajweed" && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              {[
                { cls: "tj-ghunnah", label: "Ghunnah / Idgham with ghunnah" },
                { cls: "tj-ikhfa", label: "Ikhfa" },
                { cls: "tj-idgham", label: "Idgham (other)" },
                { cls: "tj-iqlab", label: "Iqlab" },
                { cls: "tj-qalqalah", label: "Qalqalah" },
                { cls: "tj-madd-normal", label: "Madd (2)" },
                { cls: "tj-madd-obligatory", label: "Madd (4–5)" },
                { cls: "tj-madd-necessary", label: "Madd (6)" },
                { cls: "tj-silent", label: "Silent" },
              ].map((l) => (
                <span key={l.cls} className="inline-flex items-center gap-1.5">
                  <span className={`${l.cls} font-bold`}>●</span>
                  <span className="text-muted-foreground">{l.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bismillah, when it is a prefix rather than an ayah */}
        {firstAyahPresentation?.prefix && (
          <QuranText citation={`${surah.name_transliterated} — Bismillah`} className="my-4">
            {firstAyahPresentation.prefix}
          </QuranText>
        )}

        {/* The ayat */}
        {modeLoading && (
          <div className="flex justify-center py-8">
            <GirihLoader />
          </div>
        )}
        <div>
          {ayat.map((a) => {
            const p = presentAyah(a);
            return (
              <div key={a.id} className="group relative">
                <QuranText
                  variant="reader"
                  id={`ayah-${a.ayah}`}
                  citation={`${surah.name_transliterated} ${surahNumber}:${a.ayah}`}
                  translation={showTranslation ? a.translation : undefined}
                  tajweedMarkup={
                    mode === "tajweed" ? tajweedByAyah?.[a.id] : undefined
                  }
                  words={mode === "words" ? wordsByAyah?.[a.id] : undefined}
                >
                  {p.text}
                </QuranText>
                <button
                  onClick={() => copyAyahLink(a.ayah)}
                  title={`Copy link to ${surahNumber}:${a.ayah}`}
                  className="absolute top-5 end-0 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted transition-opacity"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Closing + navigation */}
        <div className="mt-10">
          <IlluminatedDivider />
          <div className="mt-8 flex items-center justify-between">
            {surahNumber > 1 ? (
              <Link href={`/knowledge/quran/${surahNumber - 1}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 me-1 rtl:rotate-180" />
                  Previous surah
                </Button>
              </Link>
            ) : (
              <span />
            )}
            {surahNumber < 114 ? (
              <Link href={`/knowledge/quran/${surahNumber + 1}`}>
                <Button variant="outline" size="sm">
                  Next surah
                  <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
                </Button>
              </Link>
            ) : (
              <span />
            )}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Text: Tanzil Project (Uthmani, v1.1), CC BY 3.0, unmodified ·{" "}
            <a
              href="https://tanzil.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              tanzil.net
            </a>{" "}
            · Translation: Saheeh International · Word-by-word &amp; tajweed:{" "}
            <a
              href="https://quran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Quran.com
            </a>{" "}
            (Quran Foundation)
          </p>
        </div>
      </div>
    </div>
  );
}
