import { useMemo, type ReactNode } from "react";
import { useBasePuzzleSession } from "../hooks/useBasePuzzleSession";
import { PuzzleContext, type PuzzleContextType } from "./PuzzleContext";

interface InfinitePuzzleProviderProps {
  children: ReactNode;
  /** Lichess theme key filter, "" for all themes */
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

const noop = () => {};

/**
 * The rated mode: puzzles near the user's puzzle rating, and the first result
 * on each puzzle changes it. Changing the theme starts a fresh feed.
 */
export const InfinitePuzzleProvider = ({
  children,
  theme = "",
  onThemeChange = noop,
}: InfinitePuzzleProviderProps) => {
  const session = useBasePuzzleSession({ rated: true, theme });

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
      mode: "infinite" as const,
      isGameOver: false as const,
      restart: session.baseRestart,
      attempt: session.attempt,
      theme,
      onThemeChange,
    }),
    [session, theme, onThemeChange]
  );

  return (
    <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>
  );
};
