/** Web build of nativeDek.ts. Never called — AppState only reaches this when
 * `isWebVault` is false — but Metro still needs a web-safe module to resolve to
 * since expo-secure-store (imported by the native sibling) has no web support. */
export async function getOrCreateNativeDek(): Promise<Uint8Array> {
  throw new Error('getOrCreateNativeDek is phone-only');
}
