import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Biometric gate. On the phone (Moto G Play) this is Android BiometricPrompt via
 * expo-local-authentication; it will front the hardware-held database key once
 * op-sqlite/SQLCipher is wired in (Phase 3/7). On the web there is no equivalent —
 * WebAuthn passkeys are a genuinely different, weaker model (see docs/STACK.md) — so
 * this returns `unsupported` there and the caller decides how to proceed.
 */
export type BiometricResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'unavailable' | 'cancelled' | 'failed' };

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticate(promptMessage: string): Promise<BiometricResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unsupported' };
  if (!(await isBiometricAvailable())) return { ok: false, reason: 'unavailable' };

  const res = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  if (res.success) return { ok: true };
  return { ok: false, reason: res.error === 'user_cancel' ? 'cancelled' : 'failed' };
}
