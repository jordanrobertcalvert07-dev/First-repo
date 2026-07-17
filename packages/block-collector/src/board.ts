/**
 * 8x8 board as 8 row-integers (bit c set = cell occupied). Bitwise checks are
 * far cheaper than a 2D bool array when testing many candidate placements a turn.
 */

import type { Cell, ShapeId } from './shapes.js';
import { getRotations } from './shapes.js';

export const BOARD_SIZE = 8;
export type Board = readonly number[];

export const EMPTY_BOARD: Board = Array(BOARD_SIZE).fill(0);

export function isEmptyBoard(board: Board): boolean {
  return board.every((row) => row === 0);
}

export function fits(board: Board, cells: readonly Cell[], r0: number, c0: number): boolean {
  for (const [dr, dc] of cells) {
    const r = r0 + dr;
    const c = c0 + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if ((board[r]! & (1 << c)) !== 0) return false;
  }
  return true;
}

export function place(board: Board, cells: readonly Cell[], r0: number, c0: number): Board {
  const next = board.slice();
  for (const [dr, dc] of cells) {
    const r = r0 + dr;
    const c = c0 + dc;
    next[r] = next[r]! | (1 << c);
  }
  return next;
}

export interface Placement {
  rotationIndex: number;
  r0: number;
  c0: number;
}

export function getValidPlacements(board: Board, shape: ShapeId): Placement[] {
  const rotations = getRotations(shape);
  const placements: Placement[] = [];
  rotations.forEach((cells, rotationIndex) => {
    for (let r0 = 0; r0 < BOARD_SIZE; r0++) {
      for (let c0 = 0; c0 < BOARD_SIZE; c0++) {
        if (fits(board, cells, r0, c0)) placements.push({ rotationIndex, r0, c0 });
      }
    }
  });
  return placements;
}
