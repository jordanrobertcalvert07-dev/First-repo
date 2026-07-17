import type { ShapeId } from './shapes.js';

export type Inventory = Record<ShapeId, number>;
export type Targets = Record<ShapeId, number>;

export const FULL_BOARD_CLEAR_BONUS = 500;
export const FULL_BOARD_CLEAR_RESTOCK = 5;

/** n=1 is breakeven (costs 1 to place, refunds 1); multi-line clears keep the jackpot curve. */
export function rewardAmount(linesCleared: number): number {
  return linesCleared === 1 ? 1 : 2 * linesCleared;
}

function neediestShape(inventory: Inventory, targets: Targets): ShapeId {
  let best: ShapeId | undefined;
  let bestGap = Infinity;
  for (const shape of Object.keys(targets) as ShapeId[]) {
    const gap = inventory[shape] - targets[shape];
    if (gap < bestGap) {
      bestGap = gap;
      best = shape;
    }
  }
  return best!;
}

/** Mutates `inventory` in place: credits the placed shape, or redirects to the neediest shape once it's maxed. */
export function onLineClear(
  placedShape: ShapeId,
  linesCleared: number,
  inventory: Inventory,
  targets: Targets,
): void {
  const reward = rewardAmount(linesCleared);
  const creditedShape =
    inventory[placedShape] < targets[placedShape] ? placedShape : neediestShape(inventory, targets);
  inventory[creditedShape] += reward;
}

/** Never let a shape hit true zero — a shape whose geometry is the only fit for a packed board would deadlock. */
export function consumePiece(inventory: Inventory, shape: ShapeId): void {
  inventory[shape] -= 1;
  if (inventory[shape] === 0) inventory[shape] = 1;
}

export function checkWin(inventory: Inventory, targets: Targets): boolean {
  return (Object.keys(targets) as ShapeId[]).every((shape) => inventory[shape] >= targets[shape]);
}
