import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_BOARD, clearLines } from '../src/index.js';

test('clears a full row and leaves other rows untouched', () => {
  const board = EMPTY_BOARD.slice();
  board[3] = 0xff;
  board[4] = 0b1010;
  const { board: cleared, linesCleared } = clearLines(board);
  assert.equal(linesCleared, 1);
  assert.equal(cleared[3], 0);
  assert.equal(cleared[4], 0b1010);
});

test('clears a full column across all rows', () => {
  const board = Array(8).fill(0b00000001); // column 0 fully set
  const { board: cleared, linesCleared } = clearLines(board);
  assert.equal(linesCleared, 1);
  assert.ok(cleared.every((row) => row === 0));
});

test('counts simultaneous row and column clears', () => {
  const board = Array(8).fill(0).map((_, r) => (r === 2 ? 0xff : 0b00000001));
  const { linesCleared } = clearLines(board);
  assert.equal(linesCleared, 2); // row 2 + column 0
});

test('no-op when nothing is full', () => {
  const board = EMPTY_BOARD.slice();
  board[0] = 0b0001;
  const { board: cleared, linesCleared } = clearLines(board);
  assert.equal(linesCleared, 0);
  assert.deepEqual(cleared, board);
});
