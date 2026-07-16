/**
 * Encrypted persistence for logged entries. Each record is stored as its own
 * AES-GCM-encrypted blob under `lifelike.record.<id>`; a plaintext index (just IDs
 * — no content) lives at `lifelike.record.index` so records can be listed without
 * decrypting everything up front... in practice the dataset is small enough that
 * this implementation decrypts eagerly on load, which is simpler and plenty fast
 * for a single-user local log.
 *
 * This mirrors exactly what the UI shows in "Today's river" today. It is an
 * interim persistence layer — schema-typed records and a real query layer land
 * when the section screens are built; SQLCipher/op-sqlite (Evolu) replaces the
 * storage engine itself in the sync phase. See docs/STACK.md.
 */
import type { CaptureProposal } from '@lifelike/core';
import { kvGet, kvSet, kvDelete, kvKeysWithPrefix } from './kv';
import { encryptText, decryptText } from './crypto';

const RECORD_PREFIX = 'lifelike.record.';
const INDEX_KEY = 'lifelike.record.index';

export interface PersistedEntry {
  id: string;
  icon: string;
  section: string;
  kind: string;
  fields: { key: string; label: string; value: string }[];
  createdAt: number;
}

let seq = 0;
const uid = () => `r${Date.now()}_${seq++}`;

async function readIndex(): Promise<string[]> {
  const raw = await kvGet(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}
const writeIndex = (ids: string[]) => kvSet(INDEX_KEY, JSON.stringify(ids));

/** Decrypt and return every persisted entry, newest first. */
export async function listRecords(dek: Uint8Array): Promise<PersistedEntry[]> {
  const ids = await readIndex();
  const entries: PersistedEntry[] = [];
  for (const id of ids) {
    const enc = await kvGet(RECORD_PREFIX + id);
    if (!enc) continue;
    try {
      entries.push(JSON.parse(decryptText(dek, enc)) as PersistedEntry);
    } catch {
      // Wrong key or corrupt entry — skip rather than crash the whole list.
    }
  }
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

/** Encrypt and persist reviewed proposals, returning the new entries (newest first). */
export async function saveProposals(dek: Uint8Array, proposals: CaptureProposal[]): Promise<PersistedEntry[]> {
  const ids = await readIndex();
  const created: PersistedEntry[] = [];
  for (const p of proposals) {
    const entry: PersistedEntry = {
      id: uid(),
      icon: p.icon,
      section: p.section,
      kind: p.kind,
      fields: p.fields,
      createdAt: Date.now(),
    };
    await kvSet(RECORD_PREFIX + entry.id, encryptText(dek, JSON.stringify(entry)));
    ids.push(entry.id);
    created.push(entry);
  }
  await writeIndex(ids);
  return created.reverse();
}

/** Full wipe — used only by data-export/reset flows, not exposed in the UI yet. */
export async function clearAllRecords(): Promise<void> {
  const ids = await readIndex();
  await Promise.all(ids.map((id) => kvDelete(RECORD_PREFIX + id)));
  await kvDelete(INDEX_KEY);
  const stray = await kvKeysWithPrefix(RECORD_PREFIX);
  await Promise.all(stray.map(kvDelete));
}
