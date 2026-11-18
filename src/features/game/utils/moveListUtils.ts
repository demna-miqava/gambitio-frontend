/**
 * Gets the move number from a move index (0-based index to 1-based move number)
 */
export function getMoveNumber(index: number): number {
  return Math.floor(index / 2) + 1;
}

/**
 * Generic move pair interface for grouping moves
 */
export interface MovePair<T> {
  moveNumber: number;
  white: T | null;
  black: T | null;
}

/**
 * Groups moves into pairs (white/black) for display
 * Works with any move type by using a generic
 *
 * `startPly`: half-moves played before the first of `moves` (a position set
 * up mid-game). With an odd one the first pair has only black's move.
 */
export function groupMovesIntoPairs<T>(moves: T[], startPly = 0): MovePair<T>[] {
  const pairs: MovePair<T>[] = [];

  // Index of the first white move in `moves`: -1 when black moves first
  for (let i = -(startPly % 2); i < moves.length; i += 2) {
    pairs.push({
      moveNumber: getMoveNumber(startPly + i),
      white: moves[i] ?? null,
      black: moves[i + 1] ?? null,
    });
  }

  return pairs;
}

/**
 * Half-moves before a FEN's position, from its move number and side to move
 * ("… b - - 0 6" is 11): where a move list starting there is numbered from
 */
export function startPlyOfFen(fen: string): number {
  const fields = fen.trim().split(/\s+/);
  const fullmove = Number(fields[5]);
  const base = Number.isInteger(fullmove) && fullmove > 0 ? (fullmove - 1) * 2 : 0;
  return base + (fields[1] === "b" ? 1 : 0);
}
