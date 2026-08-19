"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GirihLoader } from "@/components/ui/girih";
import { cn } from "@/lib/utils";

/**
 * Classical tafsir, opened deliberately for one ayah.
 *
 * The four editions differ enormously in scale — al-Jalalayn averages a
 * couple of hundred characters, Ibn Kathir several thousand — so the panel
 * gives the long ones their own scroll rather than pushing the mushaf off
 * the screen. Editions are fetched on demand and cached per ayah.
 *
 * The passages are Arabic prose *about* the Qur'an, not Qur'anic text, so
 * they render in the reading Arabic face rather than through QuranText.
 * Where an edition has no passage for an ayah (al-Jalalayn is concise and
 * skips repeated refrains) the panel says so instead of looking broken.
 */

export interface TafsirEdition {
  id: string;
  name: string;
  translator: string | null;
  language: string;
}

interface TafsirPanelProps {
  ayahId: number;
  citation: string;
  editions: TafsirEdition[];
  onClose: () => void;
}

/**
 * These editions carry the editor's manuscript apparatus inline, in double
 * brackets — e.g. a variant reading found in a particular copy. It is part
 * of the edition and shouldn't be stripped, but it isn't the commentary
 * either, so it recedes instead of competing with it.
 */
function renderWithApparatus(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\[\[[^\]]*\]\]/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={key++} className="text-xs text-muted-foreground/70">
        {m[0]}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** `ar-tafsir-al-jalalayn` and `en-tafsir-al-jalalayn` are the same work. */
function workKey(id: string): string {
  return id.replace(/^(ar|en)-/, "");
}

export function TafsirPanel({ ayahId, citation, editions, onClose }: TafsirPanelProps) {
  const supabase = createClient();
  // Arabic and English are separate editions, not two columns of one: the
  // English works are different translators of different originals, and some
  // (al-Tustari, Asbab al-Nuzul) are selective by nature. Switching language
  // therefore switches the set of editions on offer.
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const inLang = React.useMemo(
    () => editions.filter((e) => e.language === lang),
    [editions, lang]
  );
  const [editionId, setEditionId] = React.useState(editions[0]?.id ?? "");

  // Switching language should keep you on the same *work* where a counterpart
  // exists — reading al-Jalalayn in Arabic and tapping English should give
  // you al-Jalalayn in English, not drop you on an unrelated commentary.
  // Only when there is no counterpart does it fall back to the first edition.
  React.useEffect(() => {
    if (!inLang.length || inLang.some((e) => e.id === editionId)) return;
    const counterpart = inLang.find((e) => workKey(e.id) === workKey(editionId));
    setEditionId((counterpart ?? inLang[0]).id);
  }, [inLang, editionId]);
  const [cache, setCache] = React.useState<Record<string, string | null>>({});
  const [loading, setLoading] = React.useState(false);

  const key = `${ayahId}:${editionId}`;
  const text = cache[key];

  React.useEffect(() => {
    if (!editionId || key in cache) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("quran_tafsir")
        .select("text")
        .eq("ayah_id", ayahId)
        .eq("source_id", editionId)
        .maybeSingle();
      if (cancelled) return;
      setCache((c) => ({ ...c, [key]: (data?.text as string) ?? null }));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ayahId, editionId, key, cache, supabase]);

  const active = editions.find((e) => e.id === editionId);
  const languages: ("ar" | "en")[] = ["ar", "en"];
  const hasLang = (l: string) => editions.some((e) => e.language === l);

  return (
    <div className="my-4 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Tafsir · {citation}</p>
          {active?.translator && (
            <p className="text-xs text-muted-foreground truncate">{active.translator}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close tafsir"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Language */}
      {languages.filter(hasLang).length > 1 && (
        <div className="flex gap-1 px-3 pt-3">
          {languages.filter(hasLang).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                lang === l
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      )}

      {/* Edition tabs */}
      <div className="flex flex-wrap gap-1 px-3 pt-3" role="tablist" aria-label="Tafsir edition">
        {inLang.map((e) => (
          <button
            key={e.id}
            role="tab"
            aria-selected={e.id === editionId}
            onClick={() => setEditionId(e.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              e.id === editionId
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {e.name.replace(/\s*\((Arabic|English)\)$/, "")}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-h-[26rem] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <GirihLoader />
          </div>
        ) : text ? (
          <p
            lang={active?.language ?? "ar"}
            dir={active?.language === "en" ? "ltr" : "rtl"}
            className={cn(
              "text-base leading-loose text-foreground-secondary whitespace-pre-wrap",
              active?.language === "en" ? "font-reading" : "arabic"
            )}
          >
            {renderWithApparatus(text)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {active?.name.replace(/\s*\((Arabic|English)\)$/, "")} has no separate passage
            for this ayah.
          </p>
        )}
      </div>
    </div>
  );
}
