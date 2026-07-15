/**
 * AI capture contract.
 *
 * The flow is always: utterance -> proposals -> the user reviews an editable diff ->
 * commit. Nothing is ever written silently. This file defines that contract plus a
 * dependency-free heuristic engine used offline and as a fallback. The Anthropic
 * tool-use engine (Phase 2) implements the same `CaptureEngine` interface, with the
 * key held in the OS keychain and a hard toggle to keep the medical profile out of
 * any request. (See docs/STACK.md.)
 */

import type { LogKind } from './schema';

export interface CaptureField {
  key: string;
  label: string;
  value: string;
}

export interface CaptureProposal {
  /** Display name of the target section, e.g. "Sleep journal". */
  section: string;
  kind: LogKind | 'idea';
  /** Icon token for the UI to render. */
  icon: string;
  note?: string;
  fields: CaptureField[];
}

export interface CaptureResult {
  proposals: CaptureProposal[];
  /** Asked instead of guessing when the utterance is genuinely ambiguous. */
  clarifyingQuestion?: string;
}

export interface CaptureContext {
  now: Date;
}

export interface CaptureEngine {
  propose(utterance: string, ctx: CaptureContext): Promise<CaptureResult>;
}

const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  once: 1, twice: 2,
};

function fmtTime(h24: number, min: number): string {
  const ap = h24 < 12 ? 'AM' : 'PM';
  let hh = h24 % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${String(min).padStart(2, '0')} ${ap}`;
}

/** Resolve a spoken clock reference to a 12h label, inferring PM for evening words. */
function resolveTime(h: string, m: string | undefined, ap: string | undefined, ctx: string): string {
  let hour = parseInt(h, 10);
  if (ap === 'pm' && hour < 12) hour += 12;
  else if (ap === 'am' && hour === 12) hour = 0;
  else if (!ap && hour < 12 && /night|evening|smoked|bed|dinner/.test(ctx)) hour += 12;
  return fmtTime(hour % 24, m ? parseInt(m, 10) : 0);
}

/**
 * Heuristic parser. Keyword/regex based — good enough to drive the review UI offline.
 * Deliberately conservative: it proposes, the user disposes.
 */
export function parseUtterance(text: string): CaptureProposal[] {
  const t = text.toLowerCase();
  const out: CaptureProposal[] = [];

  if (/slept|sleep|hours|woke|dream|nightmare|rest/.test(t)) {
    const hrs = t.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|h\b)/) ?? t.match(/slept (?:about |around |~)?(\w+)/);
    const dur = hrs ? String(WORD_NUM[hrs[1]!] ?? hrs[1]) : '';
    const wake = t.match(/woke (?:up )?(\w+)/)?.[1];
    const wakeN = wake ? String(WORD_NUM[wake] ?? wake) : '';
    const fields: CaptureField[] = [];
    if (dur) fields.push({ key: 'durationMinutes', label: 'Duration', value: `${dur} h` });
    if (wakeN) fields.push({ key: 'awakenings', label: 'Awakenings', value: wakeN });
    if (/dream/.test(t)) fields.push({ key: 'dreams', label: 'Dreams', value: /weird|vivid|strange/.test(t) ? 'vivid / weird' : 'yes' });
    const flag = t.match(/nightmare|night terror|sleep paralysis/)?.[0];
    if (flag) fields.push({ key: 'flags', label: 'Flags', value: flag });
    fields.push({ key: 'feltOnWaking', label: 'Felt on waking', value: '' });
    out.push({ section: 'Sleep journal', kind: 'journal', icon: 'moon', note: 'reflective entry', fields });
  }

  if (/meds|medication|took|pill|prazosin|concerta|mirtazapine|pregabalin|methadone/.test(t)) {
    const m = t.match(/(?:meds|medication|them|took)[^.]*?(?:around |about |at |~)(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    out.push({
      section: 'Medication log', kind: 'medicationAdherence', icon: 'pill', note: 'adherence',
      fields: [
        { key: 'label', label: 'What', value: 'Evening medication' },
        { key: 'occurredAt', label: 'Time', value: m ? resolveTime(m[1]!, m[2], m[3], t) : '' },
        { key: 'taken', label: 'Taken', value: 'yes' },
      ],
    });
  }

  if (/smoked|weed|cannabis|joint|vape|bowl/.test(t)) {
    const m = t.match(/(?:smoked|weed|cannabis)[^.]*?(?:around |about |at |~)(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    out.push({
      section: 'Cannabis log', kind: 'substanceUse', icon: 'leaf', note: 'data point · neutral',
      fields: [
        { key: 'occurredAt', label: 'Time', value: m ? resolveTime(m[1]!, m[2], m[3], t) : '' },
        { key: 'method', label: 'Method', value: '' },
        { key: 'amount', label: 'Amount', value: '' },
        { key: 'context', label: 'Context', value: 'evening' },
      ],
    });
  }

  if (/walk|ran|run|jog|gym|workout|exercise|steps/.test(t)) {
    const mins = t.match(/(\d+)\s*(?:min|minute)/)?.[1];
    out.push({
      section: 'Exercise', kind: 'exercise', icon: 'run', note: 'activity',
      fields: [
        { key: 'activity', label: 'Type', value: /walk/.test(t) ? 'walk' : /run|jog|ran/.test(t) ? 'run' : 'workout' },
        { key: 'durationMinutes', label: 'Duration', value: mins ? `${mins} min` : '' },
      ],
    });
  }

  if (/water|hydrat|litre|liter|\dl\b|ml/.test(t)) {
    const l = t.match(/(\d+(?:\.\d+)?)\s*(?:l|litre|liter)/)?.[1];
    const ml = t.match(/(\d+)\s*ml/)?.[1];
    out.push({
      section: 'Hydration', kind: 'hydration', icon: 'drop', note: 'intake',
      fields: [{ key: 'milliliters', label: 'Amount', value: l ? `${l} L` : ml ? `${ml} ml` : '' }],
    });
  }

  if (/anxious|anxiety|mood|felt|sad|happy|calm|stressed|journal/.test(t)) {
    const mood = t.match(/mood (?:about |around |of |is )?(\d+)/)?.[1];
    const feeling = t.match(/anxious|anxiety|stressed|sad|calm|happy/)?.[0];
    const fields: CaptureField[] = [];
    if (feeling) fields.push({ key: 'feeling', label: 'Feeling', value: feeling });
    if (mood) fields.push({ key: 'mood', label: 'Mood', value: `${mood} / 10` });
    fields.push({ key: 'body', label: 'Note', value: text.length > 60 ? text.slice(0, 60) + '…' : text });
    out.push({ section: 'Daily journal', kind: 'journal', icon: 'pen', note: 'free entry', fields });
  }

  return out;
}

/** Offline engine. Falls back to a single unfiled idea when nothing else matches. */
export class HeuristicCaptureEngine implements CaptureEngine {
  async propose(utterance: string, _ctx: CaptureContext): Promise<CaptureResult> {
    const text = utterance.trim();
    if (!text) return { proposals: [] };
    const proposals = parseUtterance(text);
    if (proposals.length === 0) {
      return {
        proposals: [{
          section: 'Ideas inbox', kind: 'idea', icon: 'ideas', note: 'unfiled capture',
          fields: [{ key: 'body', label: 'Note', value: text }],
        }],
      };
    }
    return { proposals };
  }
}
