/**
 * The drill. "find": a square name appears and the player clicks that
 * square. A second drill (a square lights up and the player names it) would
 * be another value here, with its own bests on the server (migration 043's
 * `mode` column).
 */
export type CoordinateMode = "find";

export const COORDINATE_SECONDS = [30, 60, 120] as const;
export type CoordinateSeconds = (typeof COORDINATE_SECONDS)[number];

export type CoordinatePerspective = "white" | "black";

/** What the player picks before a run (remembered for next time) */
export interface CoordinateOptions {
  mode: CoordinateMode;
  seconds: CoordinateSeconds;
  perspective: CoordinatePerspective;
  /** Pieces in the starting position, or an empty board */
  withPieces: boolean;
}

/** A best score, per drill, run length and side (GET /coordinates/scores) */
export interface CoordinateBest {
  mode: CoordinateMode;
  seconds: CoordinateSeconds;
  perspective: CoordinatePerspective;
  best: number;
  achievedAt: string;
}

/** One of the player's latest runs */
export interface CoordinateRun {
  id: string;
  mode: CoordinateMode;
  seconds: CoordinateSeconds;
  perspective: CoordinatePerspective;
  withPieces: boolean;
  score: number;
  misses: number;
  createdAt: string;
}

export interface CoordinateScores {
  bests: CoordinateBest[];
  recent: CoordinateRun[];
}

/** A finished run, as sent to POST /coordinates/runs */
export interface CoordinateRunResult {
  mode: CoordinateMode;
  seconds: CoordinateSeconds;
  perspective: CoordinatePerspective;
  withPieces: boolean;
  score: number;
  misses: number;
}

/** The answer to a recorded run */
export interface RecordedCoordinateRun {
  run: CoordinateRun;
  best: CoordinateBest;
  /** The best before this run; null for the first run with these options */
  previousBest: number | null;
}
