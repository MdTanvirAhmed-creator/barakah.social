"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Languages,
  Link as LinkIcon,
  Play,
  Pause,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  PenLine,
  Palette,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuranText, QuranWord } from "@/components/ui/QuranText";
import { GirihLoader, IlluminatedDivider } from "@/components/ui/girih";
import { TafsirPanel, type TafsirEdition } from "@/components/quran/TafsirPanel";
import { AyahEndMarker } from "@/components/quran/AyahEndMarker";
import { AyahNote } from "@/components/quran/AyahNote";
import { RadialWordMenu, type RadialMenuItem } from "@/components/quran/RadialWordMenu";
import { SurahHeader } from "@/components/quran/SurahHeader";
import { SurahThreshold } from "@/components/quran/SurahThreshold";
import { MemorizationBar } from "@/components/quran/MemorizationBar";
import { AyahContext } from "@/components/quran/AyahContext";
import { useWordActivation } from "@/hooks/useWordActivation";
import { buildAyahAudioUrl } from "@/lib/quran/audio";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

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
  revelation_order: number | null;
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
  /** Every imported translation, keyed by source id. */
  translations: Record<string, string>;
}

export default function SurahReaderPage() {
  const params = useParams();
  const surahNumber = Number(params?.surah);
  const supabase = createClient();
  const { success, error: showError } = useToast();

  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayat, setAyat] = useState<Ayah[]>([]);
  const [bismillah, setBismillah] = useState<string>("");
  const [showTranslation, setShowTranslation] = useState(true);
  const [loading, setLoading] = useState(true);

  // Reading modes: plain Uthmani, tajweed colouring, or word-by-word.
  // Both extra datasets are fetched lazily on first use, then cached.
  const [mode, setMode] = useState<"plain" | "tajweed" | "words" | "memorise">("plain");
  const [tajweedByAyah, setTajweedByAyah] = useState<Record<number, string> | null>(null);
  const [wordsByAyah, setWordsByAyah] = useState<Record<number, QuranWord[]> | null>(null);
  const [modeLoading, setModeLoading] = useState(false);

  // Tafsir editions and reciters come from the provenance ledger, so the
  // reader always names what it is quoting and who is reciting.
  const [editions, setEditions] = useState<TafsirEdition[]>([]);
  const [reciters, setReciters] = useState<{ id: string; name: string; url_template: string }[]>([]);
  const [reciterId, setReciterId] = useState<string>("");
  const [translations, setTranslations] = useState<{ id: string; name: string }[]>([]);
  const [translationId, setTranslationId] = useState<string>("en-sahih-intl");
  const [openTafsir, setOpenTafsir] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [noted, setNoted] = useState<Set<number>>(new Set());

  // Radial menu: which ayah (and optionally which word) it was opened from.
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [menuTarget, setMenuTarget] = useState<{
    ayahId: number;
    ayahNumber: number;
    wordIndex: number | null;
  } | null>(null);

  // One audio element for the whole surah: only one ayah recites at a time.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Sticky header: which ayah is in view, and whether the title block has
  // scrolled away. The header only appears once it has, so nothing floats
  // over the opening of a surah.
  const titleRef = useRef<HTMLDivElement | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(1);

  // Threshold: where this reader left off in *this* surah, what they have
  // marked memorised here, and a named commentary on its opening.
  const [continueAyah, setContinueAyah] = useState<number | null>(null);
  const [memorisedCount, setMemorisedCount] = useState(0);
  const [intro, setIntro] = useState<{ editionName: string; text: string } | null>(null);

  // Memorisation: private marks, repetition settings, and self-testing.
  const [memorised, setMemorised] = useState<Set<number>>(new Set());
  const [repeat, setRepeat] = useState(3);
  const [repeatDelay, setRepeatDelay] = useState(1);
  const [concealed, setConcealed] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const repeatsLeft = useRef(0);

  const switchMode = async (next: "plain" | "tajweed" | "words" | "memorise") => {
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
          .select("id, ayah, text_uthmani, quran_translations(text, source_id)")
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
          // All imported translations come back; pick the selected one.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          translations: Object.fromEntries(
            ((r.quran_translations ?? []) as any[]).map((t) => [t.source_id, t.text])
          ),
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

  // Provenance ledger: which tafsir editions and reciters exist.
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("quran_sources")
        .select("id, name, translator, kind, url_template, language")
        .in("kind", ["tafsir", "audio", "translation"]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = ((data as any[]) ?? []);
      // Concise first: al-Jalalayn is the one that reads well inline.
      const tafsir = rows
        .filter((r) => r.kind === "tafsir")
        // al-Jalalayn leads in both languages: it is the concise one that
        // reads well inline, where the others are essays.
        .sort((a, b) => {
          const lead = (r: { id: string }) => (/-tafsir-al-jalalayn$/.test(r.id) ? 0 : 1);
          return lead(a) - lead(b) || a.name.localeCompare(b.name);
        });
      setEditions(
        tafsir.map((r) => ({
          id: r.id,
          name: r.name,
          translator: r.translator,
          language: r.language ?? "ar",
        }))
      );
      // Saheeh first as the plainest modern English; the rest by name.
      const trans = rows
        .filter((r) => r.kind === "translation" && r.language === "en")
        .sort((a, b) =>
          a.id === "en-sahih-intl" ? -1 : b.id === "en-sahih-intl" ? 1 : a.name.localeCompare(b.name)
        );
      setTranslations(trans.map((r) => ({ id: r.id, name: r.name })));
      if (trans.length) setTranslationId((prev) => (trans.some((t) => t.id === prev) ? prev : trans[0].id));

      const audio = rows.filter((r) => r.kind === "audio" && r.url_template);
      setReciters(audio.map((r) => ({ id: r.id, name: r.name, url_template: r.url_template })));
      setReciterId((prev) => prev || audio[0]?.id || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop any recitation when the surah changes.
  useEffect(() => {
    audioRef.current?.pause();
    setPlayingAyah(null);
    setProgress(0);
    setOpenTafsir(null);
  }, [surahNumber]);

  const toggleAudio = (ayahNumber: number) => {
    const reciter = reciters.find((r) => r.id === reciterId);
    if (!reciter) return;
    const el = audioRef.current;
    if (!el) return;
    if (playingAyah === ayahNumber) {
      el.pause();
      setPlayingAyah(null);
      return;
    }
    el.src = buildAyahAudioUrl(reciter.url_template, surahNumber, ayahNumber);
    setProgress(0);
    setPlayingAyah(ayahNumber);
    // Memorisation replays the same ayah; elsewhere it plays once.
    repeatsLeft.current = mode === "memorise" ? Math.max(1, repeat) : 1;
    el.play().catch(() => {
      setPlayingAyah(null);
      showError("Could not play this recitation. Please try again.");
    });
  };

  // A reader's own marks for this surah (private; migration 26).
  useEffect(() => {
    if (!ayat.length) return;
    const ids = ayat.map((a) => a.id);
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [{ data: bm }, { data: nt }, { data: mm }] = await Promise.all([
        sb.from("user_ayah_bookmarks").select("ayah_id").in("ayah_id", ids),
        sb.from("user_ayah_notes").select("ayah_id").in("ayah_id", ids),
        sb
          .from("user_memorization")
          .select("ayah_id")
          .eq("state", "memorised")
          .in("ayah_id", ids),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBookmarked(new Set(((bm as any[]) ?? []).map((r) => r.ayah_id)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNoted(new Set(((nt as any[]) ?? []).map((r) => r.ayah_id)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMemorised(new Set(((mm as any[]) ?? []).map((r) => r.ayah_id)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayat]);

  const toggleBookmark = async (ayahId: number, citation: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const has = bookmarked.has(ayahId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = has
      ? await sb.from("user_ayah_bookmarks").delete().eq("ayah_id", ayahId)
      : await sb.from("user_ayah_bookmarks").insert({ user_id: user.id, ayah_id: ayahId });
    if (error) {
      showError("Could not update your bookmark.");
      return;
    }
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (has) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
    success(has ? `Bookmark removed — ${citation}` : `Bookmarked ${citation}`);
  };

  // Title block out of view -> show the sticky header.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { rootMargin: "-8px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading]);

  // Which ayah is being read. Also the reader's saved position: written at
  // most once every few seconds, and only ever for themselves.
  useEffect(() => {
    if (loading || !ayat.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!top) return;
        const n = Number((top.target as HTMLElement).dataset.ayahNumber);
        if (Number.isInteger(n)) setCurrentAyah(n);
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    document.querySelectorAll("[data-ayah-number]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading, ayat, mode]);

  useEffect(() => {
    if (loading || !ayat.length) return;
    const row = ayat.find((a) => a.ayah === currentAyah);
    if (!row) return;
    const t = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("user_reading_position").upsert(
        { user_id: user.id, ayah_id: row.id, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyah, loading, ayat]);

  const goToAyah = (n: number) => {
    document
      .getElementById(`ayah-${n}`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  // Threshold data: saved position (if it falls in this surah), memorised
  // count here, and a named commentary on the opening ayah.
  useEffect(() => {
    if (!ayat.length || !surah) return;
    const ids = new Set(ayat.map((a) => a.id));
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [{ data: pos }, { data: mem }] = await Promise.all([
        sb.from("user_reading_position").select("ayah_id").maybeSingle(),
        sb.from("user_memorization").select("ayah_id").eq("state", "memorised"),
      ]);
      const posId = pos?.ayah_id as number | undefined;
      const here = posId && ids.has(posId) ? ayat.find((a) => a.id === posId) : undefined;
      setContinueAyah(here ? here.ayah : null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMemorisedCount((((mem as any[]) ?? []).filter((r) => ids.has(r.ayah_id))).length);

      // The opening ayah's tafsir, from whichever edition leads. Shown as
      // what it is — commentary on the opening — not as a surah summary.
      const lead = editions[0];
      if (lead && ayat[0]) {
        const { data: t } = await sb
          .from("quran_tafsir")
          .select("text")
          .eq("ayah_id", ayat[0].id)
          .eq("source_id", lead.id)
          .maybeSingle();
        setIntro(
          t?.text
            ? { editionName: lead.name.replace(/\s*\((Arabic|English)\)$/, ""), text: t.text }
            : null
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayat, surah, editions]);

  const wordHandlers = useWordActivation(setMenuAnchor);

  /**
   * The radial menu's five actions. Tafsir and Audio are no longer greyed
   * out — both are backed by imported, provenance-carrying data now.
   */
  const buildMenuItems = (): RadialMenuItem[] => {
    const t = menuTarget;
    if (!t) return [];
    const citation = `${surah?.name_transliterated ?? ""} ${surahNumber}:${t.ayahNumber}`.trim();
    return [
      {
        id: "tajweed",
        label: mode === "tajweed" ? "Plain reading" : "Tajweed",
        icon: Palette,
        onSelect: () => void switchMode(mode === "tajweed" ? "plain" : "tajweed"),
      },
      {
        id: "audio",
        label: playingAyah === t.ayahNumber ? "Pause" : "Recite",
        icon: playingAyah === t.ayahNumber ? Pause : Play,
        onSelect: () => toggleAudio(t.ayahNumber),
        disabled: reciters.length === 0,
        disabledReason: "No reciter available",
      },
      {
        id: "tafsir",
        label: "Tafsir",
        icon: BookOpen,
        onSelect: () => setOpenTafsir((cur) => (cur === t.ayahId ? null : t.ayahId)),
        disabled: editions.length === 0,
        disabledReason: "No tafsir imported",
      },
      {
        id: "bookmark",
        label: bookmarked.has(t.ayahId) ? "Remove bookmark" : "Bookmark",
        icon: bookmarked.has(t.ayahId) ? BookmarkCheck : Bookmark,
        onSelect: () => void toggleBookmark(t.ayahId, citation),
      },
      {
        id: "note",
        label: noted.has(t.ayahId) ? "Your note" : "Note",
        icon: PenLine,
        onSelect: () => setOpenNote((cur) => (cur === t.ayahId ? null : t.ayahId)),
      },
    ];
  };

  const toggleMemorised = async (ayahId: number, citation: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const has = memorised.has(ayahId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = has
      ? await sb.from("user_memorization").delete().eq("ayah_id", ayahId)
      : await sb.from("user_memorization").upsert(
          { user_id: user.id, ayah_id: ayahId, state: "memorised", updated_at: new Date().toISOString() },
          { onConflict: "user_id,ayah_id" }
        );
    if (error) {
      showError("Could not update your memorisation mark.");
      return;
    }
    setMemorised((prev) => {
      const next = new Set(prev);
      if (has) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
    success(has ? `Unmarked ${citation}` : `Marked ${citation} memorised`);
  };

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
        <SurahHeader
          nameArabic={surah.name_arabic}
          nameTransliterated={surah.name_transliterated}
          nameEnglish={surah.name_english}
          currentAyah={currentAyah}
          ayahCount={surah.ayah_count}
          mode={mode}
          onModeChange={(m) => void switchMode(m)}
          showTranslation={showTranslation}
          onToggleTranslation={() => setShowTranslation((v) => !v)}
          visible={headerVisible}
        />

        {/* Surah header */}
        <div ref={titleRef}>
          <Link
            href="/knowledge/quran"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All surahs
          </Link>

          <SurahThreshold
            nameArabic={surah.name_arabic}
            nameTransliterated={surah.name_transliterated}
            nameEnglish={surah.name_english}
            revelationPlace={surah.revelation_place}
            revelationOrder={surah.revelation_order}
            ayahCount={surah.ayah_count}
            openingAyah={
              ayat[0]
                ? {
                    text: presentAyah(ayat[0]).text,
                    // The epigraph follows the same rule as the mushaf: no
                    // translation while memorising, or the first ayah gives
                    // itself away before the reader has tested themselves.
                    translation:
                      mode === "memorise"
                        ? undefined
                        : ayat[0].translations[translationId],
                    citation: `${surah.name_transliterated} ${surahNumber}:${ayat[0].ayah}`,
                  }
                : undefined
            }
            continueAyah={continueAyah}
            memorisedCount={memorisedCount}
            intro={intro}
            onBeginReading={() => goToAyah(ayat[0]?.ayah ?? 1)}
            onListen={() => toggleAudio(ayat[0]?.ayah ?? 1)}
            onContinue={() => continueAyah && goToAyah(continueAyah)}
            onOpenIntro={
              ayat[0] ? () => setOpenTafsir(ayat[0].id) : undefined
            }
          />

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {/* Reading mode */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(
                [
                  { value: "plain", label: "Reading" },
                  { value: "tajweed", label: "Tajweed" },
                  { value: "words", label: "Word by word" },
                  { value: "memorise", label: "Memorise" },
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
            {translations.length > 1 && (
              <select
                value={translationId}
                onChange={(e) => setTranslationId(e.target.value)}
                aria-label="Translation"
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground"
              >
                {translations.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            {reciters.length > 1 && (
              <select
                value={reciterId}
                onChange={(e) => {
                  audioRef.current?.pause();
                  setPlayingAyah(null);
                  setReciterId(e.target.value);
                }}
                aria-label="Reciter"
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground"
              >
                {reciters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.replace(/\s*\(128kbps\)$/, "")}
                  </option>
                ))}
              </select>
            )}
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

        {mode === "memorise" && (
          <MemorizationBar
            repeat={repeat}
            onRepeatChange={setRepeat}
            delaySeconds={repeatDelay}
            onDelayChange={setRepeatDelay}
            concealed={concealed}
            onToggleConceal={() => {
              setConcealed((v) => !v);
              setRevealed(new Set());
            }}
            memorised={ayat.filter((a) => memorised.has(a.id)).length}
            total={ayat.length}
          />
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
            const citation = `${surah.name_transliterated} ${surahNumber}:${a.ayah}`;
            const isPlaying = playingAyah === a.ayah;
            return (
              <div key={a.id} data-ayah-number={a.ayah}>
                {/* Chrome appears on engagement, never permanently. */}
                <div
                  className={cn(
                    "group relative",
                    mode === "memorise" && concealed && !revealed.has(a.id)
                      ? "cursor-pointer"
                      : ""
                  )}
                  onClick={
                    mode === "memorise" && concealed && !revealed.has(a.id)
                      ? () =>
                          setRevealed((prev) => new Set(prev).add(a.id))
                      : undefined
                  }
                >
                  <QuranText
                    className={
                      mode === "memorise" && concealed && !revealed.has(a.id)
                        ? "blur-sm select-none"
                        : undefined
                    }
                    variant="reader"
                    id={`ayah-${a.ayah}`}
                    citation={citation}
                    translation={
                      showTranslation && mode !== "memorise"
                        ? a.translations[translationId]
                        : undefined
                    }
                    tajweedMarkup={mode === "tajweed" ? tajweedByAyah?.[a.id] : undefined}
                    words={mode === "words" ? wordsByAyah?.[a.id] : undefined}
                    endMarker={
                      <AyahEndMarker
                        ayahNumber={a.ayah}
                        citation={citation}
                        onActivate={(rect) => {
                          setMenuTarget({ ayahId: a.id, ayahNumber: a.ayah, wordIndex: null });
                          setMenuAnchor(rect);
                        }}
                      />
                    }
                  >
                    {/* Each word is its own handle, so the radial menu can
                        open on a word rather than the whole ayah. Split from
                        the canonical Tanzil text — never re-joined from the
                        word dataset, whose orthography is a different
                        edition's. */}
                    {p.text.split(/\s+/).map((token, i, all) => (
                      <span key={i}>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Word ${i + 1} of ${all.length}, ${citation}`}
                          aria-haspopup="menu"
                          {...wordHandlers}
                          onClick={(e) => {
                            setMenuTarget({ ayahId: a.id, ayahNumber: a.ayah, wordIndex: i });
                            wordHandlers.onClick(e);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setMenuTarget({ ayahId: a.id, ayahNumber: a.ayah, wordIndex: i });
                            }
                            wordHandlers.onKeyDown(e);
                          }}
                          className="rounded px-0.5 cursor-pointer transition-colors duration-150 hover:bg-[rgb(var(--primary-600)/0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        >
                          {token}
                        </span>
                        {i < all.length - 1 ? " " : null}
                      </span>
                    ))}
                  </QuranText>

                  <div
                    className={`absolute top-4 end-0 flex items-center gap-0.5 transition-opacity ${
                      isPlaying || openTafsir === a.id || openNote === a.id || mode === "memorise"
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    }`}
                  >
                    {reciters.length > 0 && (
                      <button
                        onClick={() => toggleAudio(a.ayah)}
                        aria-label={
                          isPlaying ? `Pause ${citation}` : `Recite ${citation}`
                        }
                        title={isPlaying ? "Pause" : "Recite"}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    {editions.length > 0 && (
                      <button
                        onClick={() =>
                          setOpenTafsir((cur) => (cur === a.id ? null : a.id))
                        }
                        aria-label={`Tafsir for ${citation}`}
                        aria-expanded={openTafsir === a.id}
                        title="Tafsir"
                        className={`p-1.5 rounded-md transition-colors hover:bg-muted ${
                          openTafsir === a.id
                            ? "text-accent-strong"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {mode === "memorise" && (
                      <button
                        onClick={() => toggleMemorised(a.id, citation)}
                        aria-label={
                          memorised.has(a.id)
                            ? `Unmark ${citation} as memorised`
                            : `Mark ${citation} memorised`
                        }
                        aria-pressed={memorised.has(a.id)}
                        title={memorised.has(a.id) ? "Memorised" : "Mark memorised"}
                        className={`p-1.5 rounded-md transition-colors hover:bg-muted ${
                          memorised.has(a.id)
                            ? "text-accent-strong"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {memorised.has(a.id) ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => toggleBookmark(a.id, citation)}
                      aria-label={
                        bookmarked.has(a.id)
                          ? `Remove bookmark from ${citation}`
                          : `Bookmark ${citation}`
                      }
                      title={bookmarked.has(a.id) ? "Bookmarked" : "Bookmark"}
                      className={`p-1.5 rounded-md transition-colors hover:bg-muted ${
                        bookmarked.has(a.id)
                          ? "text-accent-strong"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {bookmarked.has(a.id) ? (
                        <BookmarkCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setOpenNote((cur) => (cur === a.id ? null : a.id))}
                      aria-label={`Note on ${citation}`}
                      aria-expanded={openNote === a.id}
                      title={noted.has(a.id) ? "Your note" : "Add a note"}
                      className={`p-1.5 rounded-md transition-colors hover:bg-muted ${
                        noted.has(a.id) || openNote === a.id
                          ? "text-accent-strong"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyAyahLink(a.ayah)}
                      aria-label={`Copy link to ${citation}`}
                      title="Copy link"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Recitation progress: a filling track, not a decoded waveform. */}
                  {isPlaying && (
                    <div
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-muted overflow-hidden"
                      role="progressbar"
                      aria-label={`Recitation progress, ${citation}`}
                      aria-valuenow={Math.round(progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-primary-600"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {openNote === a.id && (
                  <AyahNote
                    ayahId={a.id}
                    citation={citation}
                    onClose={() => setOpenNote(null)}
                    onSaved={(has) =>
                      setNoted((prev) => {
                        const next = new Set(prev);
                        if (has) next.add(a.id);
                        else next.delete(a.id);
                        return next;
                      })
                    }
                  />
                )}

                {openTafsir === a.id && (
                  <AyahContext ayahId={a.id} citation={citation} />
                )}

                {openTafsir === a.id && (
                  <TafsirPanel
                    ayahId={a.id}
                    citation={citation}
                    editions={editions}
                    onClose={() => setOpenTafsir(null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* The radial menu — one instance, retargeted per word/ayah. */}
        <RadialWordMenu
          anchorRect={menuAnchor}
          label={
            menuTarget
              ? `Actions for ${surah.name_transliterated} ${surahNumber}:${menuTarget.ayahNumber}`
              : "Ayah actions"
          }
          onClose={() => setMenuAnchor(null)}
          items={buildMenuItems()}
        />

        {/* One shared audio element for the surah. */}
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) setProgress(el.currentTime / el.duration);
          }}
          onEnded={() => {
            const el = audioRef.current;
            repeatsLeft.current -= 1;
            if (el && repeatsLeft.current > 0) {
              setProgress(0);
              window.setTimeout(() => {
                el.currentTime = 0;
                void el.play().catch(() => setPlayingAyah(null));
              }, repeatDelay * 1000);
              return;
            }
            setPlayingAyah(null);
            setProgress(0);
          }}
          onError={() => {
            if (playingAyah !== null) {
              setPlayingAyah(null);
              showError("That recitation could not be loaded.");
            }
          }}
          className="hidden"
        />

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
