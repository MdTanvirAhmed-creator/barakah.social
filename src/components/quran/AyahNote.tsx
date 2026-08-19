"use client";

import * as React from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

/**
 * A reader's own note on one ayah.
 *
 * Private by construction — user_ayah_notes has no policy under which another
 * member, moderator or admin can read it (migration 26). Nothing here is
 * shared, counted, or surfaced anywhere else in the platform.
 */
export function AyahNote({
  ayahId,
  citation,
  onClose,
  onSaved,
}: {
  ayahId: number;
  citation: string;
  onClose: () => void;
  onSaved?: (hasNote: boolean) => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const { success, error: showError } = useToast();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [existed, setExisted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("user_ayah_notes")
        .select("text")
        .eq("ayah_id", ayahId)
        .maybeSingle();
      if (cancelled) return;
      setText((data?.text as string) ?? "");
      setExisted(!!data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ayahId, supabase]);

  const save = async () => {
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("user_ayah_notes").upsert(
      { user_id: user.id, ayah_id: ayahId, text: body, updated_at: new Date().toISOString() },
      { onConflict: "user_id,ayah_id" }
    );
    setSaving(false);
    if (error) {
      showError("Could not save your note.");
      return;
    }
    setExisted(true);
    onSaved?.(true);
    success("Note saved");
    onClose();
  };

  const remove = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("user_ayah_notes")
      .delete()
      .eq("ayah_id", ayahId);
    setSaving(false);
    if (error) {
      showError("Could not remove your note.");
      return;
    }
    onSaved?.(false);
    success("Note removed");
    onClose();
  };

  return (
    <div className="my-4 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-semibold text-foreground">Your note · {citation}</p>
          <p className="text-xs text-muted-foreground">Private to you</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close note"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <label htmlFor={`note-${ayahId}`} className="sr-only">
          Your note on {citation}
        </label>
        <textarea
          id={`note-${ayahId}`}
          value={loading ? "" : text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading || saving}
          rows={4}
          placeholder="What do you want to remember about this ayah?"
          className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <div className="mt-3 flex items-center justify-between">
          {existed ? (
            <Button variant="ghost" size="sm" onClick={remove} disabled={saving}>
              <Trash2 className="w-4 h-4 me-2" />
              Remove
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={save} disabled={saving || !text.trim()}>
            {saving ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
    </div>
  );
}
