# Phase 0 — Foundations & Safety Rails

Status of the launch-blocking foundations work. Done means implemented in this
repo; **Action needed** means it requires an account/credential only you have.

> **Update 2026-07-05 (second pass):** Docker (OrbStack) installed; local stack
> runs; `supabase db reset` rebuilds all 16 migrations; all 7 RLS tests pass
> locally; CLI logged in and linked; production migration history repaired
> (16 versions marked applied); schema drift reconciled — prod and migrations
> are byte-identical across tables/columns/views/policies/functions/triggers
> (`20260705000016_reconcile_prod_drift.sql`); staging project
> `barakah-staging` (`bvnulwpsetdivlyspcqd`, eu-west-2, free tier) created with
> the full migration chain pushed. Its DB password is in `.env.staging.local`
> (gitignored) — **move it to your password manager.** Three migration bugs
> were fixed along the way (see git log). Remaining user steps: Vercel Preview
> env vars, Sentry DSN, uptime monitor — see sections 2 and 4.

## 1. Supabase CLI & migrations — DONE (reconciliation pending)

- `supabase init` has been run: [supabase/config.toml](supabase/config.toml) is the
  local-stack config (Postgres 17, email auto-confirm locally).
- All 15 real migrations were renamed into CLI timestamp format under
  [supabase/migrations/](supabase/migrations/) (git history preserved). Numeric
  order was kept; the duplicate `002_*` pair was sequenced storage-first.
- Non-migrations (`000_CLEANUP_ALL.sql`, `MASTER_MIGRATION_SCRIPT.sql`) moved to
  [supabase/archive/](supabase/archive/) — they must never run as migrations.
- **All future schema changes go in `supabase/migrations/` via
  `supabase migration new <name>`. No more ad-hoc SQL in the dashboard.**

**Link and reconciliation — DONE (2026-07-05).** CLI is logged in and linked to
`wklgjqasbzwzoldgoyoh`. Production's migration history table was created and
all 16 versions marked applied. A schema comparison (tables, columns, views,
RLS policies, functions, triggers) found exactly one drifted object, captured
in `20260705000016_reconcile_prod_drift.sql`. Prod and the migration chain now
match exactly.

Note: this project rejects the CLI's password-less "login role" flow
(`LegacyDbConfigLoginRoleStatusError`), so `supabase db pull/diff --linked`
still needs the database password. The comparison above was done via the
Management API instead.

## 2. Local dev & preview deployments

**Local stack — DONE.** OrbStack is installed and the stack runs:

```bash
supabase start      # full local stack; applies all migrations
supabase db reset   # verified: rebuilds entire schema from migrations
npm run test:rls    # verified: all 7 assertions pass
```

**Preview/staging DB — created and migrated.** Project `barakah-staging`
(ref `bvnulwpsetdivlyspcqd`, eu-west-2, free tier) exists with all 16
migrations applied. To push future migrations to it:

```bash
supabase db push --db-url "postgresql://postgres.bvnulwpsetdivlyspcqd:<STAGING_DB_PASSWORD>@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```

**Action needed — wire it to Vercel Preview deployments.** In Vercel →
Project → Settings → Environment Variables, set for the **Preview**
environment only:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://bvnulwpsetdivlyspcqd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key from the
  [staging API settings](https://supabase.com/dashboard/project/bvnulwpsetdivlyspcqd/settings/api)

(If you later upgrade to Supabase Pro, prefer
[branching](https://supabase.com/docs/guides/deployment/branching) via the
Vercel integration for per-PR databases.)

## 3. Secret audit — DONE (clean)

- `service_role` is not referenced anywhere in `src/`, `scripts/`, or config —
  the app runs entirely on the anon key + RLS. `.env.local` contains only the
  URL, anon key, and app URL.
- [scripts/audit-client-bundle.sh](scripts/audit-client-bundle.sh) greps the
  built client bundle (`.next/static`) for `service_role` material, including
  base64-shifted variants of a legacy JWT service key and `sb_secret_` keys.
  It passed against a fresh local build and now runs in CI after every build.
- Rule going forward: the service key, if ever needed, lives only in
  `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) and is only read in
  server-only code.

## 4. Error tracking & uptime — code DONE

- `@sentry/nextjs` is wired for server, edge, and client
  ([src/instrumentation.ts](src/instrumentation.ts),
  [src/instrumentation-client.ts](src/instrumentation-client.ts),
  [sentry.server.config.ts](sentry.server.config.ts),
  [sentry.edge.config.ts](sentry.edge.config.ts),
  [src/app/global-error.tsx](src/app/global-error.tsx)). It is a **no-op until a
  DSN is set**, so local dev is unaffected.
- Health endpoint for uptime monitoring:
  [src/app/api/health/route.ts](src/app/api/health/route.ts) — returns 200 when
  the app + Supabase auth API are reachable, 503 otherwise.

**Action needed:**
1. Create a Sentry project (Next.js) and set in Vercel:
   `NEXT_PUBLIC_SENTRY_DSN` (all envs), plus `SENTRY_ORG`, `SENTRY_PROJECT`,
   `SENTRY_AUTH_TOKEN` (build-time, for source maps).
2. Point an uptime monitor (UptimeRobot free tier or Better Stack) at
   `https://<your-domain>/api/health`, alerting on non-200.

## 5. RLS test harness — DONE

- [tests/rls/helpers.ts](tests/rls/helpers.ts): creates real users via the
  admin API against the **local** stack and returns per-user signed-in
  supabase-js clients. Refuses non-local URLs unless
  `RLS_TESTS_ALLOW_REMOTE=true`.
- [tests/rls/foundations.rls.test.ts](tests/rls/foundations.rls.test.ts): user A
  reads own profile; B cannot update A's profile; B cannot read, forge, or
  delete A's bookmarks (the "private data" assertion).
- Run locally with `supabase start` + `npm run test:rls`. Kept separate from
  unit tests (own [jest.rls.config.js](jest.rls.config.js)).
- CI: the `rls-tests` job in [.github/workflows/ci.yml](.github/workflows/ci.yml)
  starts the stack, runs `supabase db reset` (schema-rebuild acceptance check),
  then the harness — on every push/PR.
- **Every later phase adds `tests/rls/<feature>.rls.test.ts` files using these
  helpers.**

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| `supabase db reset` rebuilds schema from migrations, no manual steps | **Verified locally** (16 migrations) + fresh cloud DB (staging push) + CI job |
| Bundle grep shows no service_role key client-side | Passed locally; enforced in CI on every build |
| Trivial RLS test green in CI | **All 7 assertions pass locally**; same suite runs in CI (`rls-tests` job) |
