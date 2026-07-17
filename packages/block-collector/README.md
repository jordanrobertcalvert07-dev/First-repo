# @lifelike/block-collector

UI-agnostic engine for Block Collector: 28 shapes, an 8x8 board, line-clear
detection, the hybrid inventory reward system, a win condition, and a
difficulty/prefill board generator. No rendering, no persistence — just the
rules, so any UI (mobile, web, or a simulator) can drive it.

## Modules

- `shapes.ts` — the 28 shape geometries and their cached rotations.
- `board.ts` — bitboard representation, placement checks, valid-placement search.
- `lines.ts` — row/column clear detection.
- `scoring.ts` — reward curve, the maxed-shape redirect, the never-zero floor, win check.
- `difficulty.ts` — easy/medium/hard/expert prefill generation, retried until solvable.
- `game.ts` — `takeTurn`, the turn-loop assembly from the design doc.

## Tuning

`TARGET_INVENTORY` (100), starting inventory (10 per shape), and the prefill
presets in `difficulty.ts` are simulation-tested defaults, not fixed values —
see the design doc for the open tuning knobs (target size, whether 7/8/9-cell
shapes should start below 10, and prefill percentages per difficulty).

## Usage

```ts
import {
  createDefaultInventory, createDefaultTargets, EMPTY_BOARD, takeTurn,
} from '@lifelike/block-collector';

let state = { board: EMPTY_BOARD, inventory: createDefaultInventory(), points: 0 };
const targets = createDefaultTargets();

const result = takeTurn(state, { shape: 'domino', rotationIndex: 0, r0: 0, c0: 0 }, targets);
if (result.accepted) state = result.state;
```
