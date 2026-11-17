import type { Move } from "chess.js";
import { DEFAULT_POSITION } from "chess.js";
import type { PlayerColor } from "../types/game.types";

export type MaterialPiece = "p" | "n" | "b" | "r" | "q";

/** Smallest first, the order the material difference is shown in */
export const MATERIAL_PIECES: readonly MaterialPiece[] = ["p", "n", "b", "r", "q"];

export const PIECE_VALUES: Readonly<Record<MaterialPiece, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const PIECE_SYMBOLS = new Set<string>(MATERIAL_PIECES);

export interface SideMaterial {
  /**
   * Pieces this side has more of on the board than the opponent, by type
   * (types with none left out): what it has taken, net of what it lost, as
   * on Lichess. A knight taken by each side cancels out, and a promoted
   * piece counts as one more of its kind.
   */
  pieces: Partial<Record<MaterialPiece, number>>;
  /** Points this side is ahead on the board; 0 when level or behind */
  advantage: number;
}

type Counts = Record<MaterialPiece, number>;

const emptyCounts = (): Counts => ({ p: 0, n: 0, b: 0, r: 0, q: 0 });

/** Of each type, how many more `own` has than `other` (types with none left out). */
const surplus = (own: Counts, other: Counts): SideMaterial["pieces"] => {
  const more: SideMaterial["pieces"] = {};
  for (const piece of MATERIAL_PIECES) {
    const extra = own[piece] - other[piece];
    if (extra > 0) more[piece] = extra;
  }
  return more;
};

const points = (counts: Counts) =>
  MATERIAL_PIECES.reduce((sum, piece) => sum + counts[piece] * PIECE_VALUES[piece], 0);

/**
 * The material difference between the two sides, from a FEN: the pieces
 * each side is up and by how many points. Only the piece placement is read.
 */
export function getMaterial(fen: string): Record<PlayerColor, SideMaterial> {
  const white = emptyCounts();
  const black = emptyCounts();
  const placement = fen.split(" ", 1)[0];
  for (const char of placement) {
    const lower = char.toLowerCase();
    if (!PIECE_SYMBOLS.has(lower)) continue;
    const counts = char === lower ? black : white;
    counts[lower as MaterialPiece] += 1;
  }

  const diff = points(white) - points(black);
  return {
    white: { pieces: surplus(white, black), advantage: Math.max(0, diff) },
    black: { pieces: surplus(black, white), advantage: Math.max(0, -diff) },
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
