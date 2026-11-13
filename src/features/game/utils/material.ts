import type { Move } from "chess.js";
import { DEFAULT_POSITION } from "chess.js";
import type { PlayerColor } from "../types/game.types";

export type MaterialPiece = "p" | "n" | "b" | "r" | "q";

/** Smallest first, the order captured pieces are shown in */
export const MATERIAL_PIECES: readonly MaterialPiece[] = ["p", "n", "b", "r", "q"];

export const PIECE_VALUES: Readonly<Record<MaterialPiece, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const START_COUNTS: Readonly<Record<MaterialPiece, number>> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

export interface SideMaterial {
  /** Opponent pieces this side has taken, by type (types with none left out) */
  captured: Partial<Record<MaterialPiece, number>>;
  /** Points this side is ahead on the board; 0 when level or behind */
  advantage: number;
}

type Counts = Record<MaterialPiece, number>;

const emptyCounts = (): Counts => ({ p: 0, n: 0, b: 0, r: 0, q: 0 });

/**
 * Pieces of `counts`' side that are gone from the board. A promoted pawn
 * shows up as an extra piece above the starting count, so it's taken off the
 * missing pawns rather than counted as a capture.
 */
const missingPieces = (counts: Counts): SideMaterial["captured"] => {
  const missing: SideMaterial["captured"] = {};
  let promoted = 0;
  for (const piece of MATERIAL_PIECES) {
    if (piece === "p") continue;
    promoted += Math.max(0, counts[piece] - START_COUNTS[piece]);
    const gone = START_COUNTS[piece] - counts[piece];
    if (gone > 0) missing[piece] = gone;
  }
  const pawnsGone = START_COUNTS.p - counts.p - promoted;
  if (pawnsGone > 0) missing.p = pawnsGone;
  return missing;
};

const points = (counts: Counts) =>
  MATERIAL_PIECES.reduce((sum, piece) => sum + counts[piece] * PIECE_VALUES[piece], 0);

/**
 * What each side has captured and who is ahead in material, from a FEN.
 * Only the piece placement is read.
 */
export function getMaterial(fen: string): Record<PlayerColor, SideMaterial> {
  const white = emptyCounts();
  const black = emptyCounts();
  const placement = fen.split(" ", 1)[0];
  for (const char of placement) {
    const lower = char.toLowerCase();
    if (!(lower in START_COUNTS)) continue;
    const counts = char === lower ? black : white;
    counts[lower as MaterialPiece] += 1;
  }

  const diff = points(white) - points(black);
  return {
    white: { captured: missingPieces(black), advantage: Math.max(0, diff) },
    black: { captured: missingPieces(white), advantage: Math.max(0, -diff) },
  };
}

/**
 * The positions from the start of a game up to the one after `count` moves:
 * the line a move list is showing, as FENs.
 */
export function positionsAlong(moves: readonly Move[], count = moves.length): string[] {
  const start = moves[0]?.before ?? DEFAULT_POSITION;
  return [start, ...moves.slice(0, count).map((move) => move.after)];
}
