import { apiRequest } from "@/services";
import type {
  PuzzleCheckResult,
  PuzzleFeedMode,
  PuzzleResponse,
  PuzzleThemeCount,
} from "../types/puzzle.types";

export interface FetchPuzzlesOptions {
  /** The previous page's opaque nextCursor (null when there are no more). */
  cursor?: string;
  mode?: PuzzleFeedMode;
  theme?: string;
}

/** The days in a row, in the player's own time zone, with at least one puzzle solved */
export interface PuzzleStreak {
  days: number;
  /** False: the streak stands (it counts up to yesterday) but ends tonight without a solve */
  solvedToday: boolean;
}

/** This device's IANA time zone ("Europe/Berlin"); undefined where the browser doesn't say */
const timeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

export const puzzleService = {
  /** The puzzle streak, with days counted in this device's time zone (UTC without one) */
  fetchStreak: (): Promise<PuzzleStreak> => {
    const tz = timeZone();
    return apiRequest<PuzzleStreak>("get", "/puzzles/streak", { params: tz ? { tz } : {} });
  },

  /**
   * Unsolved puzzles ordered by rating. "ascending" starts from the easiest
   * (Rush / Survival); "rated" starts near the user's puzzle rating (Infinite).
   */
  fetchPuzzles: ({ cursor, mode = "ascending", theme }: FetchPuzzlesOptions = {}): Promise<PuzzleResponse> =>
    apiRequest<PuzzleResponse>("get", "/puzzles", {
      params: {
        limit: 5,
        mode,
        ...(cursor ? { cursor } : {}),
        ...(theme ? { theme } : {}),
      },
    }),

  /** Unrated modes: marks a puzzle solved so it isn't served again. */
  markSolved: (puzzleId: string): Promise<void> =>
    apiRequest<void>("post", `/puzzles/${encodeURIComponent(puzzleId)}/solve`),

  /**
   * Rated mode: the player's moves so far (UCI, their own only). The server
   * answers with the reply to play, or the outcome, which it records: the
   * first outcome on a puzzle changes the puzzle rating.
   */
  check: (puzzleId: string, moves: string[]): Promise<PuzzleCheckResult> =>
    apiRequest<PuzzleCheckResult>("post", `/puzzles/${encodeURIComponent(puzzleId)}/check`, {
      data: { moves },
    }),

  /** Rated mode: the solution, for a hint or "show solution" (a miss if not over yet). */
  reveal: (puzzleId: string): Promise<PuzzleCheckResult> =>
    apiRequest<PuzzleCheckResult>("post", `/puzzles/${encodeURIComponent(puzzleId)}/reveal`),

  fetchThemes: (): Promise<PuzzleThemeCount[]> =>
    apiRequest<{ data: PuzzleThemeCount[] }>("get", "/puzzles/themes").then((r) => r.data),
};
