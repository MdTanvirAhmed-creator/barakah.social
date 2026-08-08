"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GirihLoader } from "@/components/ui/girih";

interface Surah {
  number: number;
  name_arabic: string;
  name_transliterated: string;
  name_english: string;
  revelation_place: "makkah" | "madinah";
  ayah_count: number;
}

export default function QuranIndexPage() {
  const supabase = createClient();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("quran_surahs")
        .select("*")
        .order("number");
      setSurahs((data as Surah[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = query
    ? surahs.filter(
        (s) =>
          s.name_transliterated.toLowerCase().includes(query.toLowerCase()) ||
          s.name_english.toLowerCase().includes(query.toLowerCase()) ||
          String(s.number) === query.trim()
      )
    : surahs;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container-custom py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg craft-tile-teal">
              <BookOpen className="w-6 h-6 text-accent-strong" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">The Noble Qur&rsquo;an</h1>
              <p className="text-foreground-secondary">
                Verified text from the Tanzil Project, with the Saheeh International translation
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a surah by name or number…"
            className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <GirihLoader />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
              >
                <Link
                  href={`/knowledge/quran/${s.number}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary-600/50 hover:shadow-md transition-all group"
                >
                  <span className="flex-shrink-0 w-10 h-10 rotate-45 rounded-sm craft-tile-lapis flex items-center justify-center">
                    <span className="-rotate-45 text-sm font-semibold text-accent-strong">
                      {s.number}
                    </span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                      {s.name_transliterated}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {s.name_english} · {s.ayah_count} ayat ·{" "}
                      {s.revelation_place === "makkah" ? "Makkah" : "Madinah"}
                    </span>
                  </span>
                  <span lang="ar" dir="rtl" className="font-arabic text-lg text-foreground-secondary">
                    {s.name_arabic}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Provenance */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Qur&rsquo;anic text: Tanzil Project (Uthmani, v1.1), CC BY 3.0, unmodified —{" "}
          <a
            href="https://tanzil.net"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            tanzil.net
          </a>
        </p>
      </div>
    </div>
  );
}
