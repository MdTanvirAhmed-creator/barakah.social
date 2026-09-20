"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Link2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Collection {
  id: string;
  name_arabic: string;
  name_transliterated: string;
  name_english: string;
  compiler_arabic: string | null;
  compiler_english: string | null;
  compiler_died_ah: number | null;
  hadith_count: number;
  source_id: string;
}

interface Hadith {
  id: number;
  number: number;
  text_arabic: string;
  takhrij_arabic: string | null;
}

interface Source {
  name: string;
  license: string;
  source_url: string;
}

/**
 * A hadith collection, read straight through.
 *
 * The matn renders in `.arabic`, not QuranText — this is transmitted prose,
 * the same category as tafsir, and QuranText remains reserved for Qur'an
 * alone.
 *
 * The takhrij is shown beneath every hadith rather than tucked away. It names
 * who narrated it and, where the compiler recorded one, who graded it and in
 * what words. This platform never grades a hadith itself, and never shows a
 * bare "sahih" stamp with nobody's name attached to it.
 */
export default function HadithCollectionPage() {
  const params = useParams<{ collection: string }>();
  const supabase = React.useMemo(() => createClient(), []);
  const [collection, setCollection] = React.useState<Collection | null>(null);
  const [hadiths, setHadiths] = React.useState<Hadith[]>([]);
  const [source, setSource] = React.useState<Source | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: c } = await sb
        .from("hadith_collections")
        .select("*")
        .eq("id", params.collection)
        .maybeSingle();
      if (cancelled) return;
      if (!c) {
        setLoading(false);
        return;
      }
      const [{ data: h }, { data: s }] = await Promise.all([
        sb
          .from("hadith")
          .select("id, number, text_arabic, takhrij_arabic")
          .eq("collection_id", c.id)
          .order("number"),
        sb.from("hadith_sources").select("name, license, source_url").eq("id", c.source_id).maybeSingle(),
      ]);
      if (cancelled) return;
      setCollection(c as Collection);
      setHadiths((h ?? []) as Hadith[]);
      setSource((s ?? null) as Source | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.collection, supabase]);

  // Deep links to a single hadith, the same contract as the Qur'an reader's
  // #ayah-N anchors.
  React.useEffect(() => {
    if (loading || !window.location.hash) return;
    const el = document.querySelector(window.location.hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const copyLink = (n: number) => {
    const url = `${window.location.origin}${window.location.pathname}#hadith-${n}`;
    navigator.clipboard.writeText(url);
    setCopied(n);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-foreground">That collection is not here.</p>
        <Link href="/knowledge/hadith" className="text-accent-strong hover:underline">
          Back to hadith
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-3 text-center">
        <Link
          href="/knowledge/hadith"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All collections
        </Link>
        <h1 lang="ar" dir="rtl" className="arabic-display arabic-center text-4xl text-foreground">
          {collection.name_arabic}
        </h1>
        <p className="font-display text-xl text-foreground">{collection.name_transliterated}</p>
        <p className="text-foreground-secondary">{collection.name_english}</p>
        {collection.compiler_english && (
          <p className="text-sm text-muted-foreground">
            Compiled by {collection.compiler_english}
            {collection.compiler_died_ah ? `, d. ${collection.compiler_died_ah} AH` : ""}
          </p>
        )}
      </header>

      <div className="space-y-6">
        {hadiths.map((h) => (
          <article
            key={h.id}
            id={`hadith-${h.number}`}
            className="border border-border rounded-lg bg-card p-6 scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Hadith {h.number}
              </span>
              <button
                onClick={() => copyLink(h.number)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={`Copy a link to hadith ${h.number}`}
                title="Copy link"
              >
                {copied === h.number ? (
                  <Check className="w-4 h-4 text-accent-strong" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Transmitted prose, rendered like tafsir. QuranText is for the
                Qur'an and nothing else. */}
            <p
              lang="ar"
              dir="rtl"
              className="arabic text-lg leading-loose text-foreground whitespace-pre-wrap"
            >
              {h.text_arabic}
            </p>

            {h.takhrij_arabic && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  As the compiler recorded it
                </p>
                <p
                  lang="ar"
                  dir="rtl"
                  className="arabic text-sm leading-relaxed text-foreground-secondary"
                >
                  {h.takhrij_arabic}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>

      {source && (
        <footer className="border-t border-border pt-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Source</p>
          <p className="text-sm text-foreground-secondary">{source.name}</p>
          <p className="text-xs text-muted-foreground">{source.license}</p>
          <a
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-strong hover:underline inline-block"
          >
            View the source text
          </a>
          <p className="text-xs text-muted-foreground pt-2">
            No English translation is shown because none of the available ones
            can be lawfully republished here.
          </p>
        </footer>
      )}
    </div>
  );
}
