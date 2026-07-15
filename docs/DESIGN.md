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

1. **Location** → real local **sunrise / sunset** (and by extension solar noon, day
   length, golden/blue-hour bands). `suncalc` in the app; the preview ships a compact
   solar calc driven by a latitude control (fixed date). Location is read from the device
   or set manually.
2. **Current sun altitude** is computed from clock time relative to the sun events.
3. The palette is a **timeline of keyframe palettes** anchored to solar events
   (deep night → astronomical/nautical dawn → blue hour → sunrise → golden morning →
   day → golden evening → sunset → blue dusk → night). The live theme is the two nearest
   keyframes **interpolated in OKLab/OKLCH** by the current time — a continuous,
   perceptually smooth transition, never a hard cutoff.
4. **Controls:** Auto (follows real local time), Manual (scrub), and **Lock to night**
   for late nights. Manual override always wins.

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

Native, deliberately paired system faces — zero webfont-fallback risk, feels native on
the target devices:

- **Display** — `ui-rounded` (SF Pro Rounded): sun-time, greetings, headings, numbers.
  Soft, calm, warm.
- **Body / UI** — `-apple-system` / `SF Pro Text`.
- **Data / time** — `ui-monospace` (SF Mono) with `tabular-nums` for timestamps and
  aligned figures.

Type scale is fixed and adhered to; generous line height; headings use
`text-wrap: balance`; uppercase labels carry letter-spacing. (The shipped RN app may
adopt a chosen variable font; the system stack is the preview baseline.)

## Motion

Soft and purposeful. Theme changes from discrete events (mode toggle, "now" ticks) are
**tweened** (~700ms, eased); scrubbing is direct. The sun/moon arcs across the header;
stars fade in as the glow token rises. **`prefers-reduced-motion` is respected** — no
tweening, no ambient animation, theme set instantly.

## The two shapes

**Phone shell.** Sky header (greeting + arcing sun + phase), single-column cards, a
bottom tab bar, and a **floating capture bar** docked above the tabs.

**Web shell.** Left **sidebar** nav (with Medical & Substances shown **locked /
phone-only**), a top **command bar** that doubles as capture and global search (`⌘K`),
and a **multi-column** Today (main grid + sticky rail with streaks, stats, and the
phone-only notice).

## AI capture → review → commit

A persistent capture surface everywhere. Utterance → parsed proposals → a **review
sheet** listing each target section as a card, every field **editable** and
**removable**, whole cards droppable. **Nothing is written until confirmed.** Substances
are framed **neutrally** — a logged use is a data point: no red, no warning iconography,
no disapproval.

## Accessibility

Dynamic type, screen-reader labels, visible keyboard focus, sufficient contrast in both
theme extremes (guaranteed by the derived-text rule), and reduced-motion support are
first-class, not afterthoughts.
