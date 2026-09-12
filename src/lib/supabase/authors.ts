import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolving who wrote something, for a reader who may not know them.
 *
 * `profiles` is readable only to companions. Embedding it in a post or comment
 * query therefore returns null for anyone else — and since the minbar opened,
 * "anyone else" is the common case rather than a corner. Reading a field off
 * that null throws inside the row mapper and empties the entire list, so a
 * single stranger's post takes the whole feed down with it.
 *
 * `public_profiles` is the view that exists for exactly this: the parts of a
 * profile anyone may see, already excluding people who have blocked you.
 *
 * Use loadAuthors + authorFrom anywhere a list can contain something written
 * by someone the reader has no companionship with. Do not embed
 * `profiles!..._author_id_fkey` for author identity; that is the shape that
 * caused the bug.
 */
export interface Author {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_verified_scholar: boolean;
}

/** Someone real wrote this, but this reader may not see who. */
const UNKNOWN: Omit<Author, "id"> = {
  username: "someone",
  full_name: "Someone",
  avatar_url: undefined,
  is_verified_scholar: false,
};

/**
 * Looks up the given author ids in one query. Ids that cannot be resolved are
 * simply absent from the map; authorFrom fills them in.
 */
export async function loadAuthors(
  supabase: SupabaseClient,
  ids: (string | null | undefined)[]
): Promise<Map<string, Author>> {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[]));
  const byId = new Map<string, Author>();
  if (unique.length === 0) return byId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("public_profiles")
    .select("id, username, display_name, avatar_url, is_verified_scholar")
    .in("id", unique);

  for (const row of (data ?? []) as {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_verified_scholar: boolean | null;
  }[]) {
    byId.set(row.id, {
      id: row.id,
      username: row.username ?? UNKNOWN.username,
      full_name: row.display_name ?? UNKNOWN.full_name,
      avatar_url: row.avatar_url ?? undefined,
      is_verified_scholar: row.is_verified_scholar ?? false,
    });
  }
  return byId;
}

/**
 * The author for one id, never null. A missing entry means blocked, deleted,
 * or otherwise not visible — which is a thing to render, not a thing to throw
 * over.
 */
export function authorFrom(byId: Map<string, Author>, id: string): Author {
  return byId.get(id) ?? { id, ...UNKNOWN };
}
