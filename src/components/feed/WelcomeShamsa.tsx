"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shamsa } from "@/components/ui/girih";

const SEEN_KEY = "bk-welcome-seen";

/**
 * The welcome bloom (spec §6 hero mode + §12 gating).
 *
 * Real gate: plays once for a genuinely new session — the feed is empty
 * and localStorage has no `bk-welcome-seen`. Established accounts never
 * see it again.
 *
 * Dev preview (§12.2): `/feed?preview=welcome` replays it on demand —
 * available only outside production builds.
 *
 * Reset path (§12.3): `localStorage.removeItem("bk-welcome-seen")` in the
 * console (or a fresh browser profile / test account), then reload with
 * an empty feed.
 */
export function WelcomeShamsa() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  const preview =
    process.env.NODE_ENV !== "production" && searchParams?.get("preview") === "welcome";

  useEffect(() => {
    if (preview) {
      // Defer past the effect so the state change never cascades a render.
      const t = setTimeout(() => setShow(true), 0);
      return () => clearTimeout(t);
    }
    if (window.localStorage.getItem(SEEN_KEY)) return;
    // Genuinely new session: nothing visible in the feed yet.
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("posts")
      .select("id", { count: "exact", head: true })
      .limit(1)
      .then(({ count }: { count: number | null }) => {
        if (!count) {
          window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
          setShow(true);
        }
      });
  }, [preview]);

  if (!show) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card px-6 py-10 mb-6 text-center">
      <div className="girih-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex flex-col items-center">
        <Shamsa mode="hero" />
        <h2 className="font-display text-2xl font-medium text-foreground mt-4">
          As-salamu alaykum
        </h2>
        <p className="text-foreground-secondary mt-2 max-w-sm">
          Your Minbar is quiet. Find your companions to begin.
        </p>
      </div>
    </div>
  );
}
