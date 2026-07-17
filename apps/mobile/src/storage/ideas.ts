import { makeCollection, newId, type Identified } from './collection';

export type IdeaStatus = 'inbox' | 'kept' | 'discarded';

export interface Idea extends Identified {
  text: string;
  status: IdeaStatus;
  createdAt: number;
  /** When it left the inbox — null while still untriaged. */
  triagedAt: number | null;
}

const ideasCol = makeCollection<Idea>('idea');

export async function listIdeas(dek: Uint8Array): Promise<Idea[]> {
  const all = await ideasCol.list(dek);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/** As frictionless as capture gets: just the text, dropped straight into the inbox. */
export async function captureIdea(dek: Uint8Array, text: string): Promise<Idea> {
  const idea: Idea = { id: newId('idea'), text, status: 'inbox', createdAt: Date.now(), triagedAt: null };
  await ideasCol.put(dek, idea);
  return idea;
}

export async function setIdeaStatus(dek: Uint8Array, idea: Idea, status: IdeaStatus): Promise<Idea> {
  const updated: Idea = { ...idea, status, triagedAt: status === 'inbox' ? null : Date.now() };
  await ideasCol.put(dek, updated);
  return updated;
}

export async function removeIdea(id: string): Promise<void> {
  await ideasCol.remove(id);
}
