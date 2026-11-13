import { useEffect, useRef } from "react";
import { PUZZLE_CONFIG } from "../constants/puzzle.constants";
import type { PuzzleStatus } from "../types/puzzle.types";

/**
 * Timed modes (Rush, Survival): after a wrong move, leave it marked on the
 * board for a moment, then load the next puzzle. Cancelled if the run ends
 * or restarts in the meantime (`enabled` turns false).
 */
export const useAdvanceAfterWrongMove = (
  status: PuzzleStatus,
  enabled: boolean,
  loadNextPuzzle: () => void,
  puzzleId: string | undefined
) => {
  const loadNextRef = useRef(loadNextPuzzle);
  useEffect(() => {
    loadNextRef.current = loadNextPuzzle;
  }, [loadNextPuzzle]);

  useEffect(() => {
    if (status !== "failed" || !enabled) return;
    const timer = setTimeout(() => loadNextRef.current(), PUZZLE_CONFIG.WRONG_MOVE_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [status, enabled, puzzleId]);
};
