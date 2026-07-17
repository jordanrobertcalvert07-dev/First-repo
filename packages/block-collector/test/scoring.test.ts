import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rewardAmount,
  onLineClear,
  consumePiece,
  checkWin,
  createDefaultInventory,
  createDefaultTargets,
} from '../src/index.js';

test('reward curve: single clears breakeven, multi-line clears jackpot', () => {
  assert.equal(rewardAmount(1), 1);
  assert.equal(rewardAmount(2), 4);
  assert.equal(rewardAmount(3), 6);
  assert.equal(rewardAmount(4), 8);
});

test('onLineClear credits the placed shape while under target', () => {
  const inventory = createDefaultInventory();
  const targets = createDefaultTargets();
  onLineClear('domino', 2, inventory, targets);
  assert.equal(inventory.domino, 10 + 4);
});

test('onLineClear redirects to the neediest shape once the placed shape is maxed', () => {
  const inventory = createDefaultInventory();
  const targets = createDefaultTargets();
  inventory.domino = targets.domino; // maxed
  inventory.single = 0; // will be floored to 1 elsewhere, but simulate "furthest behind"
  onLineClear('domino', 2, inventory, targets);
  assert.equal(inventory.domino, targets.domino); // no self-credit once maxed
  assert.equal(inventory.single, 4); // redirected to the shape furthest behind target
});

test('consumePiece never lets a shape hit zero', () => {
  const inventory = createDefaultInventory();
  inventory.single = 1;
  consumePiece(inventory, 'single');
  assert.equal(inventory.single, 1);
});

test('checkWin requires every shape at or above its target', () => {
  const targets = createDefaultTargets();
  const inventory = createDefaultInventory();
  assert.equal(checkWin(inventory, targets), false);
  for (const shape of Object.keys(targets) as (keyof typeof targets)[]) {
    inventory[shape] = targets[shape];
  }
  assert.equal(checkWin(inventory, targets), true);
});
