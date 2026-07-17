import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_BOARD,
  createDefaultInventory,
  createDefaultTargets,
  takeTurn,
  type GameState,
} from '../src/index.js';

function freshState(): GameState {
  return { board: EMPTY_BOARD, inventory: createDefaultInventory(), points: 0 };
}

test('rejects placing a shape with zero inventory', () => {
  const state = freshState();
  state.inventory.single = 0;
  const result = takeTurn(state, { shape: 'single', rotationIndex: 0, r0: 0, c0: 0 }, createDefaultTargets());
  assert.equal(result.accepted, false);
  assert.equal(result.state, state);
});

test('rejects a placement that does not fit', () => {
  const state = freshState();
  const result = takeTurn(state, { shape: 'single', rotationIndex: 0, r0: 9, c0: 9 }, createDefaultTargets());
  assert.equal(result.accepted, false);
});

test('accepted placement scores points and consumes inventory', () => {
  const state = freshState();
  const result = takeTurn(state, { shape: 'domino', rotationIndex: 0, r0: 0, c0: 0 }, createDefaultTargets());
  assert.equal(result.accepted, true);
  assert.equal(result.state.points, 2);
  assert.equal(result.state.inventory.domino, 9);
  assert.equal(result.linesCleared, 0);
});

test('a full-board clear grants the 500-point bonus and restocks every shape', () => {
  const targets = createDefaultTargets();
  // fill every row except row 0 with a single 8-cell gap-free run, and pack row 0
  // to 7 cells so the final domino both completes row 0 and clears the whole board
  let board = Array(8).fill(0xff);
  board[0] = 0b00111111; // last 2 cells of row 0 open
  const state: GameState = { board, inventory: createDefaultInventory(), points: 0 };

  const result = takeTurn(state, { shape: 'domino', rotationIndex: 0, r0: 0, c0: 6 }, targets);
  assert.equal(result.accepted, true);
  assert.equal(result.fullBoardClear, true);
  assert.equal(result.state.points, 2 /* domino placement */ + 500);
  for (const shape of Object.keys(targets) as (keyof typeof targets)[]) {
    // started at 10, minus 1 consumed, plus line-clear reward (redirected or self),
    // plus the unconditional +5 full-board restock
    assert.ok(result.state.inventory[shape] >= 10 - 1 + 5);
  }
});

test('winning is detected once every shape reaches its target', () => {
  const targets = createDefaultTargets();
  const inventory = createDefaultInventory();
  for (const shape of Object.keys(targets) as (keyof typeof targets)[]) {
    inventory[shape] = targets[shape] + 1; // headroom: placing consumes one of `single`
  }
  const state: GameState = { board: EMPTY_BOARD, inventory, points: 0 };
  const result = takeTurn(state, { shape: 'single', rotationIndex: 0, r0: 0, c0: 0 }, targets);
  assert.equal(result.won, true);
});
