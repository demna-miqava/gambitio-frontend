import { ACCURACY_CURVE, ACCURACY_WEIGHTS } from "../constants";
import type { Side } from "../types";

/**
 * Accuracy of one move from the mover's win% (0-100) before and after it.
 * Lichess's curve: 100 for a move that lost nothing, ~81 for a 5-point
 * drop, ~65 for 10, ~41 for 20, ~5 for 60.
 */
export function moveAccuracy(winPercentBefore: number, winPercentAfter: number): number {
  if (winPercentAfter >= winPercentBefore) return 100;
  const { a, k, b, bonus } = ACCURACY_CURVE;
  const drop = winPercentBefore - winPercentAfter;
  const raw = a * Math.exp(-k * drop) + b + bonus;
  return Math.max(0, Math.min(100, raw));
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * One weight per move: the volatility (standard deviation of win%) of the
 * window of positions around it, clamped. Same windowing as Lichess: window
 * size is a tenth of the game (2-8 positions), and the first moves reuse the
 * first window so every move gets a weight.
 */
export function volatilityWeights(whiteWinPercents: number[]): number[] {
  const moveCount = whiteWinPercents.length - 1;
  if (moveCount <= 0) return [];
  const { minWindow, maxWindow, minWeight, maxWeight } = ACCURACY_WEIGHTS;
  const size = Math.min(
    Math.max(Math.floor(moveCount / 10), minWindow),
    maxWindow,
    whiteWinPercents.length
  );

  const windows: number[][] = [];
  const first = whiteWinPercents.slice(0, size);
  for (let i = 0; i < size - 2; i++) windows.push(first);
  for (let i = 0; i + size <= whiteWinPercents.length; i++) {
    windows.push(whiteWinPercents.slice(i, i + size));
  }

  return windows
    .slice(0, moveCount)
    .map((w) => Math.max(minWeight, Math.min(maxWeight, standardDeviation(w))));
}

function weightedMean(pairs: { value: number; weight: number }[]): number {
  const totalWeight = pairs.reduce((sum, p) => sum + p.weight, 0);
  return pairs.reduce((sum, p) => sum + p.value * p.weight, 0) / totalWeight;
}

/** Harmonic mean, with values floored at 1 so a single 0 doesn't zero the game. */
function harmonicMean(values: number[]): number {
  return values.length / values.reduce((sum, v) => sum + 1 / Math.max(1, v), 0);
}

export interface AccuracyInput {
  /** White's win% (0-100) for every position, including the start */
  whiteWinPercents: number[];
  /** Who played each move (whiteWinPercents.length - 1 entries) */
  movers: Side[];
  /** Moves to leave out of the totals (e.g. the only legal move) */
  skip?: boolean[];
  /** Moves to score 100% whatever the evaluations say (the engine's own choice) */
  perfect?: boolean[];
}

export interface AccuracyResult {
  perMove: number[];
  white: number | null;
  black: number | null;
}

/**
 * Lichess game accuracy: per side, the average of the volatility-weighted
 * mean and the harmonic mean of its move accuracies. The weighted mean
 * rewards getting the critical moments right; the harmonic mean makes a few
 * terrible moves hurt more than they would in a plain average.
 */
export function computeAccuracy({ whiteWinPercents, movers, skip = [], perfect = [] }: AccuracyInput): AccuracyResult {
  const weights = volatilityWeights(whiteWinPercents);
  const perMove = movers.map((side, i) => {
    if (perfect[i]) return 100;
    const before = whiteWinPercents[i]!;
    const after = whiteWinPercents[i + 1]!;
    return side === "white" ? moveAccuracy(before, after) : moveAccuracy(100 - before, 100 - after);
  });

  const total = (side: Side): number | null => {
    const pairs = perMove
      .map((value, i) => ({ value, weight: weights[i]!, side: movers[i], skipped: skip[i] }))
      .filter((p) => p.side === side && !p.skipped);
    if (pairs.length === 0) return null;
    return (weightedMean(pairs) + harmonicMean(pairs.map((p) => p.value))) / 2;
  };

  return { perMove, white: total("white"), black: total("black") };
}
