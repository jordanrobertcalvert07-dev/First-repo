/**
 * The 28 shape geometries. Each is a canonical set of (row, col) offsets;
 * rotations are derived and cached at module load, not stored separately.
 */

export type Cell = readonly [number, number];
export type ShapeId = keyof typeof SHAPES;

function sq3Cells(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([r, c]);
  return cells;
}

export const SHAPES = {
  single: [[0, 0]],
  domino: [[0, 0], [0, 1]],
  tri_I: [[0, 0], [0, 1], [0, 2]],
  tri_L: [[0, 0], [1, 0], [1, 1]],
  tet_I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  tet_O: [[0, 0], [0, 1], [1, 0], [1, 1]],
  tet_L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  tet_J: [[0, 1], [1, 1], [2, 1], [2, 0]],
  tet_S: [[0, 1], [0, 2], [1, 0], [1, 1]],
  tet_Z: [[0, 0], [0, 1], [1, 1], [1, 2]],
  tet_T: [[0, 0], [0, 1], [0, 2], [1, 1]],
  pent_I: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  pent_L: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  pent_N: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]],
  pent_P: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  pent_T: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  pent_U: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  pent_V: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  pent_X: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  hex_rect2x3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  hex_L: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]],
  hex_T: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [3, 1]],
  hex_S: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]],
  sept_L: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2]],
  sept_plus: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1], [4, 1]],
  oct_rect2x4: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [1, 3]],
  oct_L: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3]],
  sq3: sq3Cells(),
} satisfies Record<string, Cell[]>;

export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

export const SIZE: Record<ShapeId, number> = Object.fromEntries(
  SHAPE_IDS.map((id) => [id, SHAPES[id].length]),
) as Record<ShapeId, number>;

export const STARTING_INVENTORY = 10;
export const TARGET_INVENTORY = 100;

export function createDefaultInventory(): Record<ShapeId, number> {
  return Object.fromEntries(SHAPE_IDS.map((id) => [id, STARTING_INVENTORY])) as Record<
    ShapeId,
    number
  >;
}

export function createDefaultTargets(): Record<ShapeId, number> {
  return Object.fromEntries(SHAPE_IDS.map((id) => [id, TARGET_INVENTORY])) as Record<
    ShapeId,
    number
  >;
}

function normalize(cells: Cell[]): Cell[] {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([r, c]): Cell => [r - minR, c - minC])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function rotate90([r, c]: Cell): Cell {
  return [c, -r];
}

function key(cells: Cell[]): string {
  return cells.map(([r, c]) => `${r},${c}`).join('|');
}

export function generateRotations(cells: readonly Cell[]): Cell[][] {
  const rotations: Cell[][] = [];
  const seen = new Set<string>();
  let current = normalize(cells.slice());
  for (let i = 0; i < 4; i++) {
    const k = key(current);
    if (!seen.has(k)) {
      seen.add(k);
      rotations.push(current);
    }
    current = normalize(current.map(rotate90));
  }
  return rotations;
}

const rotationCache = new Map<ShapeId, Cell[][]>(
  SHAPE_IDS.map((id) => [id, generateRotations(SHAPES[id])]),
);

export function getRotations(shape: ShapeId): Cell[][] {
  const rotations = rotationCache.get(shape);
  if (!rotations) throw new Error(`Unknown shape: ${shape}`);
  return rotations;
}
