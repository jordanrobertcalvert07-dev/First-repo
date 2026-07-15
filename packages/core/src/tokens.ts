/**
 * Design tokens — the shared vocabulary for every platform.
 *
 * These are plain data. The phone (React Native StyleSheet) and the web
 * (react-native-web / CSS variables) both consume them, so the "one design system,
 * two shapes" promise lives here.
 */

import type { Hex } from './color.js';

/* ----------------------------------------------------------------------------
 * Typography — Fraunces (display) + IBM Plex Sans (body/data), both SIL OFL.
 * React Native needs one family name per static weight; the web gets a fallback
 * stack. Bundle the .ttf files under apps/mobile/assets/fonts and register them
 * with the family names below.
 * ------------------------------------------------------------------------- */
export const font = {
  families: {
    displayRegular: 'Fraunces-Regular',
    displayMedium: 'Fraunces-Medium',
    displaySemiBold: 'Fraunces-SemiBold',
    displayBold: 'Fraunces-Bold',
    bodyRegular: 'IBMPlexSans-Regular',
    bodyMedium: 'IBMPlexSans-Medium',
    bodySemiBold: 'IBMPlexSans-SemiBold',
    mono: 'IBMPlexMono-Regular',
  },
  /** CSS fallback stacks for the web build (before/if the webfont loads). */
  web: {
    display: "'Fraunces', Georgia, 'Times New Roman', serif",
    body: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
  },
} as const;

/** A deliberate type scale (px) with matching line heights. Stay on the scale. */
export const typeScale = {
  display: { size: 40, line: 44, family: font.families.displaySemiBold, tracking: -0.5 },
  h1: { size: 28, line: 34, family: font.families.displaySemiBold, tracking: -0.3 },
  h2: { size: 22, line: 28, family: font.families.displayMedium, tracking: -0.2 },
  h3: { size: 18, line: 24, family: font.families.displayMedium, tracking: 0 },
  bodyLg: { size: 16, line: 24, family: font.families.bodyRegular, tracking: 0 },
  body: { size: 15, line: 22, family: font.families.bodyRegular, tracking: 0 },
  label: { size: 13, line: 18, family: font.families.bodyMedium, tracking: 0.2 },
  caption: { size: 12, line: 16, family: font.families.bodyRegular, tracking: 0.2 },
  eyebrow: { size: 11, line: 14, family: font.families.bodySemiBold, tracking: 1.6 },
  mono: { size: 12, line: 16, family: font.families.mono, tracking: 0 },
} as const;
export type TypeToken = keyof typeof typeScale;

