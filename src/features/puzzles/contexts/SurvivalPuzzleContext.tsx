import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useBasePuzzleSession } from "../hooks/useBasePuzzleSession";
import { useAdvanceAfterWrongMove } from "../hooks/useAdvanceAfterWrongMove";
import { PUZZLE_CONFIG } from "../constants/puzzle.constants";
import { PuzzleContext, type PuzzleContextType } from "./PuzzleContext";

export const SurvivalPuzzleProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [lives, setLives] = useState<number>(
    PUZZLE_CONFIG.SURVIVAL.INITIAL_LIVES
  );
  const [history, setHistory] = useState<boolean[]>([]);
  const isGameOver = lives <= 0;
  const loadNextPuzzleRef = useRef<(() => void) | null>(null);

  // Auto-advance on solve
  const onPuzzleSolved = useCallback(() => {
    setHistory((prev) => [...prev, true]);
    loadNextPuzzleRef.current?.();
  }, []);

  // A wrong move costs a life; the next puzzle loads after the move has been
  // shown on the board (useAdvanceAfterWrongMove), unless that was the last
  const onPuzzleFailed = useCallback(() => {
    setHistory((prev) => [...prev, false]);
    setLives((prev) => Math.max(0, prev - 1));
  }, []);

  const session = useBasePuzzleSession({
    onPuzzleSolved,
    onPuzzleFailed,
    isGameOver,
  });

  // Keep ref in sync
  useEffect(() => {
    loadNextPuzzleRef.current = session.loadNextPuzzle;
  }, [session.loadNextPuzzle]);

  useAdvanceAfterWrongMove(session.status, !isGameOver, session.loadNextPuzzle, session.puzzle?.id);

  const restart = useCallback(() => {
    setLives(PUZZLE_CONFIG.SURVIVAL.INITIAL_LIVES);
    setHistory([]);
    session.baseRestart();
  }, [session]);

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
      mode: "survival" as const,
      lives,
      history,
      isGameOver,
      restart,
    }),
    [session, lives, history, isGameOver, restart]
  );

  return (
    <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>
  );
};
