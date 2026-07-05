# Phase 2.5 — The design language

Sakina: a quiet courtyard after the noisy street. Night — a dark,
illuminated-manuscript canvas — is the default theme and the identity.
Every component in Phases 3–8 inherits from the tokens and rules here.

## Where things live

| Concern | Location |
| --- | --- |
| Tokens (both themes, night default) | `src/styles/tokens.css` |
| Theme config (semantic tokens only) | `tailwind.config.ts` |
| Fonts (self-hosted, subsetted via next/font) | `src/app/fonts.ts` |
| Motif engine (loader, divider, pattern, empty state, moment) | `src/components/ui/girih.tsx` |
| Qur'anic text (the only permitted renderer) | `src/components/ui/QuranText.tsx` |
| Living reference page | `/style` (`src/app/style/`) |
| Adab check (runs in CI) | `scripts/adab-check.sh` |
| Contrast check (runs in CI) | `scripts/contrast-check.mjs` |

## The decisions

- **Color**: lapis (#3E6DB5) is primary; gold leaf (#C9A24B) is
  `--accent-rare` — illumination for rare meaningful marks, never a button
  color. Night surfaces are lapis-black (#0B0F1A), never pure black; Day is
  warm ivory anchored to ink + lapis, never terracotta. Feedback colors are
  muted, never neon. The old teal/amber ramps were replaced *in place* in
  `tailwind.config.ts`, so every existing `primary-*`/`secondary-*` class
  inherits the identity with no rewrites.
- **Type**: Fraunces (display) / Newsreader (reading) / Hanken Grotesk (UI);
  Reem Kufi (Arabic display) / Amiri (Arabic reading) / Noto Naskh (Arabic
  UI); **Amiri Quran for Qur'anic text, mandatory**. Arabic has its own
  scale (`--arabic-scale: 1.18`) and leading, is never letter-spaced, never
  fake-bolded (`font-synthesis: none`). Only Hanken Grotesk and Amiri
  preload.
- **Motion**: `--ease-sakina` cubic-bezier(0.22,1,0.36,1); 180/280/420ms and
  700ms for arrival only. The old overshoot curve is retired (the `barakah`
  easing name now maps to sakina). No bounce, no confetti, no loops for
  attention. `prefers-reduced-motion` collapses everything to instant — and
  the girih loader's static state is the *completed* knot, so reduced motion
  shows geometry, not a blank.
- **Geometry**: the {10/3} decagram knot is the loader and moment mark; a
  tileable khatam lattice is ambient texture (≤4% opacity, always behind
  content). There is no spinner anywhere (`Spinner` now renders
  `GirihLoader`; `app/loading.tsx` too).
- **Theming**: night on `:root` (default), day via `data-theme="day"` on
  `<html>`, driven by the `bk-theme` cookie. PWA `theme-color` is night-900.
- **RTL**: `bk-locale=ar` cookie flips `lang`/`dir` at the root; per-script
  fonts switch via `lang`; `.flip-rtl` mirrors direction-implying icons; new
  components use logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`).
  The /style page renders mirrored under RTL. (Legacy screens migrate to
  logical properties as later phases rebuild them on these primitives.)

## Adab (law, enforced in CI)

`scripts/adab-check.sh` greps the codebase on every push:
1. No sacred text (including ﷺ/ﷻ) in CSS, SVG, Tailwind config, or public/
   assets — texture is girih, never scripture.
2. Qur'anic text renders only through `QuranText` (Uthmanic face, complete,
   static, attributed) or explicitly allowlisted content surfaces.
3. No file combines Qur'anic text with animation primitives.

Honorifics in prose content (a hadith quote, a description mentioning the
Prophet ﷺ) are proper and allowed; the hard gate is on Qur'anic text and on
anything sacred used decoratively.

## Definition-of-done status

- tokens.css, both themes, night default, semantic layer — done
- Tailwind references semantic tokens only — done
- Fonts self-hosted/subsetted/preloaded, per-script scale, Uthmanic face — done
- Girih motif set + girih-draw loader, no spinner anywhere — done
- Primitives (button incl. quiet/ghost, input, card, avatar, modal,
  bottom-sheet, toast, badge, skeleton, empty-state, focus-glow) — done
  (all consume semantic tokens; no vanity-metric primitives exist)
- RTL scaffolding + `ar` rendering mirrored on /style — done
- prefers-reduced-motion honoured (global + loader-complete state) — done
- AA contrast verified on both themes (scripts/contrast-check.mjs) — done
- Adab check green over the codebase, in CI — done
- /style living reference — done

## Deferred showpieces (hooks exist, no refactor needed later)

Bespoke animated splash (slot: `app/loading.tsx` + a future `Splash`),
hero illumination art, per-section calligraphic mastheads, richer arrival
sequences (`--dur-arrival` + `LeafMoment`/`IlluminatedDivider` variants).
