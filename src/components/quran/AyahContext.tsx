"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Cross-references for an ayah.
 *
 * Only one kind exists so far, and it is sourced rather than inferred: the
 * occasion of revelation (asbab al-nuzul) as recorded by al-Wahidi, in
 * Guezzou's translation. Nothing here is generated, summarised, or guessed
 * from topic similarity — if a connection is not in a named work, it is not
 * shown.
 *
 * The remaining slots (related hadith, and the places an ayah is cited in
 * the classical literature) stay deliberately empty until there is sourced
 * data behind them. The section simply does not render rather than showing
 * a promise.
 */
const ASBAB_SOURCE = "en-asbab-al-nuzul";

export function AyahContext({
  ayahId,
  citation,
}: {
  ayahId: number;
  citation: string;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [occasion, setOccasion] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("quran_tafsir")
        .select("text")
        .eq("ayah_id", ayahId)
        .eq("source_id", ASBAB_SOURCE)
        .maybeSingle();
      if (!cancelled) setOccasion((data?.text as string) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [ayahId, supabase]);

  // Most ayat have no recorded occasion; that is the normal case, not a gap.
  if (!occasion) return null;

  return (
    <div className="my-4 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs font-medium text-foreground">
          Occasion of revelation · {citation}
        </p>
      </div>
      <p
        className={`font-reading text-sm leading-relaxed text-foreground-secondary ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {occasion}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Asbab al-Nuzul, al-Wahidi — tr. Mokrane Guezzou
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-accent-strong hover:underline whitespace-nowrap"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>
    </div>
  );
}
