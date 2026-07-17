import { makeCollection, newId, type Identified } from './collection';

export type GoalTimeframe = 'short' | 'long';
export type GoalStatus = 'active' | 'achieved' | 'abandoned';

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal extends Identified {
  title: string;
  timeframe: GoalTimeframe;
  notes: string;
  milestones: Milestone[];
  /** Routine action ids this goal is supported by — a lightweight, read-only link. */
  linkedActionIds: string[];
  status: GoalStatus;
  createdAt: number;
  /** When it left 'active' — for achieved or abandoned goals. */
  resolvedAt: number | null;
}

export interface NewGoal {
  title: string;
  timeframe: GoalTimeframe;
  notes: string;
  linkedActionIds: string[];
}

const goalsCol = makeCollection<Goal>('goal');

export async function listGoals(dek: Uint8Array): Promise<Goal[]> {
  const all = await goalsCol.list(dek);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createGoal(dek: Uint8Array, input: NewGoal): Promise<Goal> {
  const goal: Goal = { id: newId('goal'), ...input, milestones: [], status: 'active', createdAt: Date.now(), resolvedAt: null };
  await goalsCol.put(dek, goal);
  return goal;
}

export async function updateGoal(dek: Uint8Array, goal: Goal, changes: NewGoal): Promise<Goal> {
  const updated: Goal = { ...goal, ...changes };
  await goalsCol.put(dek, updated);
  return updated;
}

/** Moving to/from 'active' clears or stamps resolvedAt — this is also how a
 * graveyard goal gets reactivated, with no separate "undo abandon" concept. */
export async function setGoalStatus(dek: Uint8Array, goal: Goal, status: GoalStatus): Promise<Goal> {
  const updated: Goal = { ...goal, status, resolvedAt: status === 'active' ? null : Date.now() };
  await goalsCol.put(dek, updated);
  return updated;
}

export async function removeGoal(id: string): Promise<void> {
  await goalsCol.remove(id);
}

export async function addMilestone(dek: Uint8Array, goal: Goal, title: string): Promise<Goal> {
  const milestone: Milestone = { id: newId('milestone'), title, done: false };
  const updated: Goal = { ...goal, milestones: [...goal.milestones, milestone] };
  await goalsCol.put(dek, updated);
  return updated;
}

export async function toggleMilestone(dek: Uint8Array, goal: Goal, milestoneId: string): Promise<Goal> {
  const updated: Goal = {
    ...goal,
    milestones: goal.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)),
  };
  await goalsCol.put(dek, updated);
  return updated;
}

export async function removeMilestone(dek: Uint8Array, goal: Goal, milestoneId: string): Promise<Goal> {
  const updated: Goal = { ...goal, milestones: goal.milestones.filter((m) => m.id !== milestoneId) };
  await goalsCol.put(dek, updated);
  return updated;
}

export function milestoneProgress(goal: Goal): { done: number; total: number } {
  return { done: goal.milestones.filter((m) => m.done).length, total: goal.milestones.length };
}
