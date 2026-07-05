# Phase 1 — Security core: data model + RLS

The companions-only privacy model, enforced in the database. Shipped 2026-07-05
in `supabase/migrations/20260705000017_companionship_privacy_core.sql`; applied
to local, staging (`bvnulwpsetdivlyspcqd`) and production (`wklgjqasbzwzoldgoyoh`).

## What the database now enforces

- **`companionships`** — mutual request/accept (`pending → accepted/declined`,
  transitions enforced by trigger; requests can't be created pre-accepted; one
  row per user pair in either direction). Only participants see their rows;
  only the addressee can respond.
- **`blocks`** — one-directional, private to the blocker. Blocking hides *all*
  of the blocker's posts from the blocked user (both directions) and prevents
  new companionship requests.
- **`posts.visibility`** — `public | companions | halaqa | private` (default
  `companions`). Reads governed entirely by RLS: author always sees own rows;
  others need matching visibility + companionship / halaqa membership and no
  block. `halaqa` visibility requires `posts.halaqa_id`.
- **Soft delete** — `posts.deleted_at`; there is no DELETE policy, so hard
  deletes are impossible even for the author. Deleted posts vanish for
  everyone except the author (who can undelete).
- **`profiles`** — full rows restricted to self + companions. Strangers use the
  **`public_profiles`** view (id, username, display_name, avatar_url) to find
  people to send requests to.
- Helper functions `are_companions`, `is_blocked`, `is_halaqa_member` —
  SECURITY DEFINER, boolean-only.

## Deviations from the spec (all deliberate)

1. **Adapted to the existing schema**: posts uses `content` (spec said `body`);
   profiles uses `full_name` (aliased to `display_name` in the card view);
   the legacy `is_deleted` flag is honored alongside `deleted_at`.
2. **Author always sees own posts, even soft-deleted** — the spec's literal
   policy (`deleted_at IS NULL` for everyone) makes the soft-delete UPDATE
   itself fail: Postgres rejects an update whose result the author could no
   longer read (caught by the test suite).
3. **service_role grants restored** — the initial schema granted
   `authenticated`/`anon` but never `service_role`, so the server-side service
   key had no DML on several tables (halaqas included) in production. Fixed
   with grants + default privileges.
4. **Pair uniqueness** — a unique index on `(least, greatest)` of the pair
   prevents duplicate reverse-direction requests. A declined row must be
   deleted (either side can) before a new request between the same pair.

## Tests

`tests/rls/companionship.rls.test.ts` — all six acceptance criteria, each also
exercised through raw PostgREST calls (criterion 6), plus halaqa visibility,
state-machine, soft-delete, and card-view assertions. 29 RLS tests total green
(`npm run test:rls`); runs in CI on every push.

## App-code follow-ups (later phases)

The frontend still reads `posts`/`profiles` as if they were world-readable.
Under the new policies feeds/search/profile pages simply show less (own +
public + companions) rather than erroring. To wire up:

- Feed/search/profile pages: read strangers' identities via `public_profiles`.
- Composer: offer `companions | halaqa | private` (spec: hold back `public`
  for Al-Minbar; Al-Hikmah gets public content in Phase 4).
- Companion request/accept/block UI backed by `companionships`/`blocks`.
- Post deletion UI: set `deleted_at` (hard `DELETE` now affects 0 rows).
