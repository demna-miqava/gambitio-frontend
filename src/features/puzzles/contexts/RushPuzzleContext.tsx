import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useBasePuzzleSession } from "../hooks/useBasePuzzleSession";
import { useAdvanceAfterWrongMove } from "../hooks/useAdvanceAfterWrongMove";
import { PUZZLE_CONFIG } from "../constants/puzzle.constants";
import { PuzzleContext, type PuzzleContextType } from "./PuzzleContext";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  RUSH_RULES,
  initialRushRun,
  isNewPersonalBest,
  parsePersonalBest,
  rushRunReducer,
} from "../utils/rushRun";

/**
 * Puzzle Rush: a start gate, a 3-2-1 countdown, then three minutes to solve
 * as many puzzles as possible. A wrong move is a strike (marked on the board,
 * then the next puzzle loads); three strikes or the clock end the run. The
 * board is locked whenever the clock isn't running. Unrated, as before: a
 * solve only marks the puzzle solved.
 */
export const RushPuzzleProvider = ({ children }: { children: ReactNode }) => {
  const [storedBest, setStoredBest] = useLocalStorage<number>(
    PUZZLE_CONFIG.RUSH.BEST_STORAGE_KEY,
    0
  ) as [unknown, (best: number) => void];
  const best = parsePersonalBest(storedBest);

  const [run, dispatch] = useReducer(rushRunReducer, best, initialRushRun);
  const isPlaying = run.phase === "playing";
  const isGameOver = run.phase === "over";
  const ticking = run.phase === "countdown" || isPlaying;

  const { cgRef, setInputLocked } = useChessBoardContext();
  const loadNextPuzzleRef = useRef<(() => void) | null>(null);
  const resetPuzzleRef = useRef<(() => void) | null>(null);

  // Declared before the session, so the board is locked before the first
  // puzzle can load. Unlocking re-syncs the board so the pieces can move.
  useEffect(() => {
    if (isPlaying) {
      setInputLocked(false);
      resetPuzzleRef.current?.();
    } else {
      setInputLocked(true);
      cgRef.current?.set({ movable: { color: undefined } });
    }
  }, [isPlaying, setInputLocked, cgRef]);

  const onPuzzleSolved = useCallback(() => {
    dispatch({ type: "solved" });
    loadNextPuzzleRef.current?.();
  }, []);

  const onPuzzleFailed = useCallback(() => {
    dispatch({ type: "failed" });
  }, []);

  const session = useBasePuzzleSession({
    onPuzzleSolved,
    onPuzzleFailed,
    isGameOver,
  });

  useEffect(() => {
    loadNextPuzzleRef.current = session.loadNextPuzzle;
    resetPuzzleRef.current = session.resetCurrentPuzzle;
  }, [session.loadNextPuzzle, session.resetCurrentPuzzle]);

  // Countdown and clock both follow the wall clock
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(
      () => dispatch({ type: "tick", now: Date.now() }),
      PUZZLE_CONFIG.RUSH.TIMER_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, [ticking]);

  // Strike shown, then on to the next puzzle (not after the third strike)
  useAdvanceAfterWrongMove(session.status, isPlaying, session.loadNextPuzzle, session.puzzle?.id);

  useEffect(() => {
    if (isGameOver && run.score > best) setStoredBest(run.score);
  }, [isGameOver, run.score, best, setStoredBest]);

  const hasPuzzle = !!session.puzzle;
  /** Start gate: the first puzzle is already loaded (hidden) behind it */
  const start = useCallback(() => {
    if (run.phase !== "ready" || !hasPuzzle) return;
    dispatch({ type: "start", now: Date.now(), best });
  }, [run.phase, hasPuzzle, best]);

  /** Play again: a fresh puzzle, score and strikes, then the countdown */
  const { baseRestart } = session;
  const restart = useCallback(() => {
    if (run.phase !== "over") return;
    dispatch({ type: "start", now: Date.now(), best });
    baseRestart();
  }, [run.phase, best, baseRestart]);

  const value = useMemo<PuzzleContextType>(
    () => ({
      puzzle: session.puzzle,
      status: session.status,
      isLoading: session.isLoading,
      onNextPuzzle: session.loadNextPuzzle,
      onRetry: session.onRetry,
      onHint: session.onHint,
      onShowSolution: session.onShowSolution,
      sessionStats: session.sessionStats,
      wrongMove: session.wrongMove,
      revealed: session.revealed,
      feed: session.feed,
      mode: "rush" as const,
      phase: run.phase,
      countdown: run.countdown,
      timeLeft: run.timeLeft,
      score: run.score,
      strikes: run.strikes,
      maxStrikes: RUSH_RULES.MAX_STRIKES,
      endReason: run.endReason,
      best: Math.max(best, isGameOver ? run.score : 0),
      isNewBest: isNewPersonalBest(run),
      start,
      isGameOver,
      restart,
    }),
    [session, run, best, isGameOver, start, restart]
  );

  return (
    <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>
  );
};
