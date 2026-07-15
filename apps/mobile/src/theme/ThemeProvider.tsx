import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  computeTheme, getSunMoment, greeting as greetingFor, phaseLabel,
  typeScale, space, radius, font, semantic,
  type ThemeColors, type SunMoment,
} from '@lifelike/core';
import { useAppState } from '../state/AppState';

export interface Theme {
  colors: ThemeColors;
  greeting: string;
  phaseTitle: string;
  phaseSub: string;
  typeScale: typeof typeScale;
  space: typeof space;
  radius: typeof radius;
  font: typeof font;
  semantic: typeof semantic;
}

const NIGHT_MOMENT: SunMoment = { altitudeDeg: -16, isDay: false, isRising: false, phase: 'night' };

const Ctx = createContext<Theme | null>(null);

/**
 * Recomputes the sun-driven theme every minute (and whenever Lock-to-night or the
 * device location changes). Minute-to-minute changes are tiny, so no per-frame tween
 * is needed; the visible transitions come from the continuous keyframe curve.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useAppState();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<Theme>(() => {
    const colors = computeTheme(now, settings.coords, { lockNight: settings.lockNight });
    const moment = settings.lockNight ? NIGHT_MOMENT : getSunMoment(now, settings.coords);
    const label = phaseLabel(moment.phase);
    return {
      colors,
      greeting: greetingFor(moment),
      phaseTitle: label.title,
      phaseSub: label.sub,
      typeScale, space, radius, font, semantic,
    };
  }, [now, settings.coords, settings.lockNight]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTheme must be used within ThemeProvider');
  return t;
}
