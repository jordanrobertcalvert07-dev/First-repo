/**
 * Theme engine. Turns "a moment + a place" into a fully-resolved set of colors by
 * interpolating the sky keyframes in OKLab, then deriving legible text from the
 * surface. This is the heart of "the app breathes with the sun."
 */

import { mix, luminance, smoothstep, type Hex } from './color.js';
import { skyPalettes, ink, type SkyPalette, type SkyStop } from './tokens.js';
import { getSunMoment, type Coords, type SunMoment, type SunPhase } from './sun.js';

export interface ThemeColors {
  skyTop: Hex;
  skyBottom: Hex;
  surface: Hex;
  surfaceAlt: Hex;
  primary: Hex;
  accent: Hex;
  sun: Hex;
  border: Hex;
  /** Derived from surface luminance so contrast never collapses at twilight. */
  text: Hex;
  textDim: Hex;
  onPrimary: Hex;
  glow: number;
  phase: SunPhase;
  isDay: boolean;
}

type Anchor = readonly [altitudeDeg: number, stop: SkyStop];

// Rising side (pre-dawn → morning → midday) keyed by sun altitude.
const RISING: readonly Anchor[] = [
  [-18, 'nightDeep'], [-12, 'astro'], [-5, 'blueDawn'], [0, 'sunrise'],
  [4, 'goldenM'], [11, 'morning'], [35, 'day'],
];
// Setting side (midday → dusk → night).
const SETTING: readonly Anchor[] = [
  [-18, 'nightDeep'], [-12, 'night'], [-5, 'blueDusk'], [0, 'sunset'],
  [4, 'goldenE'], [11, 'afternoon'], [35, 'day'],
];

function lerpPalette(a: SkyPalette, b: SkyPalette, t: number): SkyPalette {
  return {
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyBottom: mix(a.skyBottom, b.skyBottom, t),
    surface: mix(a.surface, b.surface, t),
    surfaceAlt: mix(a.surfaceAlt, b.surfaceAlt, t),
    primary: mix(a.primary, b.primary, t),
    accent: mix(a.accent, b.accent, t),
    sun: mix(a.sun, b.sun, t),
    border: mix(a.border, b.border, t),
    glow: a.glow + (b.glow - a.glow) * t,
  };
}

function samplePalette(altitudeDeg: number, isRising: boolean): SkyPalette {
  const anchors = isRising ? RISING : SETTING;
  const alt = Math.max(anchors[0]![0], Math.min(anchors[anchors.length - 1]![0], altitudeDeg));
  for (let i = 0; i < anchors.length - 1; i++) {
    const lo = anchors[i]!;
    const hi = anchors[i + 1]!;
    if (alt >= lo[0] && alt <= hi[0]) {
      const span = hi[0] - lo[0] || 1;
      return lerpPalette(skyPalettes[lo[1]], skyPalettes[hi[1]], (alt - lo[0]) / span);
    }
  }
  return skyPalettes[anchors[anchors.length - 1]![1]];
}

/** Pick warm light or dark ink for a surface, blended across a narrow band. */
export function deriveText(surface: Hex): { text: Hex; dim: Hex } {
  const m = smoothstep(0.34, 0.55, luminance(surface));
  return { text: mix(ink.light, ink.dark, m), dim: mix(ink.lightDim, ink.darkDim, m) };
}

export const onPrimaryFor = (primary: Hex): Hex =>
  luminance(primary) > 0.55 ? ink.onPrimaryDark : ink.onPrimaryLight;

export interface ComputeThemeOptions {
  /** "Lock to night" — force the calm night theme regardless of the real sun. */
  lockNight?: boolean;
}

/** Resolve the full theme for a moment + place. Safe to call every frame. */
export function computeTheme(
  date: Date,
  coords: Coords,
  opts: ComputeThemeOptions = {},
): ThemeColors {
  const moment: SunMoment = opts.lockNight
    ? { altitudeDeg: -16, isDay: false, isRising: false, phase: 'night' }
    : getSunMoment(date, coords);

  const p = samplePalette(moment.altitudeDeg, moment.isRising);
  const { text, dim } = deriveText(p.surface);
  return {
    skyTop: p.skyTop,
    skyBottom: p.skyBottom,
    surface: p.surface,
    surfaceAlt: p.surfaceAlt,
    primary: p.primary,
    accent: p.accent,
    sun: p.sun,
    border: p.border,
    text,
    textDim: dim,
    onPrimary: onPrimaryFor(p.primary),
    glow: p.glow,
    phase: moment.phase,
    isDay: moment.isDay,
  };
}
