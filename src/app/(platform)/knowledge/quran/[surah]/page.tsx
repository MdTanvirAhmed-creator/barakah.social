"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Languages, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuranText } from "@/components/ui/QuranText";
import { GirihLoader, IlluminatedDivider } from "@/components/ui/girih";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

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

  useEffect(() => {
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      setLoading(false);
      return;
    }
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
   * Tanzil prefixes the basmalah to ayah 1 of every surah except 1 and 9.
   * Present it on its own line per mushaf convention — display only, the
   * stored text is verbatim.
   */
  const presentAyah = (a: Ayah): { prefix?: string; text: string } => {
    if (
      a.ayah === 1 &&
      surahNumber !== 1 &&
      surahNumber !== 9 &&
      bismillah &&
      a.text_uthmani.startsWith(bismillah)
    ) {
      return { prefix: bismillah, text: a.text_uthmani.slice(bismillah.length).trimStart() };
    }
    return { text: a.text_uthmani };
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
          <div className="mt-5 flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranslation((v) => !v)}
            >
              <Languages className="w-4 h-4 me-2" />
              {showTranslation ? "Hide translation" : "Show translation"}
            </Button>
          </div>
        </div>

        {/* Basmalah, when it is a prefix rather than an ayah */}
        {firstAyahPresentation?.prefix && (
          <QuranText citation={`${surah.name_transliterated} — basmalah`} className="my-4">
            {firstAyahPresentation.prefix}
          </QuranText>
        )}

        {/* The ayat */}
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
            · Translation: Saheeh International
          </p>
        </div>
      </div>
    </div>
  );
}
