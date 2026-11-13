import type { ProfileStatusResponse } from "@/services/user";
import type { PuzzleAttemptResult } from "../types/puzzle.types";

/** "+12", "−8" (minus sign), "±0". */
export const formatRatingChange = (change: number): string =>
  change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : "±0";

/** Cached /users/status after a rated attempt (unchanged if not loaded). */
export const withPuzzleRating = (
  status: ProfileStatusResponse | undefined,
  result: Pick<PuzzleAttemptResult, "puzzleRating" | "highestPuzzleRating">
): ProfileStatusResponse | undefined =>
  status?.user
    ? {
        ...status,
        user: {
          ...status.user,
          puzzleRating: result.puzzleRating,
          highestPuzzleRating: result.highestPuzzleRating,
        },
      }
    : status;
