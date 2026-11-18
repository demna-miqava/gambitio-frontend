import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { puzzleService } from "../services/puzzle.service";
import { usePuzzleState } from "./usePuzzleState";
import { usePuzzleLoader } from "./usePuzzleLoader";
import type { PuzzleVerifier } from "./usePuzzleGame";
import type { Puzzle, PuzzleCheckResult } from "../types/puzzle.types";
import { withPuzzleRating } from "../utils/puzzleRating";
import { EMPTY_SESSION_STATS, recordSessionResult } from "../utils/sessionStats";
import { PUZZLE_MESSAGES } from "../constants/puzzle.constants";
import type { ProfileStatusResponse } from "@/services/user";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import {
  QKEY_USER_PROFILE,
  QKEY_USER_STATS_SUMMARY,
  profileStatusKey,
} from "@/constants/queryKeys";

interface UseBasePuzzleSessionOptions {
  onPuzzleSolved?: () => void;
  onPuzzleFailed?: () => void;
  isGameOver?: boolean;
  /**
   * Rated (Infinite) mode: puzzles are served near the user's puzzle rating
   * and the first result for each puzzle changes it.
   */
  rated?: boolean;
  /** Lichess theme key filter ("" = all) */
  theme?: string;
}

/** Outcome of the rated attempt for one puzzle, shown in the sidebar. */
export interface PuzzleAttemptState {
  puzzleId: string;
  status: "pending" | "done" | "error";
  rated: boolean;
  ratingChange: number;
  /** A hint was used, so the solve counted as a miss */
  hintUsed: boolean;
}

