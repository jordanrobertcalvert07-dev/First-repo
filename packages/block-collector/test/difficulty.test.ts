import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_PRESETS, generateBoard, isSolvable } from '../src/index.js';

function seededRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

test('generateBoard always returns a solvable board for every preset', () => {
  for (const preset of Object.values(DIFFICULTY_PRESETS)) {
    const board = generateBoard(preset, seededRng(42));
    assert.ok(isSolvable(board));
  }
});

test('isSolvable rejects a board with an already-full row', () => {
  const board = Array(8).fill(0);
  board[0] = 0xff;
  assert.equal(isSolvable(board), false);
});

test('isSolvable rejects a completely full board', () => {
  const board = Array(8).fill(0xff);
  assert.equal(isSolvable(board), false);
});

test('harder presets fill more of the board on average', () => {
  const popcount = (n: number) => n.toString(2).split('1').length - 1;
  const density = (board: readonly number[]) => board.reduce((sum, row) => sum + popcount(row), 0);

  const easy = generateBoard(DIFFICULTY_PRESETS.easy, seededRng(1));
  const expert = generateBoard(DIFFICULTY_PRESETS.expert, seededRng(1));
  assert.ok(density(expert) > density(easy));
});
