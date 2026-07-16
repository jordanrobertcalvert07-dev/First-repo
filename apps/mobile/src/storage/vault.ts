/**
 * Manages the data encryption key (DEK) that protects every record.
 *
 * Phone: the DEK is generated once and held in expo-secure-store, which is backed
 * by the iOS Keychain / Android Keystore — hardware-gated, no passphrase needed.
 * (A biometric re-lock for the whole app, and SQLCipher/op-sqlite as the storage
 * engine itself, are tracked for a later phase — see docs/STACK.md. This is the
 * interim step that makes data durable and encrypted at rest today.)
 *
 * Web: there is no OS keychain, so the DEK is wrapped with a key derived from a
 * user passphrase (PBKDF2-SHA256) and the wrapped form is what's persisted. The
 * unwrapped DEK lives only in memory for the session — closing the tab locks the
 * vault again. This is the honestly-weaker-than-native path described in
 * docs/STACK.md: it protects data at rest, not data on an unlocked machine.
 */
import { Platform } from 'react-native';
import { kvGet, kvSet } from './kv';
import { generateDataKey, generateSalt, deriveKeyFromPassphrase, encryptText, decryptText, keyToBase64, keyFromBase64 } from './crypto';

export { getOrCreateNativeDek } from './nativeDek';

const WEB_SALT_KEY = 'lifelike.vault.salt';
const WEB_WRAPPED_DEK_KEY = 'lifelike.vault.wrappedDek';

export const isWebVault = Platform.OS === 'web';

/** Web only. Whether a passphrase-protected vault has already been created on this device. */
export async function webHasVault(): Promise<boolean> {
  const [salt, wrapped] = await Promise.all([kvGet(WEB_SALT_KEY), kvGet(WEB_WRAPPED_DEK_KEY)]);
  return !!salt && !!wrapped;
}

/** Web only. First-run: pick a passphrase, generate a fresh DEK, and persist it wrapped. */
export async function webSetupVault(passphrase: string): Promise<Uint8Array> {
  const salt = generateSalt();
  const dek = generateDataKey();
  const wrapKey = deriveKeyFromPassphrase(passphrase, salt);
  const wrapped = encryptText(wrapKey, keyToBase64(dek));
  await kvSet(WEB_SALT_KEY, keyToBase64(salt));
  await kvSet(WEB_WRAPPED_DEK_KEY, wrapped);
  return dek;
}

/** Web only. Returns the DEK if the passphrase is correct, or null if it's wrong.
 * Correctness is verified by AES-GCM's authentication tag — a wrong key fails to
 * decrypt rather than silently producing garbage. */
export async function webUnlockVault(passphrase: string): Promise<Uint8Array | null> {
  const [saltB64, wrapped] = await Promise.all([kvGet(WEB_SALT_KEY), kvGet(WEB_WRAPPED_DEK_KEY)]);
  if (!saltB64 || !wrapped) return null;
  const wrapKey = deriveKeyFromPassphrase(passphrase, keyFromBase64(saltB64));
  try {
    return keyFromBase64(decryptText(wrapKey, wrapped));
  } catch {
    return null;
  }
}
