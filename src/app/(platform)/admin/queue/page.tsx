"use client";

import * as React from "react";
import { Loader2, EyeOff, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGate } from "@/components/admin/AdminGate";
import { createClient } from "@/lib/supabase/client";
import { loadAuthors, authorFrom, type Author } from "@/lib/supabase/authors";
import { useToast } from "@/hooks/useToast";

interface QueueItem {
  id: string;
  content: string;
  created_at: string;
  author: Author;
}

/**
 * The proactive queue.
 *
 * Reported content tells you what someone already noticed. This is the other
 * half: posts addressed to everyone, oldest first, so nothing sits unseen
 * while newer things are looked at.
 *
 * It shows ONLY public posts — the ones every signed-in member can already
 * read. A moderator gains no sight into anyone's companions-only
 * conversation, which is the line drawn in Phase 5 and worth keeping: the
 * queue is a working surface for what is already open, not a window into what
 * is not.
 *
 * There is no count of how many anyone has cleared. Moderation is a duty, not
 * a score.
 */
function Queue() {
  const supabase = React.useMemo(() => createClient(), []);
  const { success, error: showError } = useToast();
  const [items, setItems] = React.useState<QueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [hiding, setHiding] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: reviewed } = await sb.from("post_reviews").select("post_id");
    const seen = new Set(((reviewed ?? []) as { post_id: string }[]).map((r) => r.post_id));

    const { data: posts } = await sb
      .from("posts")
      .select("id, content, created_at, author_id")
      .eq("visibility", "public")
      .eq("is_deleted", false)
      .is("hidden_at", null)
      // Oldest first: the queue is a backlog to clear, not a feed to browse.
      .order("created_at", { ascending: true })
      .limit(100);

    const rows = ((posts ?? []) as { id: string; content: string; created_at: string; author_id: string }[])
      .filter((p) => !seen.has(p.id));
    const authors = await loadAuthors(supabase, rows.map((p) => p.author_id));
    setItems(rows.map((p) => ({ ...p, author: authorFrom(authors, p.author_id) })));
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const letStand = async (item: QueueItem) => {
    setBusy(item.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("post_reviews")
      .insert({ post_id: item.id, reviewed_by: user?.id });
    setBusy(null);
    if (error) {
      showError("Could not record that. Please try again.");
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== item.id));
  };

  const hide = async (item: QueueItem) => {
    if (!reason.trim()) {
      showError("Say why it is being hidden.");
      return;
    }
    setBusy(item.id);
    // hidden_by and hidden_at are stamped by the database, not sent from here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("posts")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: reason.trim() })
      .eq("id", item.id);
    setBusy(null);
    if (error) {
      showError(error.message);
      return;
    }
    setHiding(null);
    setReason("");
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    success("Hidden. The author can still see it, and an admin can restore it.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Review queue</h1>
        <p className="text-foreground-secondary mt-1">
          Posts addressed to everyone, oldest first. Only what every member can
          already read — nobody&rsquo;s companions-only conversation appears here.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-foreground">Nothing waiting.</p>
          <p className="text-sm text-muted-foreground">
            Everything said to the whole community has been looked at.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="border border-border rounded-lg bg-card p-5 space-y-3">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-medium text-foreground">{item.author.full_name}</span>
                <span className="text-muted-foreground">@{item.author.username}</span>
                <span className="text-muted-foreground">
                  · {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-foreground whitespace-pre-wrap">{item.content}</p>

              {hiding === item.id ? (
                <div className="space-y-3 pt-2 border-t border-border">
                  <label htmlFor={`reason-${item.id}`} className="block text-sm text-foreground">
                    Why is this being hidden? The author will see this.
                  </label>
                  <Input
                    id={`reason-${item.id}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Personal attack on another member"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => hide(item)} disabled={busy === item.id}>
                      {busy === item.id ? "Hiding…" : "Hide this post"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setHiding(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => letStand(item)}
                    disabled={busy === item.id}
                  >
                    <Check className="w-4 h-4 me-2" />
                    Let it stand
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setHiding(item.id);
                      setReason("");
                    }}
                  >
                    <EyeOff className="w-4 h-4 me-2" />
                    Hide
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QueuePage() {
  return <AdminGate>{() => <Queue />}</AdminGate>;
}
