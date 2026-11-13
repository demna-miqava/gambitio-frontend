import { createContext, useContext } from "react";
import type { Puzzle, PuzzleStatus, SessionStats, WrongMove } from "../types/puzzle.types";
import type { PuzzleAttemptState } from "../hooks/useBasePuzzleSession";
import type { RushEndReason, RushPhase } from "../utils/rushRun";

export interface PuzzleFeedState {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  retry: () => void;
}

// Base context shape shared by all modes
interface PuzzleContextBase {
  puzzle: Puzzle | null;
  status: PuzzleStatus;
  isLoading: boolean;
  onNextPuzzle: () => void;
  onRetry: () => void;
  onHint: () => void;
  sessionStats: SessionStats;
  /** Last wrong move on this attempt (marked on the board) */
  wrongMove: WrongMove | null;
  /** The solution was shown rather than solved */
  revealed: boolean;
  restart: () => void;
  onShowSolution: () => void;
  feed: PuzzleFeedState;
}

interface PuzzleContextInfinite extends PuzzleContextBase {
  mode: "infinite";
  isGameOver: false;
  /** Rated result of the current puzzle, once it's finished */
  attempt: PuzzleAttemptState | null;
  /** Lichess theme key filter, "" for all themes */
  theme: string;
  onThemeChange: (theme: string) => void;
}

interface PuzzleContextRush extends PuzzleContextBase {
  mode: "rush";
  /** ready (start gate) → countdown → playing → over */
  phase: RushPhase;
  /** Seconds left in the 3-2-1 countdown */
  countdown: number;
  timeLeft: number;
  /** Puzzles solved this run */
  score: number;
  strikes: number;
  maxStrikes: number;
  endReason: RushEndReason | null;
  /** Best score on this device */
  best: number;
  /** The run that just ended beat the previous best */
  isNewBest: boolean;
  /** Leaves the start gate: runs the countdown, then the clock */
  start: () => void;
  isGameOver: boolean;
}

interface PuzzleContextSurvival extends PuzzleContextBase {
  mode: "survival";
  lives: number;
  history: boolean[];
  isGameOver: boolean;
}

export type PuzzleContextType =
  | PuzzleContextInfinite
  | PuzzleContextRush
  | PuzzleContextSurvival;

export const PuzzleContext = createContext<PuzzleContextType | null>(null);

export const usePuzzle = () => {
  const context = useContext(PuzzleContext);
  if (!context) {
    throw new Error("usePuzzle must be used within a PuzzleProvider");
  }
  return context;
};

// Type-safe mode hooks
export const useInfiniteMode = () => {
  const context = usePuzzle();
  if (context.mode !== "infinite") {
    throw new Error("useInfiniteMode must be used when mode is 'infinite'");
  }
  return context;
};

export const useRushMode = () => {
  const context = usePuzzle();
  if (context.mode !== "rush") {
    throw new Error("useRushMode must be used when mode is 'rush'");
  }
  return context;
};

export const useSurvivalMode = () => {
  const context = usePuzzle();
  if (context.mode !== "survival") {
    throw new Error("useSurvivalMode must be used when mode is 'survival'");
  }
  return context;
};
