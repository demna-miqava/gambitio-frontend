import { EVAL_BAR } from "@/features/engine-analysis/constants";

/**
 * Search limits for the review. Every position of the game is searched once,
 * stopping at whichever limit comes first. Depth 16 reliably separates
 * blunders from good moves and finds short mates; the time cap keeps one
 * hard position from stalling the run.
 *
 * Measured with the bundled lite single-threaded build (Node, M1 Pro
 * laptop): a 44-move game (88 positions) took ~7s, slowest position ~0.35s.
 * Browsers are somewhat slower, and the cap bounds a 40-move game (81
 * positions) at ~40s in the worst case.
 */
export const REVIEW_ENGINE = {
  depth: 16,
  moveTimeMs: 500,
} as const;

/** Same centipawn → winning-chance curve as the evaluation bar (Lichess's). */
export const WIN_CHANCE_K = EVAL_BAR.winChanceK;

/** Evaluations are clamped here before the curve, like Lichess (±10 pawns). */
export const MAX_CP = 1000;

/**
 * Classification thresholds: how much the mover's winning chances dropped
 * with the played move, on Lichess's [-1, 1] winning-chances scale (a drop
 * of 0.3 is 15 percentage points of win%). A move is put in the highest
 * class whose threshold the drop exceeds.
 */
export const DROP_THRESHOLDS = {
  blunder: 0.3,
  mistake: 0.2,
  inaccuracy: 0.1,
} as const;

/**
 * A move that isn't the engine's choice still counts as "Best" when it loses
 * no more than this: within the noise of a shallow search.
 */
export const BEST_MAX_DROP = 0.02;

/**
 * Lichess's per-move accuracy curve (lila AccuracyPercent): accuracy % from
 * the drop in win% (0-100, mover's view),
 *   accuracy = A · e^(−k · drop) + B + bonus, clamped to [0, 100],
 * and 100 when the move didn't lose anything.
 */
export const ACCURACY_CURVE = {
  a: 103.1668100711649,
  k: 0.04354415386753951,
  b: -3.166924740191411,
  /** Lichess's "uncertainty bonus" for imperfect analysis */
  bonus: 1,
} as const;

/**
 * Game accuracy weights each move by how volatile the game was around it
 * (standard deviation of win% over a sliding window), so moves in sharp
 * positions count more than shuffling in a dead draw.
 */
export const ACCURACY_WEIGHTS = {
  minWindow: 2,
  maxWindow: 8,
  minWeight: 0.5,
  maxWeight: 12,
} as const;

/** Bump when the cached data's shape or meaning changes */
export const REVIEW_STORAGE_PREFIX = "gambitio:review:v1:";
