#!/usr/bin/env bash
# Runs the Turnstile signup spec against Cloudflare's always-passes TEST keys.
#
# Opt-in rather than part of `npm run test:e2e`, because it needs the local
# Supabase stack restarted with captcha enabled — and leaving captcha on by
# default would break local signup for anyone without the site key set.
#
# Both keys below are Cloudflare's published dummy values, not credentials.
set -euo pipefail
cd "$(dirname "$0")/../.."

SITE_KEY="1x00000000000000000000AA"
TEST_SECRET="1x0000000000000000000000000000000AA"
BACKUP="$(mktemp)"
cp supabase/config.toml "$BACKUP"
restore() { cp "$BACKUP" supabase/config.toml; rm -f "$BACKUP"; }
trap restore EXIT

python3 - "$TEST_SECRET" <<'PY'
import sys
secret = sys.argv[1]
p = "supabase/config.toml"
s = open(p).read()
# The whole block is commented out in the committed config, leading "# "
# included — matching without it would splice the keys in under the
# previous section instead.
old = '# [auth.captcha]\n# enabled = true\n# provider = "hcaptcha"\n# secret = ""\n'
new = f'[auth.captcha]\nenabled = true\nprovider = "turnstile"\nsecret = "{secret}"\n'
assert old in s, "captcha block not found in config.toml"
open(p, "w").write(s.replace(old, new))
PY

supabase stop >/dev/null 2>&1 || true
supabase start -x studio,logflare,vector,imgproxy,edge-runtime,realtime,mailpit >/dev/null
docker restart "supabase_kong_$(basename "$PWD")" >/dev/null 2>&1 || true
until curl -s -o /dev/null http://127.0.0.1:54321/auth/v1/health; do sleep 2; done

# Playwright always reuses a server already on :3000, and the widget only
# renders when the site key was present when that server started — so stop
# any running one and let Playwright start a fresh server that inherits it.
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

export NEXT_PUBLIC_TURNSTILE_SITE_KEY="$SITE_KEY"
export E2E_LOCAL_SUPABASE=1
npx playwright test e2e/turnstile.spec.ts --project=chromium "$@"
