"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

/**
 * The daily digest opt-out — the only email the platform sends.
 *
 * Backed by user_email_prefs (migration 28) and read by the mailer itself,
 * so turning it off genuinely stops the mail rather than only changing what
 * the screen says. Absence of a row means opted in, matching the column
 * default.
 */
export function DigestPreference() {
  const supabase = React.useMemo(() => createClient(), []);
  const { success, error: showError } = useToast();
  const [enabled, setEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("user_email_prefs")
        .select("daily_digest")
        .maybeSingle();
      if (cancelled) return;
      setEnabled(data?.daily_digest ?? true);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("user_email_prefs").upsert(
      { user_id: user.id, daily_digest: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      showError("Could not save that preference.");
      return;
    }
    setEnabled(next);
    success(next ? "Daily digest on" : "Daily digest off");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking…
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Daily digest</p>
        <p className="text-sm text-muted-foreground">
          At most one email a day, and only when something is actually waiting.
          It is the only email we send.
        </p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label="Daily digest email"
        onClick={toggle}
        disabled={saving}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-primary-600" : "bg-muted"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left] ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
