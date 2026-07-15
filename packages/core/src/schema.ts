/**
 * Data schema (Zod). These validate every write — including the ones the AI proposes —
 * before anything touches the encrypted database. Kept intentionally small for the
 * skeleton; each section grows its own file as we build it out.
 */

import { z } from 'zod';

/** Where a section's data is allowed to live. Medical + substances default to device-local. */
export const SyncScope = z.enum(['device-local', 'phone-only-sync', 'all-devices']);
export type SyncScope = z.infer<typeof SyncScope>;

/** Sections default to all-devices; sensitive ones override to device-local. */
export const DEFAULT_SYNC_SCOPE: Record<string, SyncScope> = {
  medical: 'device-local',
  substances: 'device-local',
};

/** Fields every record carries. `id` is a UUID; timestamps are epoch ms. */
const base = {
  id: z.string().uuid(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  /** Device that authored the record — used by the sync/merge layer. */
  deviceId: z.string().min(1),
};

/** The instant a logged thing happened (may be backfilled), epoch ms. */
const occurredAt = z.number().int();

export const SleepEntry = z.object({
  ...base,
  kind: z.literal('sleep'),
  occurredAt,
  durationMinutes: z.number().int().min(0).max(24 * 60).optional(),
  awakenings: z.number().int().min(0).optional(),
  quality: z.number().int().min(1).max(5).optional(),
  dreams: z.string().optional(),
  flags: z.array(z.enum(['nightmare', 'nightTerror', 'sleepParalysis', 'vividDream'])).default([]),
  feltOnWaking: z.string().optional(),
  note: z.string().optional(),
});
export type SleepEntry = z.infer<typeof SleepEntry>;

export const MedicationAdherence = z.object({
  ...base,
  kind: z.literal('medicationAdherence'),
  occurredAt,
  /** Reference to a medication in the (device-local) medical profile, not the name. */
  medicationRef: z.string().optional(),
  label: z.string().optional(),
  taken: z.boolean().default(true),
  note: z.string().optional(),
});
export type MedicationAdherence = z.infer<typeof MedicationAdherence>;

export const Substance = z.enum([
  'cannabis', 'nicotine', 'crackCocaine', 'meth', 'fentanyl', 'lsd', 'mushrooms', 'dmt',
]);
export type Substance = z.infer<typeof Substance>;

/** Neutral, factual use log. No judgement, ever — this is data the user keeps for themselves. */
export const SubstanceUse = z.object({
  ...base,
  kind: z.literal('substanceUse'),
  substance: Substance,
  occurredAt,
  amount: z.string().optional(),
  method: z.string().optional(),
  context: z.string().optional(),
  moodBefore: z.number().int().min(1).max(10).optional(),
  moodAfter: z.number().int().min(1).max(10).optional(),
  trigger: z.string().optional(),
  note: z.string().optional(),
});
export type SubstanceUse = z.infer<typeof SubstanceUse>;

export const Hydration = z.object({
  ...base,
  kind: z.literal('hydration'),
  occurredAt,
  milliliters: z.number().int().min(0).optional(),
  note: z.string().optional(),
});
export type Hydration = z.infer<typeof Hydration>;

export const Exercise = z.object({
  ...base,
  kind: z.literal('exercise'),
  occurredAt,
  activity: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  note: z.string().optional(),
});
export type Exercise = z.infer<typeof Exercise>;

export const JournalEntry = z.object({
  ...base,
  kind: z.literal('journal'),
  journal: z.enum(['daily', 'sleep', 'cannabis', 'recovery']),
  occurredAt,
  body: z.string().default(''),
  mood: z.number().int().min(1).max(10).optional(),
  energy: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string()).default([]),
});
export type JournalEntry = z.infer<typeof JournalEntry>;

/** Discriminated union of everything loggable so far. */
export const LogRecord = z.discriminatedUnion('kind', [
  SleepEntry, MedicationAdherence, SubstanceUse, Hydration, Exercise, JournalEntry,
]);
export type LogRecord = z.infer<typeof LogRecord>;
export type LogKind = LogRecord['kind'];
