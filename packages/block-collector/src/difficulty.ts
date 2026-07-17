import { BOARD_SIZE, EMPTY_BOARD, getValidPlacements, place, type Board } from './board.js';

export type Pattern = 'scattered_singles' | 'small_clusters' | 'row_heavy' | 'row_heavy_dense';

export interface DifficultyPreset {
  fillPct: number;
  pattern: Pattern;
}

export const DIFFICULTY_PRESETS: Record<'easy' | 'medium' | 'hard' | 'expert', DifficultyPreset> = {
  easy: { fillPct: 0.1, pattern: 'scattered_singles' },
  medium: { fillPct: 0.2, pattern: 'small_clusters' },
  hard: { fillPct: 0.35, pattern: 'row_heavy' },
  expert: { fillPct: 0.5, pattern: 'row_heavy_dense' },
};

export type Rng = () => number; // uniform in [0, 1)

const randInt = (rng: Rng, max: number) => Math.floor(rng() * max);

function countSet(board: Board): number {
  let n = 0;
  for (const row of board) n += popcount(row);
  return n;
}

function popcount(n: number): number {
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

function scatteredSingles(targetCount: number, rng: Rng): Board {
  let board = EMPTY_BOARD;
  let attempts = 0;
  while (countSet(board) < targetCount && attempts < targetCount * 20) {
    attempts++;
    const r = randInt(rng, BOARD_SIZE);
    const c = randInt(rng, BOARD_SIZE);
    if ((board[r]! & (1 << c)) === 0) board = place(board, [[0, 0]], r, c);
  }
  return board;
}

function smallClusters(targetCount: number, rng: Rng): Board {
  let board = EMPTY_BOARD;
  let attempts = 0;
  while (countSet(board) < targetCount && attempts < targetCount * 20) {
    attempts++;
    const r = randInt(rng, BOARD_SIZE - 1);
    const c = randInt(rng, BOARD_SIZE - 1);
    for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const rr = r + dr;
      const cc = c + dc;
      if ((board[rr]! & (1 << cc)) === 0) board = place(board, [[0, 0]], rr, cc);
    }
  }
  return board;
}

/** Fills whole rows/columns up to `perLineFill` cells (out of 8) so pre-filled cells constrain placement, not just density. */
function rowHeavy(targetCount: number, perLineFill: number, rng: Rng): Board {
  let board = EMPTY_BOARD;
  const rowOrder = shuffledIndices(BOARD_SIZE, rng);
  let i = 0;
  while (countSet(board) < targetCount && i < rowOrder.length * 4) {
    const r = rowOrder[i % rowOrder.length]!;
    const cols = shuffledIndices(BOARD_SIZE, rng).slice(0, perLineFill);
    for (const c of cols) {
      if (countSet(board) >= targetCount) break;
      if ((board[r]! & (1 << c)) === 0) board = place(board, [[0, 0]], r, c);
    }
    i++;
  }
  return board;
}

function shuffledIndices(n: number, rng: Rng): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function applyPattern(pattern: Pattern, fillPct: number, rng: Rng): Board {
  const targetCount = Math.round(BOARD_SIZE * BOARD_SIZE * fillPct);
  switch (pattern) {
    case 'scattered_singles':
      return scatteredSingles(targetCount, rng);
    case 'small_clusters':
      return smallClusters(targetCount, rng);
    case 'row_heavy':
      return rowHeavy(targetCount, 6, rng);
    case 'row_heavy_dense':
      return rowHeavy(targetCount, 7, rng);
  }
}

/** Minimum solvability bar: no line is already full (dead/auto-clear), and the single-cell shape has somewhere to go. */
export function isSolvable(board: Board): boolean {
  const FULL_ROW = (1 << BOARD_SIZE) - 1;
  if (board.some((row) => row === FULL_ROW)) return false;
  if (getValidPlacements(board, 'single').length === 0) return false;
  return true;
}

const defaultRng: Rng = Math.random;

export function generateBoard(
  preset: DifficultyPreset,
  rng: Rng = defaultRng,
  maxAttempts = 500,
): Board {
  for (let i = 0; i < maxAttempts; i++) {
    const board = applyPattern(preset.pattern, preset.fillPct, rng);
    if (isSolvable(board)) return board;
  }
  throw new Error(`Could not generate a solvable board for pattern "${preset.pattern}"`);
}
