/**
 * Encryption primitives for local storage. AES-256-GCM via @noble/ciphers (pure JS,
 * audited, no native module — works identically in Expo Go and the browser, unlike
 * react-native-get-random-values or a native crypto binding). Randomness comes from
 * expo-crypto (an official Expo SDK module, present in Expo Go) so nothing here
 * depends on `crypto.getRandomValues`, which Hermes does not provide unpolyfilled.
 */

import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToBase64, base64ToBytes, utf8Encode, utf8Decode } from './bytes';

const KEY_BYTES = 32; // AES-256
const NONCE_BYTES = 12; // standard GCM nonce
const SALT_BYTES = 16;
/** OWASP-recommended floor for PBKDF2-SHA256 as of 2023; tuned down slightly
 * (150k vs 600k) so unlock stays snappy on a phone while still being firmly
 * outside brute-force range for a human passphrase. */
const PBKDF2_ITERATIONS = 150_000;

export const randomBytes = (n: number): Uint8Array => Crypto.getRandomBytes(n);
export const generateDataKey = (): Uint8Array => randomBytes(KEY_BYTES);
export const generateSalt = (): Uint8Array => randomBytes(SALT_BYTES);

export function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, utf8Encode(passphrase.normalize('NFKC')), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_BYTES,
  });
}

/** Encrypt UTF-8 text under `key`. Output is `nonce || ciphertext+tag`, base64. */
export function encryptText(key: Uint8Array, plaintext: string): string {
  const nonce = randomBytes(NONCE_BYTES);
  const ct = gcm(key, nonce).encrypt(utf8Encode(plaintext));
  const combined = new Uint8Array(nonce.length + ct.length);
  combined.set(nonce, 0);
  combined.set(ct, nonce.length);
  return bytesToBase64(combined);
}

/** Inverse of encryptText. Throws (auth tag mismatch) if `key` is wrong or the
 * ciphertext was tampered with — GCM refuses to return unauthenticated plaintext. */
export function decryptText(key: Uint8Array, encoded: string): string {
  const combined = base64ToBytes(encoded);
  const nonce = combined.slice(0, NONCE_BYTES);
  const ct = combined.slice(NONCE_BYTES);
  const pt = gcm(key, nonce).decrypt(ct);
  return utf8Decode(pt);
}

export const keyToBase64 = bytesToBase64;
export const keyFromBase64 = base64ToBytes;
