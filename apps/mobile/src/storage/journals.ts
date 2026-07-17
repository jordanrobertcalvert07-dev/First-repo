import { makeCollection, newId, type Identified } from './collection';

export type JournalKind = 'daily' | 'sleep' | 'cannabis' | 'recovery';

export const JOURNAL_KINDS: readonly JournalKind[] = ['daily', 'sleep', 'cannabis', 'recovery'];

export const JOURNAL_KIND_LABEL: Record<JournalKind, string> = {
  daily: 'Daily',
  sleep: 'Sleep',
  cannabis: 'Cannabis',
  recovery: 'Recovery',
};

export const JOURNAL_KIND_ICON: Record<JournalKind, string> = {
  daily: 'pen',
  sleep: 'moon',
  cannabis: 'leaf',
  recovery: 'recovery',
};

export interface JournalEntry extends Identified {
  kind: JournalKind;
  body: string;
  /** 1-5 felt-sense rating, optional — not every entry needs one. */
  mood: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface NewJournalEntry {
  kind: JournalKind;
  body: string;
  mood: number | null;
}

const journalsCol = makeCollection<JournalEntry>('journalEntry');

export async function listJournalEntries(dek: Uint8Array): Promise<JournalEntry[]> {
  const all = await journalsCol.list(dek);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createJournalEntry(dek: Uint8Array, input: NewJournalEntry): Promise<JournalEntry> {
  const now = Date.now();
  const entry: JournalEntry = { id: newId('journal'), createdAt: now, updatedAt: now, ...input };
  await journalsCol.put(dek, entry);
  return entry;
}

export async function updateJournalEntry(
  dek: Uint8Array,
  entry: JournalEntry,
  changes: NewJournalEntry,
): Promise<JournalEntry> {
  const updated: JournalEntry = { ...entry, ...changes, updatedAt: Date.now() };
  await journalsCol.put(dek, updated);
  return updated;
}

export async function removeJournalEntry(id: string): Promise<void> {
  await journalsCol.remove(id);
}

/** A friendly day-group label for the unified timeline: "Today", "Yesterday", or a full date. */
export function dayLabel(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
