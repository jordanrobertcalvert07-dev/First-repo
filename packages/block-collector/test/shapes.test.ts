import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPE_IDS, SHAPES, SIZE, getRotations, generateRotations } from '../src/index.js';

test('28 shapes are defined', () => {
  assert.equal(SHAPE_IDS.length, 28);
});

test('SIZE matches cell count, sq3 is a 9-cell block', () => {
  assert.equal(SIZE.single, 1);
  assert.equal(SIZE.domino, 2);
  assert.equal(SIZE.sq3, 9);
  for (const id of SHAPE_IDS) assert.equal(SIZE[id], SHAPES[id].length);
});

test('symmetric pieces collapse to one unique rotation', () => {
  assert.equal(getRotations('tet_O').length, 1);
  assert.equal(getRotations('sq3').length, 1);
});

test('asymmetric pieces have 4 rotations, I-pieces have 2', () => {
  assert.equal(getRotations('tet_L').length, 4);
  assert.equal(getRotations('tri_I').length, 2);
  assert.equal(getRotations('tet_I').length, 2);
});

test('rotations are normalized to a non-negative bounding box', () => {
  for (const id of SHAPE_IDS) {
    for (const rotation of getRotations(id)) {
      for (const [r, c] of rotation) assert.ok(r >= 0 && c >= 0);
    }
  }
});

test('domino rotates from horizontal to vertical', () => {
  const rotations = generateRotations(SHAPES.domino);
  assert.deepEqual(rotations, [
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],
  ]);
});
