/**
 * Perceptual color math for the sun-driven theme.
 *
 * Colors are interpolated in OKLab so transitions through dawn/dusk look smooth
 * and don't pass through muddy mid-greys. Everything here is pure and allocation-light
 * so it can run every animation frame on a phone.
 */

export type Hex = string;
type RGB = readonly [number, number, number];
type Lab = readonly [number, number, number];

const clamp = (v: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));

export function hexToRgb(hex: Hex): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): Hex {
  const c = (v: number) => ('0' + Math.round(clamp(v)).toString(16)).slice(-2);
  return '#' + c(r) + c(g) + c(b);
}

const srgbToLinear = (c: number): number => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
};
const linearToSrgb = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return v * 255;
};

function rgbToOklab([r, g, b]: RGB): Lab {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const labCache = new Map<Hex, Lab>();
function toLab(hex: Hex): Lab {
  let v = labCache.get(hex);
  if (!v) {
    v = rgbToOklab(hexToRgb(hex));
    labCache.set(hex, v);
  }
  return v;
}

/** Interpolate two hex colors in OKLab. `t` in [0,1]. */
export function mix(a: Hex, b: Hex, t: number): Hex {
  const [al, aa, ab] = toLab(a);
  const [bl, ba, bb] = toLab(b);
  return rgbToHex(
    ...oklabToRgb([al + (bl - al) * t, aa + (ba - aa) * t, ab + (bb - ab) * t]),
  );
}

/** WCAG relative luminance in [0,1]. Used to pick legible text over any surface. */
export function luminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
