# Phase 2 — Companions flow (UI + mutations)

The human workflow on top of Phase 1's schema. Shipped 2026-07-05.

## What was built

- **`/companions`** (dedicated tab, in sidebar + mobile nav): four sections —
  Companions (remove / block), Requests (incoming accept/decline, outgoing
  cancel), Find (search `public_profiles`, send request, accept from results),
  Blocked (unblock).
- **`src/hooks/useCompanions.ts`** — all queries and mutations on the browser
  client (anon key + user session). RLS is the enforcement layer; there is no
  service_role anywhere on the client path.
- **Migration `20260705000018_companions_flow.sql`**:
  - *Rate limit*: max 10 companionship requests/hour/user, enforced by a
    SECURITY DEFINER trigger writing a private counter table
    (`companionship_request_events`, no client grants) — deleting and
    re-sending requests cannot reset it. service_role and direct DB
    connections are exempt.
  - *Discovery hiding*: `public_profiles` now excludes anyone in a block
    relationship with the viewer, in both directions. All search/discovery
    built on the card view inherits this.
  - *`my_blocked_cards()`*: definer function so the blocker can still render
    their own block list (which the view now hides from them).
- Blocking from the UI also deletes any companionship between the pair.

## Old surfaces

`/tools/companions` (the mock-data "Companion Finder" backed by the legacy
`companion_connections` matching system) still exists; the mobile nav
Companions tab now goes to `/companions`. The legacy matching system is
untouched and can be rewired or retired in a later phase.

## Acceptance criteria → tests

1. **Full request→accept→appears-in-feed loop, two real accounts, real UI**:
   `e2e/companions-flow.spec.ts` (Playwright, two browser contexts; local
   stack only — run with `E2E_LOCAL_SUPABASE=1`, see file header). Also covered
   at the API level in `tests/rls/companionship.rls.test.ts`.
2. **Blocked user cannot re-send requests & disappears from surfaces**: same
   E2E (search returns nothing for either side; direct REST insert → 403) +
   `tests/rls/companions-flow.rls.test.ts` (view hiding both directions,
   un-involved users unaffected, unblock restores).
3. **All mutations rely on RLS**: the hook uses only the anon-key browser
   client; the E2E's final step re-sends the request with the raw session
   token against PostgREST and asserts 401/403.

Rate limiting is asserted in `tests/rls/companions-flow.rls.test.ts`: the 11th
request inside an hour fails, the counter table is unreadable/unresettable by
clients.

## Dev-loop note

`npm run dev:local` runs the app against the local Supabase stack and proxies
it via `/sb-local` on port 3000 (`LOCAL_SUPABASE_PROXY=1` rewrite in
next.config.mjs) so sandboxed preview browsers that can only reach port 3000
can still authenticate.
