"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus, Check, Inbox } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

/**
 * Barīd — the quiet inbox.
 *
 * A deliberate rejection of the attention economy: there is no red badge, no
 * unread count, no dot that follows you around. Notifications wait patiently
 * until you choose to look. Opening the inbox marks everything seen. The daily
 * digest email (Phase 6) covers anything you miss — nothing here demands you.
 */

type NotificationType = "companion_request" | "companion_accepted";

interface NotificationRow {
  id: string;
  type: NotificationType;
  actor_id: string | null;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
}

interface Actor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function NotificationInbox() {
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [actors, setActors] = useState<Record<string, Actor>>({});
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notifications")
      .select("id, type, actor_id, entity_id, created_at, read_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const rows = (data as NotificationRow[] | null) ?? [];
    setItems(rows);

    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    if (actorIds.length) {
      const { data: profs } = await (supabase as any)
        .from("public_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", actorIds);
      const map: Record<string, Actor> = {};
      (profs as Actor[] | null)?.forEach((p) => (map[p.id] = p));
      setActors(map);
    }
  }, [supabase, user]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  // Opening the inbox is the act of reading — mark everything seen, quietly.
  const handleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && user && items.some((i) => !i.read_at)) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
      await (supabase as any)
        .from("notifications")
        .update({ read_at: now })
        .is("read_at", null)
        .eq("user_id", user.id);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  function describe(n: NotificationRow): { text: string; href: string } {
    const who = n.actor_id ? actors[n.actor_id]?.display_name ?? "Someone" : "Someone";
    const username = n.actor_id ? actors[n.actor_id]?.username : undefined;
    if (n.type === "companion_request") {
      return { text: `${who} would like to be your companion`, href: "/companions" };
    }
    return {
      text: `${who} accepted your companionship`,
      href: username ? `/profile/${username}` : "/companions",
    };
  }

  return (
    <div className="relative" ref={ref}>
      {/* A plain bell. No count, no colour, no urgency. */}
      <button
        onClick={handleOpen}
        aria-label="Inbox"
        className="p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-2 top-full mt-2 w-80 md:w-96 max-w-[calc(100vw-320px)] bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-foreground">Inbox</h3>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Nothing new. You&rsquo;re all caught up.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((n) => {
                    const { text, href } = describe(n);
                    const actor = n.actor_id ? actors[n.actor_id] : undefined;
                    const Icon = n.type === "companion_request" ? UserPlus : Check;
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage src={actor?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary-100 text-primary-700">
                            {getInitials(actor?.display_name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{text}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
