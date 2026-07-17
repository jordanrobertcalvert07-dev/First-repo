import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCheck {
  available: boolean;
  enrolled: boolean;
}

/** expo-local-authentication resolves gracefully to `false` on web — this just
 * keeps that explicit rather than relying on the module's own web stub. */
export async function getBiometricCheck(): Promise<BiometricCheck> {
  if (Platform.OS === 'web') return { available: false, enrolled: false };
  const available = await LocalAuthentication.hasHardwareAsync();
  const enrolled = available ? await LocalAuthentication.isEnrolledAsync() : false;
  return { available, enrolled };
}

export type BiometricResult = 'success' | 'failed' | 'cancelled' | 'unavailable';

/** The Medical re-lock. Falls back to the device passcode if biometrics fail —
 * still a real second gate, just not exclusively a fingerprint/face one. */
export async function requestBiometricUnlock(reason: string): Promise<BiometricResult> {
  if (Platform.OS === 'web') return 'unavailable';
  const { available, enrolled } = await getBiometricCheck();
  if (!available || !enrolled) return 'unavailable';
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  if (result.success) return 'success';
  const err = 'error' in result ? result.error : undefined;
  if (err === 'user_cancel' || err === 'app_cancel' || err === 'system_cancel') return 'cancelled';
  return 'failed';
}