/** 4px base spacing scale. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { xs: 10, sm: 14, md: 20, lg: 26, pill: 999 } as const;

/** Motion — soft and purposeful. Durations in ms. */
export const motion = {
  themeTweenMs: 700,
  fast: 160,
  base: 240,
  slow: 420,
  /** cubic-bezier easings (also usable as RN Easing.bezier args). */
  easeOut: [0.2, 0.9, 0.25, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
};

/* ----------------------------------------------------------------------------
 * Sky palettes — the keyframes the theme interpolates between across the day.
 * Text/onPrimary are NOT stored here; they are derived from surface luminance at
 * runtime (see theme.ts) so contrast never collapses through the twilight crossover.
 * ------------------------------------------------------------------------- */
export interface SkyPalette {
  skyTop: Hex;
  skyBottom: Hex;
  surface: Hex;
  surfaceAlt: Hex;
  primary: Hex;
  accent: Hex;
  sun: Hex;
  border: Hex;
  glow: number;
}

export type SkyStop =
  | 'nightDeep' | 'night' | 'astro' | 'blueDawn' | 'sunrise' | 'goldenM'
  | 'morning' | 'day' | 'afternoon' | 'goldenE' | 'sunset' | 'blueDusk';

export const skyPalettes: Record<SkyStop, SkyPalette> = {
  nightDeep: { skyTop: '#05060a', skyBottom: '#0d0b13', surface: '#131017', surfaceAlt: '#1c1826', primary: '#d98a5e', accent: '#4f96a4', sun: '#c8cfe2', border: '#241f2c', glow: 0.42 },
  night: { skyTop: '#070810', skyBottom: '#130f19', surface: '#16131d', surfaceAlt: '#211c2a', primary: '#dd8d60', accent: '#549cab', sun: '#c7cee0', border: '#2a2434', glow: 0.5 },
  astro: { skyTop: '#0b1030', skyBottom: '#271b46', surface: '#1b1830', surfaceAlt: '#261f3e', primary: '#e5875f', accent: '#5aa6bd', sun: '#a0b1e2', border: '#332b4b', glow: 0.7 },
  blueDawn: { skyTop: '#232350', skyBottom: '#5c3b66', surface: '#262038', surfaceAlt: '#332a49', primary: '#ff8a5c', accent: '#62b4cb', sun: '#ffb487', border: '#3e3454', glow: 0.85 },
  sunrise: { skyTop: '#4a3568', skyBottom: '#ff8a4d', surface: '#2b2440', surfaceAlt: '#382d4c', primary: '#ff7a37', accent: '#38b8cd', sun: '#ffdca6', border: '#463b56', glow: 1 },
  goldenM: { skyTop: '#9a6f86', skyBottom: '#ffc57e', surface: '#3a3348', surfaceAlt: '#473d56', primary: '#ff8a30', accent: '#24bad0', sun: '#ffe6b2', border: '#534665', glow: 0.92 },
  morning: { skyTop: '#ffcf98', skyBottom: '#ffeccb', surface: '#fffaf3', surfaceAlt: '#fbefe0', primary: '#ff7d22', accent: '#08bcd4', sun: '#ffcf5c', border: '#f1e4d4', glow: 0.5 },
  day: { skyTop: '#ffca8c', skyBottom: '#fff3e0', surface: '#fffbf6', surfaceAlt: '#fdf1e4', primary: '#ff7717', accent: '#05bcd6', sun: '#ffc23e', border: '#f2e6d6', glow: 0.36 },
  afternoon: { skyTop: '#ffcf98', skyBottom: '#ffeccb', surface: '#fff8f0', surfaceAlt: '#fbeede', primary: '#ff7a1e', accent: '#08b9d2', sun: '#ffc74e', border: '#f0e2d1', glow: 0.5 },
  goldenE: { skyTop: '#f0a267', skyBottom: '#ffd39a', surface: '#f6e4d4', surfaceAlt: '#efd8c4', primary: '#ff6a28', accent: '#14b1c7', sun: '#ff9e3a', border: '#e6cdb6', glow: 0.85 },
  sunset: { skyTop: '#5e2c52', skyBottom: '#ff7a44', surface: '#2e2334', surfaceAlt: '#3a2c40', primary: '#ff6b3a', accent: '#2f9fb8', sun: '#ff9f5c', border: '#463749', glow: 1 },
  blueDusk: { skyTop: '#241e4a', skyBottom: '#5a3560', surface: '#201a30', surfaceAlt: '#2b2340', primary: '#f0855c', accent: '#5aa6c0', sun: '#c79fd6', border: '#362c4a', glow: 0.82 },
};

/** Warm ink constants. Text is chosen between light/dark by surface luminance. */
export const ink = {
  light: '#ece4da' as Hex,
  lightDim: '#a7a096' as Hex,
  dark: '#241a14' as Hex,
  darkDim: '#7a6c60' as Hex,
  onPrimaryLight: '#fff7ef' as Hex,
  onPrimaryDark: '#241a14' as Hex,
};

/** Semantic colors — kept separate from the accent, and never used to moralize.
 * (Substance sections stay neutral: a logged use is a data point, never "bad".) */
export const semantic = {
  positive: '#3fb98a' as Hex,
  caution: '#e0a23a' as Hex,
  info: '#4a9ec9' as Hex,
} as const;
