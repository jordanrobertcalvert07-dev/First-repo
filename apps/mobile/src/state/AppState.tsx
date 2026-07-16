import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Coords, type CaptureProposal } from '@lifelike/core';
import { getSecret, setSecret, deleteSecret, KEY_ANTHROPIC } from '../secure/secureStore';
import { isWebVault, getOrCreateNativeDek, webHasVault, webSetupVault, webUnlockVault } from '../storage/vault';
import { listRecords, saveProposals, type PersistedEntry } from '../storage/records';

export interface Settings {
  /** "Lock to night" — the one manual theme control, lives in Settings. */
  lockNight: boolean;
  coords: Coords;
  /** Anthropic API key (optional). When set, capture uses Claude; otherwise the
   * offline heuristic parser. Held in the OS keychain, never in source. */
  apiKey: string | null;
}

/** Vault lifecycle. Phone skips straight to 'unlocked' (OS-keychain-held key);
 * web needs a one-time passphrase setup, then unlock on every fresh load. */
export type VaultStatus = 'loading' | 'needs-setup' | 'locked' | 'unlocked';

interface AppState {
  settings: Settings;
  setLockNight: (v: boolean) => void;
  setCoords: (c: Coords) => void;
  setApiKey: (v: string | null) => void;
  vaultStatus: VaultStatus;
  setupVault: (passphrase: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  recent: PersistedEntry[];
  /** Commit reviewed proposals into the encrypted store (after the user confirms the diff). */
  commit: (proposals: CaptureProposal[]) => Promise<string[]>;
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [lockNight, setLockNight] = useState(false);
  const [coords, setCoords] = useState<Coords>(initialCoords);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [recent, setRecent] = useState<PersistedEntry[]>([]);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>('loading');
  const [dek, setDek] = useState<Uint8Array | null>(null);

  // Load the stored API key once on mount.
  useEffect(() => {
    let alive = true;
    getSecret(KEY_ANTHROPIC).then((k) => { if (alive && k) setApiKeyState(k); });
    return () => { alive = false; };
  }, []);

  // Establish the vault: phone auto-unlocks from the OS keychain; web needs a
  // passphrase, either set up now (first run) or unlocked (returning).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (isWebVault) {
        const has = await webHasVault();
        if (alive) setVaultStatus(has ? 'locked' : 'needs-setup');
      } else {
        const key = await getOrCreateNativeDek();
        if (alive) { setDek(key); setVaultStatus('unlocked'); }
      }
    })();
    return () => { alive = false; };
  }, []);

  // Once unlocked, load whatever's already persisted.
  useEffect(() => {
    if (vaultStatus === 'unlocked' && dek) {
      listRecords(dek).then(setRecent);
    }
  }, [vaultStatus, dek]);

  const setupVault = useCallback(async (passphrase: string) => {
    const key = await webSetupVault(passphrase);
    setDek(key);
    setVaultStatus('unlocked');
  }, []);

  const unlockVault = useCallback(async (passphrase: string): Promise<boolean> => {
    const key = await webUnlockVault(passphrase);
    if (!key) return false;
    setDek(key);
    setVaultStatus('unlocked');
    return true;
  }, []);

  const setApiKey = useCallback((v: string | null) => {
    const trimmed = v?.trim() || null;
    setApiKeyState(trimmed);
    if (trimmed) void setSecret(KEY_ANTHROPIC, trimmed);
    else void deleteSecret(KEY_ANTHROPIC);
  }, []);

  const commit = useCallback(async (proposals: CaptureProposal[]): Promise<string[]> => {
    if (!dek) return [];
    const created = await saveProposals(dek, proposals);
    setRecent((prev) => [...created, ...prev].slice(0, 200));
    return proposals.map((p) => p.section);
  }, [dek]);

  const value = useMemo<AppState>(
    () => ({
      settings: { lockNight, coords, apiKey },
      setLockNight, setCoords, setApiKey,
      vaultStatus, setupVault, unlockVault,
      recent, commit,
    }),
    [lockNight, coords, apiKey, setApiKey, vaultStatus, setupVault, unlockVault, recent, commit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used within AppStateProvider');
  return v;
}
