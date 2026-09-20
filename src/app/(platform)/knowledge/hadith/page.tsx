"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Collection {
  id: string;
  name_arabic: string;
  name_transliterated: string;
  name_english: string;
  compiler_english: string | null;
  compiler_died_ah: number | null;
  hadith_count: number;
}

/**
 * The hadith section of Al-Hikmah.
 *
 * One collection today, and the page says so rather than implying a library.
 * Stage 2 was planned as the six books; every machine-readable corpus of them
 * fails this project's sourcing rules, so it begins with a collection whose
 * provenance is simple and whose every hadith carries its own attribution.
 */
export default function HadithIndexPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("hadith_collections")
        .select("id, name_arabic, name_transliterated, name_english, compiler_english, compiler_died_ah, hadith_count")
        .order("name_transliterated");
      if (cancelled) return;
      setCollections((data ?? []) as Collection[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">Hadith</h1>
        <p className="text-foreground-secondary">
          Collections of the words and practice of the Prophet, peace be upon
          him, each hadith shown with the attribution its compiler gave it.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/knowledge/hadith/${c.id}`}
                className="block border border-border rounded-lg bg-card p-5 hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl text-foreground">
                      {c.name_transliterated}
                    </h2>
                    <p className="text-foreground-secondary text-sm mt-0.5">{c.name_english}</p>
                    {c.compiler_english && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Compiled by {c.compiler_english}
                        {c.compiler_died_ah ? `, d. ${c.compiler_died_ah} AH` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    {/* Arabic comes from the database, never a literal in this file. */}
                    <p lang="ar" dir="rtl" className="arabic text-xl text-foreground">
                      {c.name_arabic}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.hadith_count} hadith
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Honest about the shape of what is here, rather than letting a
              single entry imply the rest is coming imminently. */}
          <div className="border-s-2 border-border ps-4 space-y-2">
            <p className="text-sm text-foreground-secondary">
              Only one collection so far. The major collections are not yet
              here because no machine-readable edition of them has a licence
              this project can honestly rely on — the openly available ones are
              either non-commercial, unlicensed, or copies of other sites
              republished by people who did not hold the rights.
            </p>
            <p className="text-sm text-muted-foreground">
              Arabic is shown without translation where no translation can be
              lawfully published. An empty space is more honest than a
              borrowed one.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
