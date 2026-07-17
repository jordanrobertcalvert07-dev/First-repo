/**
 * Medical storage — medications, adherence doses, and a single free-text notes
 * blob. Everything here lives behind the Health hub's phone-only gate and the
 * Medical sub-section's additional biometric re-lock; nothing in this module
 * cares about that itself, it just encrypts and persists like every other
 * collection (see storage/collection.ts).
 */
import { makeCollection, newId, type Identified } from './collection';
import { kvGet, kvSet } from './kv';
import { encryptText, decryptText } from './crypto';

export interface Medication extends Identified {
  name: string;
  dosage: string;
  notes: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface NewMedication {
  name: string;
  dosage: string;
  notes: string;
}

export interface MedicationDose extends Identified {
  medicationId: string;
  takenAt: number;
}

const medsCol = makeCollection<Medication>('medication');
const dosesCol = makeCollection<MedicationDose>('medicationDose');

export async function listActiveMedications(dek: Uint8Array): Promise<Medication[]> {
  const all = await medsCol.list(dek);
  return all.filter((m) => !m.archivedAt).sort((a, b) => a.createdAt - b.createdAt);
}

export async function listDoses(dek: Uint8Array): Promise<MedicationDose[]> {
  return dosesCol.list(dek);
}

export async function createMedication(dek: Uint8Array, input: NewMedication): Promise<Medication> {
  const med: Medication = { id: newId('medication'), ...input, createdAt: Date.now(), archivedAt: null };
  await medsCol.put(dek, med);
  return med;
}

export async function updateMedication(dek: Uint8Array, med: Medication, changes: NewMedication): Promise<Medication> {
  const updated: Medication = { ...med, ...changes };
  await medsCol.put(dek, updated);
  return updated;
}

export async function archiveMedication(dek: Uint8Array, med: Medication): Promise<void> {
  await medsCol.put(dek, { ...med, archivedAt: Date.now() });
}

export async function logDose(dek: Uint8Array, medicationId: string, when: number = Date.now()): Promise<MedicationDose> {
  const dose: MedicationDose = { id: newId('dose'), medicationId, takenAt: when };
  await dosesCol.put(dek, dose);
  return dose;
}

export async function removeDose(id: string): Promise<void> {
  await dosesCol.remove(id);
}

export function dosesFor(doses: MedicationDose[], medicationId: string): MedicationDose[] {
  return doses.filter((d) => d.medicationId === medicationId).sort((a, b) => b.takenAt - a.takenAt);
}

const NOTES_KEY = 'lifelike.medicalNotes';

export async function getMedicalNotes(dek: Uint8Array): Promise<string> {
  const enc = await kvGet(NOTES_KEY);
  if (!enc) return '';
  try {
    return decryptText(dek, enc);
  } catch {
    return '';
  }
}

export async function setMedicalNotes(dek: Uint8Array, text: string): Promise<void> {
  await kvSet(NOTES_KEY, encryptText(dek, text));
}
