/**
 * Sun engine. Real local sunrise/sunset/altitude from coordinates via `suncalc`,
 * plus a phase classifier. This is auto-derived from the device's location in the
 * app — there is no manual latitude control.
 */

import SunCalc from 'suncalc';

export interface Coords {
  lat: number;
  lon: number;
}

export interface SunMoment {
  /** Sun altitude in degrees (negative below the horizon). */
  altitudeDeg: number;
  /** True while the sun is above the horizon. */
  isDay: boolean;
  /** True while the sun is rising (morning side of the day). */
  isRising: boolean;
  phase: SunPhase;
}

export type SunPhase =
  | 'night'
  | 'astronomicalDawn'
  | 'blueDawn'
  | 'sunrise'
  | 'goldenMorning'
  | 'day'
  | 'goldenEvening'
  | 'sunset'
  | 'blueDusk';

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
}

export function getSunTimes(date: Date, { lat, lon }: Coords): SunTimes {
  const t = SunCalc.getTimes(date, lat, lon);
  return { sunrise: t.sunrise, sunset: t.sunset, solarNoon: t.solarNoon };
}

/** Rate of change of altitude tells us rising vs setting without ambiguity at noon. */
export function getSunMoment(date: Date, coords: Coords): SunMoment {
  const pos = SunCalc.getPosition(date, coords.lat, coords.lon);
  const altitudeDeg = (pos.altitude * 180) / Math.PI;
  const later = SunCalc.getPosition(new Date(date.getTime() + 60_000), coords.lat, coords.lon);
  const isRising = later.altitude > pos.altitude;
  const isDay = altitudeDeg > 0;
  return { altitudeDeg, isDay, isRising, phase: classifyPhase(altitudeDeg, isRising) };
}

/**
 * Classify the sky by sun altitude — the standard twilight bands, split into a
 * morning and evening variant so the theme can lean fresh vs. rosy.
 *   > 6°   day        |  0..6°  golden  |  -6..0°  blue/civil
 *   -12..-6° nautical/astronomical | < -12° night
 */
export function classifyPhase(altitudeDeg: number, isRising: boolean): SunPhase {
  if (altitudeDeg > 6) return 'day';
  if (altitudeDeg > 0.7) return isRising ? 'goldenMorning' : 'goldenEvening';
  if (altitudeDeg > -0.9) return isRising ? 'sunrise' : 'sunset';
  if (altitudeDeg > -6) return isRising ? 'blueDawn' : 'blueDusk';
  if (altitudeDeg > -12) return isRising ? 'astronomicalDawn' : 'blueDusk';
  return 'night';
}

/** A gentle greeting keyed to the sky, for the Today header. */
export function greeting(moment: SunMoment): string {
  const { altitudeDeg, isDay, isRising } = moment;
  if (!isDay) return altitudeDeg < -11 ? 'Resting hours.' : isRising ? 'Early, still.' : 'Winding down.';
  if (altitudeDeg < 6) return isRising ? 'Good morning.' : 'Good evening.';
  if (isRising && altitudeDeg < 16) return 'Good morning.';
  if (!isRising && altitudeDeg < 14) return 'Good evening.';
  return 'Good afternoon.';
}

/** Human label for the current phase, for the sub-line under the greeting. */
export function phaseLabel(phase: SunPhase): { title: string; sub: string } {
  switch (phase) {
    case 'day': return { title: 'Daylight', sub: 'high, generous light' };
    case 'goldenMorning': return { title: 'Golden hour', sub: 'soft morning light' };
    case 'goldenEvening': return { title: 'Golden hour', sub: 'the light turns gold' };
    case 'sunrise': return { title: 'Sunrise', sub: 'the day is beginning' };
    case 'sunset': return { title: 'Sunset', sub: 'the light is going' };
    case 'blueDawn': return { title: 'Blue hour', sub: 'first light is close' };
    case 'blueDusk': return { title: 'Blue hour', sub: 'dusk settling in' };
    case 'astronomicalDawn': return { title: 'Astronomical dawn', sub: 'still dark, warming' };
    case 'night': return { title: 'Night', sub: 'deep, quiet hours' };
  }
}