export const useBasePuzzleSession = (
  options: UseBasePuzzleSessionOptions = {}
) => {
  const { onPuzzleSolved, onPuzzleFailed, isGameOver = false, rated = false, theme = "" } = options;
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const puzzleState = usePuzzleState();
  const { puzzle, status, isLoading, setSessionStats, setPuzzle, setStatus, setMoveIndex } = puzzleState;
  const { cgRef } = useChessBoardContext();

  // Only solving marks a puzzle done (including a solve on retry); failed
  // puzzles come back in later sessions
  const solvedIds = useRef(new Set<string>());
  const markSolved = useCallback(() => {
    if (!puzzle || solvedIds.current.has(puzzle.id)) return;
    solvedIds.current.add(puzzle.id);
    puzzleService
      .markSolved(puzzle.id)
      .catch((error) => console.error("Failed to mark puzzle solved", error));
  }, [puzzle]);

  // Rated mode. The server checks every move and records the first outcome
  // on a puzzle (that's what changes the rating); nothing here reports
  // success. Asking for a hint or the solution before the end reveals it,
  // which the server counts as a miss, as on Lichess. After the outcome the
  // solution is known, so a Retry plays locally and a solve only marks the
  // puzzle solved.
  const [attempt, setAttempt] = useState<PuzzleAttemptState | null>(null);
  const outcomes = useRef(new Map<string, PuzzleCheckResult["result"]>());
  const hintedIds = useRef(new Set<string>());

  const applyOutcome = useCallback(
    (puzzleId: string, result: PuzzleCheckResult, hintUsed = false) => {
      if (result.result === "continue" || outcomes.current.has(puzzleId)) return;
      outcomes.current.set(puzzleId, result.result);
      if (result.result === "solved") solvedIds.current.add(puzzleId);
      const { attempt: outcome } = result;
      queryClient.setQueryData<ProfileStatusResponse>(profileStatusKey(userId), (old) =>
        withPuzzleRating(old, outcome)
      );
      if (outcome.rated) {
        queryClient.invalidateQueries({ queryKey: [QKEY_USER_STATS_SUMMARY] });
        queryClient.invalidateQueries({ queryKey: [QKEY_USER_PROFILE] });
      }
      setAttempt({
        puzzleId,
        status: "done",
        rated: outcome.rated,
        ratingChange: outcome.ratingChange,
        hintUsed,
      });
    },
    [queryClient, userId]
  );

  const verifier = useMemo<PuzzleVerifier | undefined>(
    () =>
      rated
        ? {
            check: (puzzleId, moves) => puzzleService.check(puzzleId, moves),
            onOutcome: (puzzleId, result) => applyOutcome(puzzleId, result),
          }
        : undefined,
    [rated, applyOutcome]
  );

  /** The solution of a hidden puzzle, from the server (a miss if it wasn't over). */
  const revealCurrent = useCallback(async (): Promise<Puzzle | null> => {
    if (!puzzle?.hidden) return puzzle;
    try {
      const result = await puzzleService.reveal(puzzle.id);
      applyOutcome(puzzle.id, result, true);
      const revealed: Puzzle = { ...puzzle, moves: result.line, hidden: false };
      setPuzzle(revealed);
      return revealed;
    } catch (error) {
      console.error("Failed to reveal puzzle solution", error);
      toast.error(PUZZLE_MESSAGES.ATTEMPT_ERROR);
      return null;
    }
  }, [puzzle, applyOutcome, setPuzzle]);

  const onSolve = useCallback(() => {
    // Skipped for a rated puzzle the server already saw solved (it marked
    // it); a solve after a failed outcome (Retry) still marks it, unrated
    markSolved();
    if (isGameOver) return;
    if (puzzle) {
      // A hinted solve counts as a miss, like the rating does
      const clean = !(rated && hintedIds.current.has(puzzle.id));
      setSessionStats((prev) => recordSessionResult(prev, puzzle.id, clean));
    }
    onPuzzleSolved?.();
  }, [rated, isGameOver, puzzle, setSessionStats, onPuzzleSolved, markSolved]);

  const onFail = useCallback(() => {
    if (isGameOver) return;
    if (puzzle) setSessionStats((prev) => recordSessionResult(prev, puzzle.id, false));
    onPuzzleFailed?.();
  }, [isGameOver, puzzle, setSessionStats, onPuzzleFailed]);

  const loader = usePuzzleLoader({
    puzzleState,
    onSolve,
    onFail,
    verifier,
    feed: { mode: rated ? "rated" : "ascending", theme },
  });

  // A new theme is a new feed: drop the current puzzle (and freeze the board)
  // so the first puzzle of the new feed loads once it arrives
  const themeRef = useRef(theme);
  useEffect(() => {
    if (themeRef.current === theme) return;
    themeRef.current = theme;
    cgRef.current?.set({ movable: { color: undefined }, drawable: { shapes: [] } });
    cgRef.current?.setAutoShapes([]);
    setPuzzle(null);
    setStatus("solving");
    setMoveIndex(0);
    setSessionStats(EMPTY_SESSION_STATS);
    setAttempt(null);
  }, [theme, cgRef, setPuzzle, setStatus, setMoveIndex, setSessionStats]);

  const onHint = useCallback(() => {
    if (puzzle && status === "solving") hintedIds.current.add(puzzle.id);
    if (!puzzle?.hidden) return loader.onHint();
    void revealCurrent().then((revealed) => revealed && loader.onHint(revealed));
  }, [puzzle, status, loader, revealCurrent]);

  const onShowSolution = useCallback(() => {
    if (!puzzle?.hidden) return loader.onShowSolution();
    void revealCurrent().then((revealed) => revealed && loader.onShowSolution(revealed));
  }, [puzzle, loader, revealCurrent]);

  const baseRestart = useCallback(() => {
    setSessionStats(EMPTY_SESSION_STATS);
    loader.loadNextPuzzle();
  }, [setSessionStats, loader]);

  const onRetry = useCallback(() => {
    if (isGameOver) return;
    loader.retryPuzzle();
  }, [isGameOver, loader]);

  const { data, isPending, isError, refetch } = loader.queryResult;
  const feed = {
    isPending,
    isError: isError && !data,
    /** Nothing at all to serve (e.g. every puzzle of the theme is solved) */
    isEmpty: !!data && data.pages.every((p) => p.data.length === 0),
    retry: () => void refetch(),
  };

  return {
    // State
    puzzle,
    status,
    isLoading,
    sessionStats: puzzleState.sessionStats,
    wrongMove: puzzleState.wrongMove,
    revealed: puzzleState.revealed,
    attempt: attempt && attempt.puzzleId === puzzle?.id ? attempt : null,
    feed,
    // Actions
    loadNextPuzzle: loader.loadNextPuzzle,
    onRetry,
    onHint,
    onShowSolution,
    baseRestart,
    /** Resets the board to the start of the current puzzle (no game-over check) */
    resetCurrentPuzzle: loader.retryPuzzle,
    /**
     * Records a result decided outside the board's own move checks (Calculate
     * first judges a whole entered line): marks a solve, counts the session
     * result and calls onPuzzleSolved / onPuzzleFailed
     */
    recordSolve: onSolve,
    recordFail: onFail,
    // For extending
    setSessionStats,
    puzzleState,
  };
};
