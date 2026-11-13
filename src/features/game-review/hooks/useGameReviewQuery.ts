import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_GAME_REVIEW } from "@/constants/queryKeys";
import type { GameReview, ReviewMove } from "../types";
import { buildGameReview } from "../utils/buildReview";
import { loadStoredEvals, saveStoredEvals } from "../utils/reviewStorage";
import { runReview } from "../services/runReview";

/** Reviews are pure functions of the moves, so keep them for the session */
const REVIEW_GC_TIME_MS = 60 * 60 * 1000;

export interface ReviewProgress {
  done: number;
  total: number;
}

interface UseGameReviewQueryOptions {
  /** Starting position */
  startFen: string;
  moves: ReviewMove[];
  /** Positions to evaluate (moves.length + 1) */
  positions: string[];
  /** Identifies the game's content (start + moves) */
  fingerprint: string;
  /** Also save the review in localStorage under this id (e.g. "game:42") */
  storageId?: string;
}

/**
 * The review as a query keyed by game + content, so reopening a game (or
 * coming back to it in this session) shows the cached review instead of
 * running Stockfish again. Nothing runs until `start()`.
 *
 * Unmounting or cancelling aborts the query's signal, which terminates the
 * review's worker.
 */
export const useGameReviewQuery = ({
  startFen,
  moves,
  positions,
  fingerprint,
  storageId,
}: UseGameReviewQueryOptions) => {
  const queryClient = useQueryClient();
  const [requested, setRequested] = useState(false);
  const [progress, setProgress] = useState<ReviewProgress | null>(null);
  const storageKey = storageId ? `${storageId}:${fingerprint}` : undefined;
  const queryKey = [QKEY_GAME_REVIEW, storageId ?? "local", fingerprint, startFen];

  const query = useQuery<GameReview>({
    queryKey,
    queryFn: async ({ signal }) => {
      const evals = await runReview(positions, {
        signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (storageKey) saveStoredEvals(storageKey, evals);
      return buildGameReview(moves, evals);
    },
    initialData: () => {
      if (!storageKey) return undefined;
      const stored = loadStoredEvals(storageKey, positions.length);
      if (!stored) return undefined;
      try {
        return buildGameReview(moves, stored);
      } catch {
        return undefined;
      }
    },
    enabled: requested && moves.length > 0,
    staleTime: Infinity,
    gcTime: REVIEW_GC_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const start = useCallback(() => {
    setProgress(null);
    setRequested(true);
  }, []);

  const cancel = useCallback(() => {
    setRequested(false);
    setProgress(null);
    void queryClient.cancelQueries({
      queryKey: [QKEY_GAME_REVIEW, storageId ?? "local", fingerprint, startFen],
      exact: true,
    });
  }, [queryClient, storageId, fingerprint, startFen]);

  const { refetch } = query;
  const retry = useCallback(() => {
    setProgress(null);
    setRequested(true);
    void refetch();
  }, [refetch]);

  return { query, progress, start, cancel, retry };
};
