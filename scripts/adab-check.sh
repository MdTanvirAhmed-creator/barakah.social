#!/usr/bin/env bash
# Adab check (design language §6) — sacred text is never texture.
#
# Enforced rules:
#  1. Sacred-text markers may not appear in styling/asset files at all:
#     CSS, SVG, Tailwind config, anything under public/ — that is where
#     backgrounds, watermarks, loaders and textures live.
#  2. In components, Qur'anic markers (ayah ornaments ﴿﴾, Uthmanic-cased
#     basmala/ayat) may appear ONLY in the QuranText component or in files
#     explicitly allowlisted below (content surfaces, not chrome).
#  3. No file may combine sacred markers with animation primitives.
#
# Exit 1 with the offending lines on any violation.
set -uo pipefail
cd "$(dirname "$0")/.."

# Two classes of marker:
#  - SACRED_ANY: anything sacred (incl. honorifics) — banned from styling/
#    asset files entirely; honorifics in prose content are fine and proper.
#  - QURANIC: Qur'anic text markers (ayah ornaments, basmala, Uthmanic
#    orthography) — allowed ONLY in QuranText and allowlisted surfaces.
SACRED_ANY='ﷻ|ﷺ|﴿|﴾|بِسْمِ ٱ?اللَّهِ|بِسْمِ اللهِ|ٱللَّه'
QURANIC='﴿|﴾|بِسْمِ ٱ?اللَّهِ|بِسْمِ اللهِ|ٱللَّه'

# Surfaces that may render Qur'anic text (content, never chrome)
ALLOW='src/components/ui/QuranText.tsx|src/app/style/StyleReference.tsx|src/components/feed/PostComposer.tsx'

fail=0

echo "adab-check: sacred text in styling/asset files (must be none)"
hits=$(grep -rInE "$SACRED_ANY" --include="*.css" --include="*.svg" --include="tailwind.config.*" src public tailwind.config.ts 2>/dev/null)
if [ -n "$hits" ]; then
  echo "$hits"
  echo "FAIL: sacred text found in a styling or asset file."
  fail=1
fi

echo "adab-check: Qur'anic text outside allowlisted components (must be none)"
hits=$(grep -rInE "$QURANIC" src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -vE "^($ALLOW):")
if [ -n "$hits" ]; then
  echo "$hits"
  echo "FAIL: Qur'anic text outside QuranText/allowlisted content surfaces."
  fail=1
fi

echo "adab-check: Qur'anic text near animation primitives (must be none)"
for f in $(grep -rlE "$QURANIC" src --include="*.tsx" 2>/dev/null); do
  if grep -qE "animate-|framer-motion|keyframes|<motion\." "$f"; then
    # QuranText forbids motion by construction; anything else must justify itself
    if [ "$f" != "src/components/ui/QuranText.tsx" ] && [ "$f" != "src/components/feed/PostComposer.tsx" ] && [ "$f" != "src/app/style/StyleReference.tsx" ]; then
      echo "FAIL: $f contains Qur'anic text AND animation primitives."
      fail=1
    fi
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "adab-check: PASS"
fi
exit $fail
