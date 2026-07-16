import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform secret storage. On the phone this is the hardware-backed
 * Keychain / Android Keystore (via expo-secure-store). On web there is no OS
 * keychain, so it falls back to localStorage — honestly weaker, and surfaced as
 * such in Settings. Used for the Anthropic API key today; the DB key later.
 */
export async function getSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  }
  try { return (await SecureStore.getItemAsync(key)) ?? null; } catch { return null; }
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { globalThis.localStorage?.setItem(key, value); } catch { /* ignore */ }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { globalThis.localStorage?.removeItem(key); } catch { /* ignore */ }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const KEY_ANTHROPIC = 'lifelike.anthropicApiKey';
