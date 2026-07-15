import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type Coords, type CaptureProposal } from '@lifelike/core';

/**
 * A sensible starting location before `expo-location` provides the real one:
 * derive an approximate longitude from the device's timezone so the sun-driven
 * theme roughly agrees with the wall clock (night looks like night) even before
 * the user grants location. Latitude defaults to a temperate 40°.
 */
function initialCoords(): Coords {
  const lon = Math.max(-180, Math.min(180, -(new Date().getTimezoneOffset() / 60) * 15));
  return { lat: 40, lon };
}

/** A committed entry as shown in "Today's river". The real store (Evolu-backed,
 * encrypted) lands in Phase 7; this in-memory version keeps the skeleton alive. */
export interface LogItem {
  id: string;
  icon: string;
  section: string;
  detail: string;
  at: number;
}

export interface Settings {
  /** "Lock to night" — the one manual theme control, lives in Settings. */
  lockNight: boolean;
  coords: Coords;
}

interface AppState {
  settings: Settings;
  setLockNight: (v: boolean) => void;
  setCoords: (c: Coords) => void;
  recent: LogItem[];
  doneCount: number;
  totalCount: number;
  /** Commit reviewed proposals into the store (after the user confirms the diff). */
  commit: (proposals: CaptureProposal[]) => string[];
}

const Ctx = createContext<AppState | null>(null);

const SEED: LogItem[] = [
  { id: 's1', icon: 'cup-water', section: 'Hydration', detail: '500 ml · 2h ago', at: Date.now() - 7.2e6 },
  { id: 's2', icon: 'pencil', section: 'Daily journal', detail: 'entry · 4h ago', at: Date.now() - 1.44e7 },
  { id: 's3', icon: 'run', section: 'Exercise', detail: '30 min walk · 6h ago', at: Date.now() - 2.16e7 },
];

let seq = 0;
const uid = () => `l${Date.now()}_${seq++}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [lockNight, setLockNight] = useState(false);
  const [coords, setCoords] = useState<Coords>(initialCoords);
  const [recent, setRecent] = useState<LogItem[]>(SEED);
  const [doneCount] = useState(4);
  const totalCount = 7;

  const commit = useCallback((proposals: CaptureProposal[]): string[] => {
    const items: LogItem[] = proposals.map((p) => {
      const detail =
        p.fields
          .filter((f) => f.value && f.value !== '')
          .slice(0, 2)
          .map((f) => f.value)
          .join(' · ') || 'logged';
      return { id: uid(), icon: p.icon, section: p.section, detail: `${detail} · just now`, at: Date.now() };
    });
    setRecent((prev) => [...items, ...prev].slice(0, 8));
    return proposals.map((p) => p.section);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      settings: { lockNight, coords },
      setLockNight,
      setCoords,
      recent,
      doneCount,
      totalCount,
      commit,
    }),
    [lockNight, coords, recent, doneCount, commit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used within AppStateProvider');
  return v;
}
