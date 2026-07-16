/**
 * Phone-only. Split into its own file (with a `.web.ts` stub sibling) because
 * expo-secure-store has no web implementation — importing it unconditionally
 * inside a module that's also reachable from the web bundle crashes at load time
 * (Metro still bundles the code even behind a Platform.OS check; only a separate
 * file resolved per-platform actually excludes it).
 */
import * as SecureStore from 'expo-secure-store';
import { generateDataKey, keyToBase64, keyFromBase64 } from './crypto';

const NATIVE_DEK_KEY = 'lifelike.vault.dek';

/** Returns the persistent DEK, generating and storing one in the Keychain/Keystore
 * on first run. */
export async function getOrCreateNativeDek(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(NATIVE_DEK_KEY);
  if (existing) return keyFromBase64(existing);
  const dek = generateDataKey();
  await SecureStore.setItemAsync(NATIVE_DEK_KEY, keyToBase64(dek));
  return dek;
}
