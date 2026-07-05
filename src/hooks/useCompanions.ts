"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Phase 2 companions flow, backed by the Phase 1 privacy schema:
 * `companionships`, `blocks` and the `public_profiles` card view.
 *
 * Everything here runs on the browser client (anon key + the user's session),
 * so RLS is the enforcement layer — there is no service_role anywhere on
 * this path.
 */

export interface ProfileCard {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CompanionshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
}

export interface CompanionEntry {
  companionship: CompanionshipRow;
  /** The other participant's public card; null if their card is hidden. */
  card: ProfileCard | null;
}

export interface CompanionsState {
  companions: CompanionEntry[];
  incoming: CompanionEntry[];
  outgoing: CompanionEntry[];
  blocked: { blocked_id: string; card: ProfileCard | null }[];
}

const EMPTY_STATE: CompanionsState = {
  companions: [],
  incoming: [],
  outgoing: [],
  blocked: [],
};

export function useCompanions() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<CompanionsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(
    async (ids: string[]): Promise<Map<string, ProfileCard>> => {
      if (ids.length === 0) return new Map();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("public_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      return new Map(((data as ProfileCard[]) ?? []).map((c) => [c.id, c]));
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState(EMPTY_STATE);
        return;
      }
      setUserId(user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase as any)
        .from("companionships")
        .select("id, requester_id, addressee_id, status, created_at, responded_at")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const companionships = (rows as CompanionshipRow[]) ?? [];

      const otherId = (c: CompanionshipRow) =>
        c.requester_id === user.id ? c.addressee_id : c.requester_id;

      // public_profiles hides blocked users from the blocker too, so the
      // block list comes from a definer function scoped to the caller.
      const [cards, { data: blockedCards }] = await Promise.all([
        fetchCards([...new Set(companionships.map(otherId))]),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc("my_blocked_cards"),
      ]);

      const toEntry = (c: CompanionshipRow): CompanionEntry => ({
        companionship: c,
        card: cards.get(otherId(c)) ?? null,
      });

      setState({
        companions: companionships.filter((c) => c.status === "accepted").map(toEntry),
        incoming: companionships
          .filter((c) => c.status === "pending" && c.addressee_id === user.id)
          .map(toEntry),
        outgoing: companionships
          .filter((c) => c.status === "pending" && c.requester_id === user.id)
          .map(toEntry),
        blocked: ((blockedCards as ProfileCard[]) ?? []).map((card) => ({
          blocked_id: card.id,
          card,
        })),
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchCards]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Throws with a readable message on failure; callers toast it. */
  const run = async (op: Promise<{ error: { message: string } | null }>) => {
    const { error } = await op;
    if (error) {
      throw new Error(
        /rate limit exceeded/.test(error.message)
          ? "You've sent too many requests recently. Please try again later."
          : error.message
      );
    }
    await refresh();
  };

  const sendRequest = (addresseeId: string) =>
    run(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("companionships")
        .insert({ requester_id: userId, addressee_id: addresseeId })
    );

  const respond = (companionshipId: string, status: "accepted" | "declined") =>
    run(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("companionships")
        .update({ status })
        .eq("id", companionshipId)
    );

  /** Removes a companionship (or cancels/clears a pending or declined one). */
  const remove = (companionshipId: string) =>
    run(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("companionships").delete().eq("id", companionshipId)
    );

  /** Blocks a user and drops any companionship between the pair. */
  const block = async (targetId: string) => {
    await run(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("blocks")
        .insert({ blocker_id: userId, blocked_id: targetId })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("companionships")
      .delete()
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
      );
    await refresh();
  };

  const unblock = (targetId: string) =>
    run(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("blocks")
        .delete()
        .eq("blocker_id", userId)
        .eq("blocked_id", targetId)
    );

  /**
   * Search the public cards (block-filtered server-side) and annotate each
   * result with the relationship, so the UI can render the right action.
   */
  const search = async (
    query: string
  ): Promise<
    (ProfileCard & {
      relationship: "self" | "companion" | "incoming" | "outgoing" | "none";
      companionshipId?: string;
    })[]
  > => {
    const term = query.trim();
    if (!term) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("public_profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(20);

    const byOther = new Map<string, CompanionshipRow>();
    for (const list of [state.companions, state.incoming, state.outgoing]) {
      for (const e of list) {
        const other =
          e.companionship.requester_id === userId
            ? e.companionship.addressee_id
            : e.companionship.requester_id;
        byOther.set(other, e.companionship);
      }
    }

    return ((data as ProfileCard[]) ?? []).map((card) => {
      if (card.id === userId) return { ...card, relationship: "self" as const };
      const c = byOther.get(card.id);
      if (!c) return { ...card, relationship: "none" as const };
      if (c.status === "accepted")
        return { ...card, relationship: "companion" as const, companionshipId: c.id };
      return {
        ...card,
        relationship:
          c.addressee_id === userId ? ("incoming" as const) : ("outgoing" as const),
        companionshipId: c.id,
      };
    });
  };

  return {
    userId,
    loading,
    ...state,
    refresh,
    sendRequest,
    respond,
    remove,
    block,
    unblock,
    search,
  };
}
