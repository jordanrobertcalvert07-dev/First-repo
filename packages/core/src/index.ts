/** @lifelike/core — the UI-agnostic brain shared by every platform. */

export * from './color';
export * from './tokens';
export * from './sun';
export * from './theme';
export * from './schema';
export * from './capture';

/** Default location used until the device provides one (auto-derived thereafter). */
export const DEFAULT_COORDS = { lat: 40.0, lon: -75.0 } as const;
