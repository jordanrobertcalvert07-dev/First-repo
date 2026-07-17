import { makeCollection, newId, type Identified } from './collection';

export type ContactCategory = 'personal' | 'professional';

export interface Contact extends Identified {
  name: string;
  category: ContactCategory;
  /** Tag for people who make up your support network — surfaced separately, no other special handling. */
  supportNetwork: boolean;
  /** Target reach-out cadence in days, or null to not track one. */
  reachOutDays: number | null;
  lastContactedAt: number | null;
  notes: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface NewContact {
  name: string;
  category: ContactCategory;
  supportNetwork: boolean;
  reachOutDays: number | null;
  notes: string;
}

const contactsCol = makeCollection<Contact>('contact');

export async function listActiveContacts(dek: Uint8Array): Promise<Contact[]> {
  const all = await contactsCol.list(dek);
  return all.filter((c) => !c.archivedAt);
}

export async function createContact(dek: Uint8Array, input: NewContact): Promise<Contact> {
  const contact: Contact = {
    id: newId('contact'),
    ...input,
    lastContactedAt: null,
    createdAt: Date.now(),
    archivedAt: null,
  };
  await contactsCol.put(dek, contact);
  return contact;
}

export async function updateContact(dek: Uint8Array, contact: Contact, changes: NewContact): Promise<Contact> {
  const updated: Contact = { ...contact, ...changes };
  await contactsCol.put(dek, updated);
  return updated;
}

export async function archiveContact(dek: Uint8Array, contact: Contact): Promise<void> {
  await contactsCol.put(dek, { ...contact, archivedAt: Date.now() });
}

export async function markContacted(dek: Uint8Array, contact: Contact, when: number = Date.now()): Promise<Contact> {
  const updated: Contact = { ...contact, lastContactedAt: when };
  await contactsCol.put(dek, updated);
  return updated;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(ms: number, now: number): number {
  return Math.floor((now - ms) / DAY_MS);
}

/** Days since last contact, or since the contact was added if never marked contacted. */
export function daysSinceContact(contact: Contact, now: number): number {
  return daysSince(contact.lastContactedAt ?? contact.createdAt, now);
}

/** Positive = overdue by that many days, negative = due in that many days, null = no cadence tracked. */
export function overdueBy(contact: Contact, now: number): number | null {
  if (contact.reachOutDays == null) return null;
  return daysSinceContact(contact, now) - contact.reachOutDays;
}

export function reachOutLabel(contact: Contact, now: number): string {
  const overdue = overdueBy(contact, now);
  if (overdue == null) return 'No cadence set';
  if (overdue > 0) return `${overdue}d overdue`;
  if (overdue === 0) return 'Due today';
  return `Due in ${-overdue}d`;
}

/** Most-overdue first; contacts with no cadence sort last, alphabetically. */
export function sortByUrgency(contacts: Contact[], now: number): Contact[] {
  return [...contacts].sort((a, b) => {
    const oa = overdueBy(a, now);
    const ob = overdueBy(b, now);
    if (oa == null && ob == null) return a.name.localeCompare(b.name);
    if (oa == null) return 1;
    if (ob == null) return -1;
    if (ob !== oa) return ob - oa;
    return a.name.localeCompare(b.name);
  });
}

export const CADENCE_PRESETS: readonly { label: string; days: number | null }[] = [
  { label: 'No cadence', days: null },
  { label: 'Weekly', days: 7 },
  { label: 'Biweekly', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
];
