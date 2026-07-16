/**
 * Anthropic-backed capture engine. Implements the same CaptureEngine contract as
 * the offline heuristic parser, but sends the utterance to Claude and gets back
 * structured, guaranteed-parseable proposals — so "smoked meth around ten" files
 * to the Meth log, not Cannabis, and it never invents entries that weren't said.
 *
 * The call goes directly from the device to the Anthropic API using the user's own
 * key (held in the OS keychain). There is no server of ours in the middle. This is
 * dormant until a key is set in Settings; without one the app uses the heuristic
 * engine. Structured Outputs (output_config.format) constrains the response to the
 * schema below. Model: claude-opus-4-8.
 */

import { Platform } from 'react-native';
import type {
  CaptureEngine, CaptureContext, CaptureResult, CaptureProposal, LogKind,
} from '@lifelike/core';

const SECTIONS = [
  'Sleep journal', 'Medication log',
  'Cannabis log', 'Nicotine log', 'Crack/cocaine log', 'Meth log',
  'Fentanyl log', 'LSD log', 'Mushrooms log', 'DMT log',
  'Exercise', 'Hydration', 'Daily journal', 'Ideas inbox',
] as const;
type Section = (typeof SECTIONS)[number];

const META: Record<Section, { icon: string; kind: LogKind | 'idea' }> = {
  'Sleep journal': { icon: 'moon', kind: 'sleep' },
  'Medication log': { icon: 'pill', kind: 'medicationAdherence' },
  'Cannabis log': { icon: 'leaf', kind: 'substanceUse' },
  'Nicotine log': { icon: 'substance', kind: 'substanceUse' },
  'Crack/cocaine log': { icon: 'substance', kind: 'substanceUse' },
  'Meth log': { icon: 'substance', kind: 'substanceUse' },
  'Fentanyl log': { icon: 'substance', kind: 'substanceUse' },
  'LSD log': { icon: 'substance', kind: 'substanceUse' },
  'Mushrooms log': { icon: 'substance', kind: 'substanceUse' },
  'DMT log': { icon: 'substance', kind: 'substanceUse' },
  'Exercise': { icon: 'run', kind: 'exercise' },
  'Hydration': { icon: 'drop', kind: 'hydration' },
  'Daily journal': { icon: 'pen', kind: 'journal' },
  'Ideas inbox': { icon: 'ideas', kind: 'idea' },
};

const SYSTEM = `You are the filing engine for LifeLike, a private, single-user life tracker. You turn one natural-language note about the user's day into structured log entries.

Rules:
- Only create entries for things the user actually said. Never invent an activity, time, or detail that isn't in the text (e.g. do not add a "run" unless they mention exercise).
- File each substance to its OWN section by the exact substance named. "smoked" is NOT automatically cannabis — cannabis, nicotine, crack/cocaine, meth, fentanyl are all commonly smoked. Read which substance the user names. If a substance is mentioned with no clear section match, use Ideas inbox rather than guessing wrong.
- Framing is strictly neutral and factual. This is data the user keeps for themselves. Never moralize, warn, praise, or editorialize. A logged substance use is a data point, nothing more.
- Resolve relative time ("last night", "this morning", "around eight") against the provided current date/time. Put times in a readable 12-hour form.
- Fields are short {key,label,value} triples appropriate to the section (e.g. Sleep: Duration, Awakenings, Dreams; Medication: What, Time, Taken; a substance: Time, Amount, Method, Context; Exercise: Type, Duration; Hydration: Amount; Daily journal: Feeling, Mood, Note). Leave value empty ("") if unknown rather than guessing.
- If the note is genuinely ambiguous about what happened, set clarifyingQuestion to a short question and return an empty proposals array. Otherwise clarifyingQuestion is null.

Return only the structured object.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          section: { type: 'string', enum: SECTIONS as unknown as string[] },
          note: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                value: { type: 'string' },
              },
              required: ['key', 'label', 'value'],
            },
          },
        },
        required: ['section', 'note', 'fields'],
      },
    },
    clarifyingQuestion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['proposals', 'clarifyingQuestion'],
};

interface RawProposal { section: string; note: string; fields: { key: string; label: string; value: string }[] }

export class AnthropicCaptureEngine implements CaptureEngine {
  constructor(private apiKey: string) {}

  async propose(utterance: string, ctx: CaptureContext): Promise<CaptureResult> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
    // Allow the direct browser call on the web build (user's own key, own device).
    if (Platform.OS === 'web') headers['anthropic-dangerous-direct-browser-access'] = 'true';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{
          role: 'user',
          content: `Current local date and time: ${ctx.now.toString()}.\n\nNote to file:\n"""${utterance}"""`,
        }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json() as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text) as { proposals: RawProposal[]; clarifyingQuestion: string | null };

    const proposals: CaptureProposal[] = (parsed.proposals ?? []).map((p) => {
      const meta = META[p.section as Section] ?? { icon: 'ideas', kind: 'idea' as const };
      return {
        section: (p.section in META ? p.section : 'Ideas inbox'),
        kind: meta.kind,
        icon: meta.icon,
        note: p.note,
        fields: p.fields ?? [],
      };
    });

    return { proposals, clarifyingQuestion: parsed.clarifyingQuestion ?? undefined };
  }
}
