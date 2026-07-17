import { BOARD_SIZE, type Board } from './board.js';

const FULL_ROW = (1 << BOARD_SIZE) - 1; // 0xFF

export interface ClearResult {
  board: Board;
  linesCleared: number;
}

export function clearLines(board: Board): ClearResult {
  const fullRows: number[] = [];
  const fullCols: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r] === FULL_ROW) fullRows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => (row & (1 << c)) !== 0)) fullCols.push(c);
  }

  const linesCleared = fullRows.length + fullCols.length;
  if (linesCleared === 0) return { board, linesCleared };

  const rowSet = new Set(fullRows);
  const colMask = fullCols.reduce((mask, c) => mask | (1 << c), 0);
  const next = board.map((row, r) => (rowSet.has(r) ? 0 : row) & ~colMask);

  return { board: next, linesCleared };
}
