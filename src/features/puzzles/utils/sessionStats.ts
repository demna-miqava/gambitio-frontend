import type { SessionStats } from "../types/puzzle.types";

export const EMPTY_SESSION_STATS: SessionStats = {
  solved: 0,
  failed: 0,
  streak: 0,
  lastPuzzleId: null,
};

/**
 * Counts one result per puzzle: the first. Solving a puzzle after Retry
 * doesn't turn its miss into a solve (as with the rating), so a later result
 * for the puzzle last counted is ignored. A miss ends the streak.
 */
export const recordSessionResult = (
  stats: SessionStats,
  puzzleId: string,
  success: boolean
): SessionStats => {
  if (stats.lastPuzzleId === puzzleId) return stats;
  return success
    ? { solved: stats.solved + 1, failed: stats.failed, streak: stats.streak + 1, lastPuzzleId: puzzleId }
    : { solved: stats.solved, failed: stats.failed + 1, streak: 0, lastPuzzleId: puzzleId };
};
