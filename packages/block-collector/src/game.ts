import { fits, place, type Board, isEmptyBoard } from './board.js';
import { clearLines } from './lines.js';
import { getRotations, SHAPE_IDS, SIZE, type ShapeId } from './shapes.js';
import {
  checkWin,
  consumePiece,
  FULL_BOARD_CLEAR_BONUS,
  FULL_BOARD_CLEAR_RESTOCK,
  onLineClear,
  type Inventory,
  type Targets,
} from './scoring.js';

export interface GameState {
  board: Board;
  inventory: Inventory;
  points: number;
}

export interface Move {
  shape: ShapeId;
  rotationIndex: number;
  r0: number;
  c0: number;
}

export interface TurnResult {
  accepted: boolean;
  state: GameState;
  linesCleared: number;
  fullBoardClear: boolean;
  won: boolean;
}

function rejected(state: GameState): TurnResult {
  return { accepted: false, state, linesCleared: 0, fullBoardClear: false, won: false };
}

export function takeTurn(state: GameState, move: Move, targets: Targets): TurnResult {
  const { shape, rotationIndex, r0, c0 } = move;
  if (state.inventory[shape] <= 0) return rejected(state);

  const cells = getRotations(shape)[rotationIndex];
  if (!cells || !fits(state.board, cells, r0, c0)) return rejected(state);

  const inventory = { ...state.inventory };
  consumePiece(inventory, shape);
  let points = state.points + SIZE[shape];
  let board = place(state.board, cells, r0, c0);

  const { board: clearedBoard, linesCleared } = clearLines(board);
  board = clearedBoard;

  let fullBoardClear = false;
  if (linesCleared > 0) {
    onLineClear(shape, linesCleared, inventory, targets);
    if (isEmptyBoard(board)) {
      for (const id of SHAPE_IDS) inventory[id] += FULL_BOARD_CLEAR_RESTOCK;
      points += FULL_BOARD_CLEAR_BONUS;
      fullBoardClear = true;
    }
  }

  const nextState: GameState = { board, inventory, points };
  return {
    accepted: true,
    state: nextState,
    linesCleared,
    fullBoardClear,
    won: checkWin(inventory, targets),
  };
}
