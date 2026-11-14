import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePuzzleQuery, type PuzzleFeedOptions } from "./usePuzzleQuery";
import { usePuzzleGame, type PuzzleVerifier } from "./usePuzzleGame";
import { PUZZLE_CONFIG, PUZZLE_MESSAGES } from "../constants/puzzle.constants";
import type { usePuzzleState } from "./usePuzzleState";
import type { Puzzle } from "../types/puzzle.types";

interface UsePuzzleLoaderProps {
  puzzleState: ReturnType<typeof usePuzzleState>;
  onSolve: () => void;
  onFail: () => void;
  /** Rated mode: moves of hidden puzzles are checked by the server */
  verifier?: PuzzleVerifier;
  isEnabled?: boolean;
  feed?: PuzzleFeedOptions;
}

interface UsePuzzleLoaderReturn {
  loadNextPuzzle: () => Promise<void>;
  retryPuzzle: () => void;
  resetBoard: (puzzle: Puzzle) => void;
  onHint: (revealed?: Puzzle) => void;
  onShowSolution: (revealed?: Puzzle) => void;
  queryResult: ReturnType<typeof usePuzzleQuery>;
}

export const usePuzzleLoader = ({
  puzzleState,
  onSolve,
  onFail,
  isEnabled = true,
  feed,
  verifier,
}: UsePuzzleLoaderProps): UsePuzzleLoaderReturn => {
  const {
    puzzle,
    setPuzzle,
    setStatus,
    setMoveIndex,
    isLoading,
    setIsLoading,
  } = puzzleState;

  const queryResult = usePuzzleQuery(feed);
  const { data, fetchNextPage, hasNextPage, isFetching } = queryResult;

  const { resetBoard, onHint, showSolution } = usePuzzleGame({
    puzzleState,
    onSolve,
    onFail,
    verifier,
  });

  // Prevent race conditions from rapid calls
  const isLoadingRef = useRef(false);
  // Asked for the next puzzle before its page arrived: load it once it does
  // (Rush and Survival have no Next button to press again)
  const awaitingPageRef = useRef(false);

  const loadNextPuzzle = useCallback(async () => {
    // Debounce - prevent multiple simultaneous calls
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setIsLoading(true);
    try {
      const allPuzzles = data?.pages.flatMap((p) => p.data) ?? [];
      const currentIndex = puzzle
        ? allPuzzles.findIndex((p) => p.id === puzzle.id)
        : -1;
      const nextIndex = currentIndex + 1;

      if (nextIndex < allPuzzles.length) {
        const newPuzzle = allPuzzles[nextIndex];

        // Validate puzzle data
        // A hidden (rated) puzzle comes without its solution
        if (!newPuzzle?.fen || (!newPuzzle.hidden && !newPuzzle.moves?.length)) {
          console.error("Invalid puzzle data", newPuzzle);
          toast.error(PUZZLE_MESSAGES.INVALID_DATA);
          return;
        }

        awaitingPageRef.current = false;
        setPuzzle(newPuzzle);
        setStatus("solving");
        setMoveIndex(0);
        resetBoard(newPuzzle);

        // Prefetch when nearing end of buffer
        const remaining = allPuzzles.length - (nextIndex + 1);
        if (remaining <= PUZZLE_CONFIG.PREFETCH.THRESHOLD) {
          if (hasNextPage && !isFetching) {
            fetchNextPage();
          }
        }
      } else {
        // No puzzle available in buffer
        if (hasNextPage) {
          awaitingPageRef.current = true;
          fetchNextPage();
          toast.info(PUZZLE_MESSAGES.LOADING_MORE);
        } else {
          toast.error(PUZZLE_MESSAGES.NO_MORE);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(PUZZLE_MESSAGES.LOAD_ERROR);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    data,
    puzzle,
    hasNextPage,
    isFetching,
    fetchNextPage,
    setPuzzle,
    setStatus,
    setMoveIndex,
    resetBoard,
    setIsLoading,
  ]);

  const loadNextRef = useRef(loadNextPuzzle);
  loadNextRef.current = loadNextPuzzle;
  useEffect(() => {
    if (awaitingPageRef.current && data) void loadNextRef.current();
  }, [data]);

  const retryPuzzle = useCallback(() => {
    if (!puzzle) return;
    setStatus("solving");
    setMoveIndex(0);
    resetBoard(puzzle);
  }, [puzzle, setStatus, setMoveIndex, resetBoard]);

  // Initial load effect
  useEffect(() => {
    if (isEnabled && !puzzle && !isLoading && data) {
      const allPuzzles = data.pages.flatMap((p) => p.data);
      if (allPuzzles.length > 0) {
        loadNextPuzzle();
      }
    }
  }, [isEnabled, puzzle, isLoading, data, loadNextPuzzle]);

  return {
    loadNextPuzzle,
    retryPuzzle,
    resetBoard,
    onHint,
    onShowSolution: showSolution,
    queryResult,
  };
};
