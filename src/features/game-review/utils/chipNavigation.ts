import type { MoveClassification, MoveReview, Side } from "../types";

/** The classifications the summary counts (and its chips jump between) */
export type FlaggedClassification = Extract<MoveClassification, "inaccuracy" | "mistake" | "blunder">;

/**
 * Position index (1 = after the first move) of `side`'s next move judged
 * `classification` after the position on the board, wrapping around to the
 * first one. From a variation (`currentIndex` -1) or the start, that's the
 * first one. Null when the side has none.
 */
export function nextMoveOfType(
  moves: MoveReview[],
  side: Side,
  classification: FlaggedClassification,
  currentIndex: number
): number | null {
  const positions = moves
    .filter((move) => move.side === side && move.classification === classification)
    .map((move) => move.index + 1);
  if (positions.length === 0) return null;
  return positions.find((position) => position > currentIndex) ?? positions[0]!;
}
