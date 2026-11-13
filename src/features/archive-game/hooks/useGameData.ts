import { useQuery, type Query } from "@tanstack/react-query";
import { getGameById } from "@/services/game";
import { QKEY_GAME_BY_ID } from "@/constants/queryKeys";
import type { StoredGame } from "@/types/game.types";

interface UseGameDataOptions {
  /**
   * Refetch on mount when the cached copy is of a game that wasn't over yet.
   * The live page caches the game when it starts, so without this the
   * archive opened right after the game shows that stale copy (missing the
   * last moves and the result). Finished games never change.
   */
  requireFinished?: boolean;
}

const refetchUnfinished = (query: Query<StoredGame>) => query.state.data?.status !== "finished";

export const useGameData = (gameId: string | undefined, { requireFinished = false }: UseGameDataOptions = {}) => {
  return useQuery<StoredGame>({
    queryKey: [QKEY_GAME_BY_ID, gameId],
    queryFn: () => getGameById(gameId!),
    enabled: !!gameId,
    retry: false,
    // Default (stale after staleTime) unless asked for a finished game
    refetchOnMount: requireFinished ? refetchUnfinished : true,
  });
};
