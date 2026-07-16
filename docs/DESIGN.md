# Design system

The whole app breathes with the sun. The chrome *is* the sky right now. This document
is the shared spec; `design/preview.html` is a live, dependency-free reference
implementation of everything here.

## Principle: one system, two shapes

Tokens, type scale, sun logic, and color interpolation are **shared** across phone and
web. Layout is **not**. Phone is thumb-reachable, one column, bottom nav, capture always
in reach. Web is a real sidebar, multi-column, command-bar capture, keyboard-first, wide
charts. The breakpoints are designed, not stretched.

## Sun engine

1. **Location → sunrise / sunset, automatically.** Real local sunrise/sunset (and by
   extension solar noon, day length, golden/blue-hour bands) are **auto-derived from the
   device's location** — no manual latitude entry. `suncalc` computes them exactly from
   coordinates in the app; a weather/astro source can cross-check. The preview hardcodes
   the user's current times (5:04 AM / 9:05 PM) since it has no location access.
2. **Current sun altitude** is computed from clock time relative to the sun events.
3. The palette is a **timeline of keyframe palettes** anchored to solar events
   (deep night → astronomical/nautical dawn → blue hour → sunrise → golden morning →
   day → golden evening → sunset → blue dusk → night). The live theme is the two nearest
   keyframes **interpolated in OKLab/OKLCH** by the current time — a continuous,
   perceptually smooth transition, never a hard cutoff.
4. **No manual theme switcher.** The theme simply follows the sun on the device's clock;
   there is no in-app control to change it. (The preview's "Preview the day" slider is a
   preview-only affordance, not an app feature.) The one exception is a single **Lock to
   night** comfort toggle, tucked in **Settings**, that forces the calm night theme for
   late nights (`computeTheme(..., { lockNight: true })`).

### Keyframe intent

| State | Ground | Primary | Text |
|-------|--------|---------|------|
| **Day** | warm, generous light `#fffbf6` | vivid sunrise-orange `#ff7717`, cyan accent `#05bcd6` | warm near-black |
| **Golden hour** | honey / amber, low sun | warm orange | — |
| **Blue hour** | indigo → plum | warming orange | — |
| **Night** | matte black surfaces `#16131d` | muted sunset-orange `#dd8d60` | warm off-white `#ece4da` — **never** pure white |

Full keyframe table lives in `design/preview.html` (`K = {…}`).

### Text contrast is derived, not keyed

To keep text legible through the twilight crossover (where surfaces pass through
mid-luminance), text color is **derived from the current surface's luminance** via a
smoothstep between a warm light-text and a warm dark-text constant, rather than
interpolated independently. Contrast never collapses; night text is warm and low-sting,
day text is a warm near-black. `on-primary` is derived the same way.

## Typography

Two bundled, open-licensed (SIL OFL) faces — identical on the Moto, the Windows web
app, and anywhere else, and safe to commit to a public repo:

- **Display** — **Fraunces**: greetings, the large sun-time, section titles. A warm,
  characterful "old-style" serif with a calligraphic softness — elegant without hurting
  legibility.
- **Body / data** — **IBM Plex Sans**: everything read in volume — lists, tables,
  journals — with tabular figures for aligned logs.
- **Mono** — **IBM Plex Mono** for timestamps and dense numeric tokens.

Font families are defined once in `@lifelike/core` `tokens.ts`; the app loads the static
weights via `expo-font` and the web build via `@font-face`. The type scale is fixed and
adhered to; generous line height; uppercase labels carry letter-spacing.

> **Why not Gabriola.** Gabriola is Windows-only (absent on the Moto and on the web), its
> signature flourishes depend on OpenType stylistic sets that React Native / Android
> won't reliably render, it's proprietary (can't live in a public repo), and it's a
> display face ill-suited to dense logs at 3am. Fraunces gives the same elegance while
> bundling cleanly everywhere.

## Motion

Soft and purposeful. Theme changes between minute ticks (and when Lock to night flips)
are **tweened** (~700ms, eased). The sun/moon arcs across the header;
stars fade in as the glow token rises. **`prefers-reduced-motion` is respected** — no
tweening, no ambient animation, theme set instantly.

## The two shapes

**Phone shell.** A **capture bar locked to the top** (always reachable; content scrolls
under it), the sky header below it (greeting + arcing sun + phase), single-column cards,
and a bottom tab bar for navigation.

**Web shell.** Left **sidebar** nav (with Medical & Substances shown **locked /
phone-only**), a top **command bar** that doubles as capture and global search (`⌘K`),
and a **multi-column** Today (main grid + sticky rail with streaks, stats, and the
phone-only notice).

## AI capture → review → commit

A persistent capture surface **locked to the top** on both shapes (a pinned bar on
phone, the command bar on web). Utterance → parsed proposals → a **review sheet** listing
each target section as a card, every field **editable** and **removable**, whole cards
droppable. **Nothing is written until confirmed.** Substances
are framed **neutrally** — a logged use is a data point: no red, no warning iconography,
no disapproval.

## Accessibility

Dynamic type, screen-reader labels, visible keyboard focus, sufficient contrast in both
theme extremes (guaranteed by the derived-text rule), and reduced-motion support are
first-class, not afterthoughts.
