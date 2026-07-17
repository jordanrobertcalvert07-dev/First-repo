/**
 * A generic encrypted collection — the same index+encrypt-per-record scheme
 * records.ts uses, generalized so each new section (Routine, Journals, Contacts,
 * Ideas, Goals) doesn't reimplement it. One collection = one logical "table",
 * namespaced by `name` under its own key prefix and index.
 */
import { kvGet, kvSet, kvDelete } from './kv';
import { encryptText, decryptText } from './crypto';

export interface Identified {
  id: string;
}

export interface Collection<T extends Identified> {
  list(dek: Uint8Array): Promise<T[]>;
  put(dek: Uint8Array, item: T): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export function makeCollection<T extends Identified>(name: string): Collection<T> {
  const PREFIX = `lifelike.${name}.`;
  const INDEX_KEY = `lifelike.${name}.index`;

  async function readIndex(): Promise<string[]> {
    const raw = await kvGet(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }
  const writeIndex = (ids: string[]) => kvSet(INDEX_KEY, JSON.stringify(ids));

  async function list(dek: Uint8Array): Promise<T[]> {
    const ids = await readIndex();
    const out: T[] = [];
    for (const id of ids) {
      const enc = await kvGet(PREFIX + id);
      if (!enc) continue;
      try {
        out.push(JSON.parse(decryptText(dek, enc)) as T);
      } catch {
        // Wrong key or corrupt entry — skip rather than crash the whole list.
      }
    }
    return out;
  }

  async function put(dek: Uint8Array, item: T): Promise<void> {
    await kvSet(PREFIX + item.id, encryptText(dek, JSON.stringify(item)));
    const ids = await readIndex();
    if (!ids.includes(item.id)) {
      ids.push(item.id);
      await writeIndex(ids);
    }
  }

  async function remove(id: string): Promise<void> {
    await kvDelete(PREFIX + id);
    const ids = await readIndex();
    await writeIndex(ids.filter((x) => x !== id));
  }

  async function clear(): Promise<void> {
    const ids = await readIndex();
    await Promise.all(ids.map((id) => kvDelete(PREFIX + id)));
    await kvDelete(INDEX_KEY);
  }

  return { list, put, remove, clear };
}

let seq = 0;
export const newId = (prefix: string): string => `${prefix}_${Date.now()}_${seq++}`;
