import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mix, luminance, computeTheme, deriveText, getSunMoment, classifyPhase,
  parseUtterance, HeuristicCaptureEngine, SleepEntry,
} from '../src/index';

const NYC = { lat: 40.71, lon: -74.01 };

test('mix interpolates and stays within gamut', () => {
  assert.equal(mix('#000000', '#ffffff', 0), '#000000');
  assert.equal(mix('#000000', '#ffffff', 1), '#ffffff');
  const midL = luminance(mix('#000000', '#ffffff', 0.5));
  assert.ok(midL > 0.1 && midL < 0.9);
});

test('deriveText keeps contrast on both extremes', () => {
  // dark surface -> light ink; light surface -> dark ink
  assert.ok(luminance(deriveText('#16131d').text) > 0.6);
  assert.ok(luminance(deriveText('#fffbf6').text) < 0.2);
});

test('phase classifier splits morning and evening', () => {
  assert.equal(classifyPhase(3, true), 'goldenMorning');
  assert.equal(classifyPhase(3, false), 'goldenEvening');
  assert.equal(classifyPhase(40, true), 'day');
  assert.equal(classifyPhase(-20, false), 'night');
});

test('computeTheme returns legible, resolved colors', () => {
  const noon = computeTheme(new Date('2026-07-15T16:00:00Z'), NYC);
  assert.match(noon.surface, /^#[0-9a-f]{6}$/);
  assert.ok(noon.text && noon.onPrimary);
  // lockNight forces the calm night theme regardless of the sun
  const locked = computeTheme(new Date('2026-07-15T16:00:00Z'), NYC, { lockNight: true });
  assert.equal(locked.phase, 'night');
  assert.equal(locked.isDay, false);
});

test('getSunMoment agrees with itself on day/night', () => {
  const m = getSunMoment(new Date('2026-07-15T16:00:00Z'), NYC); // ~noon EDT
  assert.equal(m.isDay, true);
});

test('parseUtterance files a multi-section utterance', () => {
  const p = parseUtterance('slept about five hours, woke up twice, weird dreams, took my meds around eight, smoked around ten');
  const sections = p.map((x) => x.section);
  assert.ok(sections.includes('Sleep journal'));
  assert.ok(sections.includes('Medication log'));
  assert.ok(sections.includes('Cannabis log'));
});

test('capture engine falls back to an unfiled idea', async () => {
  const r = await new HeuristicCaptureEngine().propose('remember to call the pharmacy', { now: new Date() });
  assert.equal(r.proposals[0]?.section, 'Ideas inbox');
});

test('SleepEntry schema validates a well-formed record', () => {
  const rec = SleepEntry.parse({
    id: '11111111-1111-4111-8111-111111111111',
    createdAt: 1, updatedAt: 1, deviceId: 'dev-1',
    kind: 'sleep', occurredAt: 1, durationMinutes: 300, awakenings: 2, flags: ['vividDream'],
  });
  assert.equal(rec.durationMinutes, 300);
});
