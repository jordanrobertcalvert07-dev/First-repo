import { makeCollection, newId, type Identified } from './collection';

export interface VitalEntry extends Identified {
  weightLb: number | null;
  restingHr: number | null;
  systolic: number | null;
  diastolic: number | null;
  note: string;
  createdAt: number;
}

export interface NewVitalEntry {
  weightLb: number | null;
  restingHr: number | null;
  systolic: number | null;
  diastolic: number | null;
  note: string;
}

const vitalsCol = makeCollection<VitalEntry>('vital');

export async function listVitals(dek: Uint8Array): Promise<VitalEntry[]> {
  const all = await vitalsCol.list(dek);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createVital(dek: Uint8Array, input: NewVitalEntry): Promise<VitalEntry> {
  const entry: VitalEntry = { id: newId('vital'), ...input, createdAt: Date.now() };
  await vitalsCol.put(dek, entry);
  return entry;
}

export async function updateVital(dek: Uint8Array, entry: VitalEntry, changes: NewVitalEntry): Promise<VitalEntry> {
  const updated: VitalEntry = { ...entry, ...changes };
  await vitalsCol.put(dek, updated);
  return updated;
}

export async function removeVital(id: string): Promise<void> {
  await vitalsCol.remove(id);
}
