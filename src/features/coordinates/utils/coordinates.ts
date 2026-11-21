import type { Key } from "@lichess-org/chessground/types";
import {
  COORDINATE_SECONDS,
  type CoordinateBest,
  type CoordinateOptions,
  type CoordinatePerspective,
  type CoordinateRun,
  type CoordinateSeconds,
} from "../types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

/** All 64 squares, a1 to h8 */
export const ALL_SQUARES: Key[] = FILES.flatMap((file) => RANKS.map((rank) => `${file}${rank}` as Key));

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const EMPTY_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";

/** A random square other than `except` (so the same name never comes twice in a row) */
export const randomSquare = (except?: Key, random: () => number = Math.random): Key => {
  const choices = except ? ALL_SQUARES.filter((s) => s !== except) : ALL_SQUARES;
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]!;
};

export const DEFAULT_OPTIONS: CoordinateOptions = {
  mode: "find",
  seconds: 30,
  perspective: "white",
  withPieces: true,
};

/** Options read back from storage; anything unknown falls back to the default */
export const parseOptions = (stored: string | null): CoordinateOptions => {
  if (!stored) return DEFAULT_OPTIONS;
  try {
    const value = JSON.parse(stored) as Partial<Record<keyof CoordinateOptions, unknown>>;
    return {
      mode: "find",
      seconds: COORDINATE_SECONDS.includes(value.seconds as CoordinateSeconds)
        ? (value.seconds as CoordinateSeconds)
        : DEFAULT_OPTIONS.seconds,
      perspective:
        value.perspective === "white" || value.perspective === "black"
          ? value.perspective
          : DEFAULT_OPTIONS.perspective,
      withPieces: typeof value.withPieces === "boolean" ? value.withPieces : DEFAULT_OPTIONS.withPieces,
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
};

export interface RunStats {
  score: number;
  misses: number;
  /** Share of clicks that were right, 0 to 100, or null with no clicks */
  accuracy: number | null;
  /** Seconds per square found, or null with none found */
  secondsPerSquare: number | null;
}

export const runStats = (score: number, misses: number, seconds: number): RunStats => {
  const clicks = score + misses;
  return {
    score,
    misses,
    accuracy: clicks === 0 ? null : Math.round((score / clicks) * 100),
    secondsPerSquare: score === 0 ? null : seconds / score,
  };
};

/** "30 s", "1 min", "2 min" */
export const secondsLabel = (seconds: number) => (seconds < 60 ? `${seconds} s` : `${seconds / 60} min`);

export const perspectiveLabel = (perspective: CoordinatePerspective) =>
  perspective === "white" ? "White" : "Black";

/** m:ss */
export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

type Combination = Pick<CoordinateOptions, "mode" | "seconds" | "perspective">;

const sameCombination = (a: Combination, b: Combination) =>
  a.mode === b.mode && a.seconds === b.seconds && a.perspective === b.perspective;

/** The best for these options, if the player has one */
export const bestFor = (bests: CoordinateBest[] | undefined, options: Combination) =>
  bests?.find((b) => sameCombination(b, options))?.best ?? null;

/** The latest runs with these options, newest first */
export const recentFor = (recent: CoordinateRun[] | undefined, options: Combination, limit = 8) =>
  (recent ?? []).filter((r) => sameCombination(r, options)).slice(0, limit);

/** A score beats the best before it (any score above zero beats having none) */
export const isNewBest = (score: number, previousBest: number | null) =>
  score > 0 && (previousBest === null || score > previousBest);
