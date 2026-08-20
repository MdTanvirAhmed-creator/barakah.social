# Phase 6 — what you need to set up

Everything in Phase 6 is **built and merged already**. Each piece is dormant
until its credentials exist, and activates the moment you add them. Nothing
below requires a code change from you, and nothing breaks if you do these out
of order or leave one for later.

Work through them in whatever order suits. Each section says what to create,
where to paste it, and how to check it worked.

---

## 1. Turnstile — bot protection on signup

**Why:** without it, creating throwaway accounts is free. That matters much
more once the minbar opens to public posts.

**What to do**

1. Sign in at <https://dash.cloudflare.com> → **Turnstile** → **Add site**.
2. Name it `barakah.social`. Under **Domains** add `barakah.social` and
   `www.barakah.social`. For local testing you may also add `localhost`.
3. Widget mode: **Managed**.
4. You now have two values — a **Site Key** (public) and a **Secret Key**
   (private, never commit it).

**Where the keys go**

| Value | Goes to | As |
|---|---|---|
| Site Key | Vercel → Project → Settings → Environment Variables (Production **and** Preview) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Secret Key | Tell me, or set it yourself in Supabase | see below |

The secret is set on the Supabase project, not in the app. Either send it to
me and I will set it via the Management API, or do it yourself:
Supabase → Project → **Authentication** → **Attack Protection** → enable
CAPTCHA, provider **Turnstile**, paste the secret.

> Note: the provider is currently set to `hcaptcha` with no secret. It must be
> switched to `turnstile` or the token will be rejected.

**How to check:** redeploy, open `/signup`, complete to the last step. The
widget appears and **Create Account** stays disabled until it passes. With no
site key set, signup behaves exactly as it does today.

---

## 2. Resend — real email, and the daily digest

**Why two things at once:** your project has **no SMTP configured**, which
means Supabase's built-in mailer is capped at **2 emails per hour**. Signup
confirmations will silently fail the moment more than a couple of people join.
This is the most urgent item on the page.

**What to do**

1. Create an account at <https://resend.com>.
2. **Domains** → **Add domain** → `barakah.social`. Resend gives you DNS
   records (SPF, DKIM, and usually a return-path CNAME).
3. Add those records wherever `barakah.social` DNS lives, then press
   **Verify**. This can take a few minutes to propagate.
4. **API Keys** → **Create** → give it send permission. Copy it once.

**Where things go**

*a. Supabase SMTP* — Supabase → Project → **Authentication** → **SMTP
Settings** → enable custom SMTP:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |
| Sender email | `salam@barakah.social` (any address at the verified domain) |
| Sender name | `Barakah.social` |

*b. GitHub secrets* for the digest — repo → Settings → Secrets and variables
→ Actions → **New repository secret**:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | `https://wklgjqasbzwzoldgoyoh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key |
| `RESEND_API_KEY` | the key from step 4 |
| `DIGEST_FROM` | `Barakah.social <salam@barakah.social>` |
| `APP_URL` | `https://www.barakah.social` |

> The service-role key bypasses every RLS policy. It belongs only in GitHub
> Secrets and Supabase — never in the app, never in a `NEXT_PUBLIC_` variable.

**How to check:** repo → Actions → **Daily digest email** → **Run workflow**
with *dry run* left ticked. It prints who would be emailed and what they would
receive, without sending. Untick it to send for real. It runs itself at 06:00
UTC daily thereafter, emails nobody when nothing is unread, and skips anyone
who has switched the digest off in Settings.

---

## 3. Backups — a copy you own

**Why:** Supabase's point-in-time recovery is a paid feature, and a backup
that lives only inside the thing it protects is not a backup.

**What to do**

1. Cloudflare dashboard → **R2** → **Create bucket** → `barakah-backups`.
   (R2 has a free tier and no egress fees. Backblaze B2 works identically —
   it is S3-compatible; just use its endpoint.)
2. R2 → **Manage API Tokens** → **Create API token** → **Object Read & Write**
   scoped to that bucket. You get an **Access Key ID** and a **Secret Access
   Key**.
3. Note your **Account ID** from the R2 page.
4. Get your database connection string: Supabase → Project → Settings →
   **Database** → Connection string → URI. It looks like
   `postgresql://postgres:PASSWORD@db.wklgjqasbzwzoldgoyoh.supabase.co:5432/postgres`.
   If you do not know the password, reset it on that page.
5. Invent a long random **backup passphrase** and store it somewhere you will
   still have if the laptop dies — a password manager, not a note file.

**Where they go** — repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `SUPABASE_DB_URL` | the connection URI from step 4 |
| `BACKUP_PASSPHRASE` | your long random string |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | from step 2 |
| `R2_SECRET_ACCESS_KEY` | from step 2 |
| `R2_BUCKET` | `barakah-backups` |

> **The passphrase is the whole point.** The archive is encrypted with
> AES-256 before it leaves the runner, so whoever holds the bucket cannot read
> it — and neither can you, without that passphrase. Losing it means losing
> the backups.

**How to check:** Actions → **Encrypted database backup** → **Run workflow**.
It should dump, encrypt, upload, and prune anything older than 30 days. Then
runs nightly at 03:17 UTC.

**Practise the restore once.** A backup nobody has restored is a hope, not a
backup:

```bash
gpg --decrypt --output restored.dump barakah-<stamp>.dump.gpg
pg_restore --no-owner --no-privileges -d "<a scratch database url>" restored.dump
```

---

## 4. Supabase Pro — when you publicize, not before

$25/month. Buys two things that matter at launch: the project stops
auto-pausing after a week idle, and you get point-in-time recovery on top of
the backups above. There is no rush while the site is unannounced.

---

## 5. Still outstanding from Phase 0

These have been on the list a while and are quick:

- **Vercel → Preview environment variables**: `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing at the **staging** project
  (`bvnulwpsetdivlyspcqd`), so preview deploys stop reading production.
- **Sentry**: create the project, then set `NEXT_PUBLIC_SENTRY_DSN` (plus
  `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) in Vercel.
- **UptimeRobot**: a free monitor on `https://www.barakah.social/api/health`,
  alerting on anything other than 200.

---

## Suggested order

1. **Resend** — the 2-emails-per-hour cap is a live problem, not a future one.
2. **Backups** — cheapest insurance available, and you should practise one restore.
3. **Turnstile** — before the minbar opens to the public, not necessarily today.
4. **Vercel / Sentry / UptimeRobot** — quick, and long overdue.
5. **Supabase Pro** — on the day you announce.

Tell me once any of these exist and I will verify them end to end rather than
assuming they took.
