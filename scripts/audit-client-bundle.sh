#!/usr/bin/env bash
# Secret audit: assert no Supabase service_role credential leaks into the
# client bundle. Run after `next build`. Exits non-zero on any hit.
#
# Checks .next/static (the only code shipped to browsers) for:
#   1. plaintext "service_role" / SERVICE_ROLE_KEY strings
#   2. new-format secret API keys (sb_secret_...)
#   3. base64 of "service_role" at all three bit offsets (catches the JWT
#      payload of a legacy service key even though the key itself is base64)
set -euo pipefail

BUNDLE_DIR="${1:-.next/static}"

if [ ! -d "$BUNDLE_DIR" ]; then
  echo "ERROR: $BUNDLE_DIR not found — run 'npm run build' first." >&2
  exit 2
fi

PATTERNS=(
  "service_role"
  "SERVICE_ROLE_KEY"
  "sb_secret_"
  # base64("service_role") at offsets 0/1/2
  "c2VydmljZV9yb2xl"
  "NlcnZpY2Vfcm9sZ"
  "zZXJ2aWNlX3JvbG"
)

FAILED=0
for pattern in "${PATTERNS[@]}"; do
  if hits=$(grep -rl "$pattern" "$BUNDLE_DIR" 2>/dev/null); then
    echo "LEAK: pattern '$pattern' found in client bundle:" >&2
    echo "$hits" >&2
    FAILED=1
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo "Secret audit FAILED — service_role material in client bundle." >&2
  exit 1
fi

echo "Secret audit passed: no service_role material in $BUNDLE_DIR."
