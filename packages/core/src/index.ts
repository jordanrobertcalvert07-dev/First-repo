/** @lifelike/core — the UI-agnostic brain shared by every platform. */

export * from './color.js';
export * from './tokens.js';
export * from './sun.js';
export * from './theme.js';
export * from './schema.js';
export * from './capture.js';

/** Default location used until the device provides one (auto-derived thereafter). */
export const DEFAULT_COORDS = { lat: 40.0, lon: -75.0 } as const;
