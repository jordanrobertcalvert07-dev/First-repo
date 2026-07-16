import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Coords, type CaptureProposal } from '@lifelike/core';
import { getSecret, setSecret, deleteSecret, KEY_ANTHROPIC } from '../secure/secureStore';

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
  /** Anthropic API key (optional). When set, capture uses Claude; otherwise the
   * offline heuristic parser. Held in the OS keychain, never in source. */
  apiKey: string | null;
}

interface AppState {
  settings: Settings;
  setLockNight: (v: boolean) => void;
  setCoords: (c: Coords) => void;
  setApiKey: (v: string | null) => void;
  recent: LogItem[];
  /** Commit reviewed proposals into the store (after the user confirms the diff). */
  commit: (proposals: CaptureProposal[]) => string[];
}

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

const Ctx = createContext<AppState | null>(null);

let seq = 0;
const uid = () => `l${Date.now()}_${seq++}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [lockNight, setLockNight] = useState(false);
  const [coords, setCoords] = useState<Coords>(initialCoords);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [recent, setRecent] = useState<LogItem[]>([]);

  // Load the stored API key once on mount.
  useEffect(() => {
    let alive = true;
    getSecret(KEY_ANTHROPIC).then((k) => { if (alive && k) setApiKeyState(k); });
    return () => { alive = false; };
  }, []);

  const setApiKey = useCallback((v: string | null) => {
    const trimmed = v?.trim() || null;
    setApiKeyState(trimmed);
    if (trimmed) void setSecret(KEY_ANTHROPIC, trimmed);
    else void deleteSecret(KEY_ANTHROPIC);
  }, []);

  const commit = useCallback((proposals: CaptureProposal[]): string[] => {
    const items: LogItem[] = proposals.map((p) => {
      const detail =
        p.fields.filter((f) => f.value && f.value !== '').slice(0, 2).map((f) => f.value).join(' · ')
        || 'logged';
      return { id: uid(), icon: p.icon, section: p.section, detail: `${detail} · just now`, at: Date.now() };
    });
    setRecent((prev) => [...items, ...prev].slice(0, 20));
    return proposals.map((p) => p.section);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      settings: { lockNight, coords, apiKey },
      setLockNight, setCoords, setApiKey,
      recent, commit,
    }),
    [lockNight, coords, apiKey, recent, setApiKey, commit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used within AppStateProvider');
  return v;
}
