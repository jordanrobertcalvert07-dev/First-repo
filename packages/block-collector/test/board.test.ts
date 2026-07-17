import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_BOARD,
  fits,
  place,
  isEmptyBoard,
  getValidPlacements,
} from '../src/index.js';

test('fits rejects out-of-bounds and overlapping placements', () => {
  const domino = [[0, 0], [0, 1]] as const;
  assert.ok(fits(EMPTY_BOARD, domino, 0, 0));
  assert.ok(!fits(EMPTY_BOARD, domino, 0, 7)); // runs off the right edge
  assert.ok(!fits(EMPTY_BOARD, domino, -1, 0)); // above the board

  const board = place(EMPTY_BOARD, domino, 0, 0);
  assert.ok(!fits(board, domino, 0, 0)); // overlap
  assert.ok(fits(board, domino, 1, 0));
});

test('place sets bits without mutating the input board', () => {
  const before = EMPTY_BOARD;
  const after = place(before, [[0, 0]], 3, 4);
  assert.ok(isEmptyBoard(before));
  assert.equal(after[3], 1 << 4);
});

test('a fully occupied board has no valid single-cell placements', () => {
  const full = Array(8).fill(0xff);
  assert.equal(getValidPlacements(full, 'single').length, 0);
});

test('an empty board has 64 valid single-cell placements, one per cell', () => {
  assert.equal(getValidPlacements(EMPTY_BOARD, 'single').length, 64);
});
