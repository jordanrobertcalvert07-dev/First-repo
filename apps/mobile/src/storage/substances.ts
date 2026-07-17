import { Substance as SubstanceEnum, type Substance } from '@lifelike/core';
import { makeCollection, newId, type Identified } from './collection';

export type { Substance };

/** Every substance is first-class — same fields, same neutral framing, no hierarchy. */
export const SUBSTANCES: readonly Substance[] = SubstanceEnum.options;

export const SUBSTANCE_LABEL: Record<Substance, string> = {
  cannabis: 'Cannabis',
  nicotine: 'Nicotine',
  crackCocaine: 'Crack / Cocaine',
  meth: 'Meth',
  fentanyl: 'Fentanyl',
  lsd: 'LSD',
  mushrooms: 'Mushrooms',
  dmt: 'DMT',
};

export interface SubstanceUseEntry extends Identified {
  substance: Substance;
  occurredAt: number;
  amount: string;
  method: string;
  context: string;
  moodBefore: number | null;
  moodAfter: number | null;
  trigger: string;
  note: string;
}

export interface NewSubstanceUse {
  substance: Substance;
  amount: string;
  method: string;
  context: string;
  moodBefore: number | null;
  moodAfter: number | null;
  trigger: string;
  note: string;
}

const usesCol = makeCollection<SubstanceUseEntry>('substanceUse');

export async function listSubstanceUses(dek: Uint8Array): Promise<SubstanceUseEntry[]> {
  const all = await usesCol.list(dek);
  return all.sort((a, b) => b.occurredAt - a.occurredAt);
}

export async function createSubstanceUse(dek: Uint8Array, input: NewSubstanceUse): Promise<SubstanceUseEntry> {
  const entry: SubstanceUseEntry = { id: newId('use'), ...input, occurredAt: Date.now() };
  await usesCol.put(dek, entry);
  return entry;
}

export async function updateSubstanceUse(
  dek: Uint8Array,
  entry: SubstanceUseEntry,
  changes: NewSubstanceUse,
): Promise<SubstanceUseEntry> {
  const updated: SubstanceUseEntry = { ...entry, ...changes };
  await usesCol.put(dek, updated);
  return updated;
}

export async function removeSubstanceUse(id: string): Promise<void> {
  await usesCol.remove(id);
}

export function usesFor(all: SubstanceUseEntry[], substance: Substance): SubstanceUseEntry[] {
  return all.filter((u) => u.substance === substance);
}
