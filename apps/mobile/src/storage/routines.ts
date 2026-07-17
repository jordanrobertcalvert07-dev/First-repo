/**
 * Daily routine & actions: recurring actions grouped into time blocks, with
 * flexible cadence and streaks that show trend rather than shame — a broken
 * streak isn't an error state, it's just history.
 */
import { makeCollection, newId, type Identified } from './collection';

export type TimeBlock = 'morning' | 'midday' | 'evening' | 'night';
export const TIME_BLOCKS: readonly TimeBlock[] = ['morning', 'midday', 'evening', 'night'];
export const TIME_BLOCK_LABEL: Record<TimeBlock, string> = {
  morning: 'Morning', midday: 'Midday', evening: 'Evening', night: 'Night',
};

export type Cadence =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'everyNDays'; n: number; anchor: string } // anchor = YYYY-MM-DD the count starts from
  | { type: 'specificDays'; days: number[] }; // 0 = Sunday .. 6 = Saturday

export interface RoutineAction extends Identified {
  title: string;
  timeBlock: TimeBlock;
  cadence: Cadence;
  createdAt: number;
  archivedAt: number | null;
}

export interface RoutineCompletion extends Identified {
  actionId: string;
  /** Local calendar day this completion counts for, YYYY-MM-DD. Streaks and the
   * heatmap key off this, not the exact timestamp. */
  day: string;
  completedAt: number;
}

const actionsCol = makeCollection<RoutineAction>('routineAction');
const completionsCol = makeCollection<RoutineCompletion>('routineCompletion');

export const toDayKey = (d: Date): string => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function isDueOn(action: RoutineAction, date: Date): boolean {
  const c = action.cadence;
  switch (c.type) {
    case 'daily': return true;
    case 'weekdays': { const d = date.getDay(); return d >= 1 && d <= 5; }
    case 'specificDays': return c.days.includes(date.getDay());
    case 'everyNDays': {
      const anchor = startOfDay(new Date(c.anchor));
      const diffMs = startOfDay(date).getTime() - anchor.getTime();
      const diffDays = Math.round(diffMs / 86_400_000);
      return diffDays >= 0 && diffDays % Math.max(1, c.n) === 0;
    }
  }
}

export async function listActiveActions(dek: Uint8Array): Promise<RoutineAction[]> {
  const all = await actionsCol.list(dek);
  return all.filter((a) => !a.archivedAt).sort((a, b) => a.createdAt - b.createdAt);
}

export async function listCompletions(dek: Uint8Array): Promise<RoutineCompletion[]> {
  return completionsCol.list(dek);
}

export interface NewAction {
  title: string;
  timeBlock: TimeBlock;
  cadence: Cadence;
}

export async function createAction(dek: Uint8Array, input: NewAction): Promise<RoutineAction> {
  const action: RoutineAction = { id: newId('act'), createdAt: Date.now(), archivedAt: null, ...input };
  await actionsCol.put(dek, action);
  return action;
}

export async function archiveAction(dek: Uint8Array, action: RoutineAction): Promise<void> {
  await actionsCol.put(dek, { ...action, archivedAt: Date.now() });
}

/** Toggle today's (or a given day's) completion for an action. Returns the new
 * completion, or null if it was un-checked. */
export async function toggleCompletion(
  dek: Uint8Array,
  actionId: string,
  day: string,
  existing: RoutineCompletion[],
): Promise<RoutineCompletion | null> {
  const hit = existing.find((c) => c.actionId === actionId && c.day === day);
  if (hit) {
    await completionsCol.remove(hit.id);
    return null;
  }
  const rec: RoutineCompletion = { id: newId('comp'), actionId, day, completedAt: Date.now() };
  await completionsCol.put(dek, rec);
  return rec;
}

export function isDoneOn(completions: RoutineCompletion[], actionId: string, day: string): boolean {
  return completions.some((c) => c.actionId === actionId && c.day === day);
}

/** Consecutive due-days, walking backward from today, that were completed.
 * Today itself doesn't break the streak if not yet done — there's still time. */
export function computeStreak(action: RoutineAction, completions: RoutineCompletion[], today: Date): number {
  let streak = 0;
  let cursor = startOfDay(today);
  const todayKey = toDayKey(today);
  for (let guard = 0; guard < 400; guard++) {
    if (isDueOn(action, cursor)) {
      const key = toDayKey(cursor);
      if (isDoneOn(completions, action.id, key)) streak++;
      else if (key !== todayKey) break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Last `days` calendar days as {day, due, done} — the data a heatmap/dot-strip needs. */
export function recentTrend(action: RoutineAction, completions: RoutineCompletion[], today: Date, days: number) {
  const out: { day: string; due: boolean; done: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(startOfDay(today), -i);
    const due = isDueOn(action, d);
    out.push({ day: toDayKey(d), due, done: due && isDoneOn(completions, action.id, toDayKey(d)) });
  }
  return out;
}

export function dueToday(actions: RoutineAction[], today: Date): RoutineAction[] {
  return actions.filter((a) => isDueOn(a, today));
}

export function cadenceLabel(c: Cadence): string {
  switch (c.type) {
    case 'daily': return 'Every day';
    case 'weekdays': return 'Weekdays';
    case 'specificDays': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return c.days.length ? c.days.slice().sort().map((d) => names[d]).join(', ') : 'No days set';
    }
    case 'everyNDays': return c.n === 1 ? 'Every day' : `Every ${c.n} days`;
  }
}
