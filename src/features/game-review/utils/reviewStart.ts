import type { MoveReview, Side } from "../types";

/**
 * Where to take the player once a review is done: the position after their
 * first mistake or blunder, else after their first inaccuracy. Null when
 * they made none (stay where you are). Without a side, either player's
 * moves count.
 *
 * Returns a position index (0 = start, n = after move n).
 */
export function firstReviewMoment(moves: MoveReview[], side?: Side): number | null {
  const own = side ? moves.filter((m) => m.side === side) : moves;
  const serious = own.find((m) => m.classification === "mistake" || m.classification === "blunder");
  const pick = serious ?? own.find((m) => m.classification === "inaccuracy");
  return pick ? pick.index + 1 : null;
}
