export type PuzzleStatus = "solving" | "success" | "failed";

export type PuzzleMode = "infinite" | "rush" | "survival";

export interface Puzzle {
  id: string;
  fen: string;
  /**
   * The solution in UCI ("e2e4"), the player's moves at even indexes. For a
   * hidden (rated) puzzle, only the part played so far: the server checks
   * each move and sends the rest once the puzzle is over.
   */
  moves: string[];
  rating: number;
  themes: string[];
  /** Rated mode: the solution isn't known yet (see POST /puzzles/:id/check) */
  hidden?: boolean;
}

export interface PuzzleResponse {
  data: Puzzle[];
  nextCursor: string | null;
}

/** This session's results, one per puzzle (see recordSessionResult) */
export interface SessionStats {
  solved: number;
  failed: number;
  /** Puzzles solved in a row */
  streak: number;
  /** Puzzle the last result was counted for */
  lastPuzzleId: string | null;
}

/** The player's last wrong move, marked on the board until the board resets */
export interface WrongMove {
  from: string;
  to: string;
  san: string;
}

/** GET /puzzles mode: "rated" is Infinite (near the user's puzzle rating). */
export type PuzzleFeedMode = "ascending" | "rated";

export interface PuzzleThemeCount {
  theme: string;
  count: number;
}

/** The rating outcome of a rated puzzle */
export interface PuzzleAttemptResult {
  /** False for repeat attempts, which don't change the rating. */
  rated: boolean;
  puzzleRating: number;
  highestPuzzleRating: number;
  ratingChange: number;
}

/**
 * POST /puzzles/:id/check and /reveal. "continue": the line so far,
 * including the opponent's reply to play. Otherwise the puzzle is over: the
 * full solution and what it did to the rating (the server records it).
 */
export type PuzzleCheckResult =
  | { result: "continue"; line: string[] }
  | { result: "solved" | "failed"; line: string[]; attempt: PuzzleAttemptResult };
