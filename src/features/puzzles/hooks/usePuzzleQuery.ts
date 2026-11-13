import { useInfiniteQuery } from "@tanstack/react-query";
import { puzzleService } from "../services/puzzle.service";
import { PUZZLE_CONFIG, PUZZLE_QUERY_KEY } from "../constants/puzzle.constants";
import type { PuzzleFeedMode } from "../types/puzzle.types";

export interface PuzzleFeedOptions {
  mode?: PuzzleFeedMode;
  /** Lichess theme key; "" or undefined for all themes */
  theme?: string;
}

export const usePuzzleQuery = ({ mode = "ascending", theme = "" }: PuzzleFeedOptions = {}) => {
  return useInfiniteQuery({
    queryKey: [PUZZLE_QUERY_KEY, mode, theme],
    queryFn: ({ pageParam }) =>
      puzzleService.fetchPuzzles({ cursor: pageParam, mode, theme: theme || undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    // Fresh list per session: a cached one would replay attempted puzzles
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    maxPages: PUZZLE_CONFIG.PREFETCH.MAX_PAGES,
  });
};
