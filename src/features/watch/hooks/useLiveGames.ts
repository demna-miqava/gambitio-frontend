import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendsLiveGames, getTopLiveGames } from "@/services/liveGames";
import {
  QKEY_LIVE_GAMES_FRIENDS,
  QKEY_LIVE_GAMES_TOP,
} from "@/constants/queryKeys";

// Games start and end all the time; keep the lists roughly current. (Only
// while the tab is visible: react-query doesn't poll in the background.)
const LIVE_GAMES_POLL_MS = 30_000;

export const TOP_LIVE_GAMES_LIMIT = 12;

/** Friends' games in progress. */
export const useFriendsLiveGames = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [QKEY_LIVE_GAMES_FRIENDS],
    queryFn: getFriendsLiveGames,
    enabled,
    staleTime: 10_000,
    refetchInterval: LIVE_GAMES_POLL_MS,
  });

/** The highest rated games in progress, site-wide. */
export const useTopLiveGames = () =>
  useQuery({
    queryKey: [QKEY_LIVE_GAMES_TOP, TOP_LIVE_GAMES_LIMIT],
    queryFn: () => getTopLiveGames(TOP_LIVE_GAMES_LIMIT),
    staleTime: 10_000,
    refetchInterval: LIVE_GAMES_POLL_MS,
  });

/**
 * Friend id -> the game they're playing, for "Watch" buttons on friend cards
 * and profiles. Only friends of the signed-in user are known.
 */
export const useFriendLiveGameIds = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { data } = useFriendsLiveGames({ enabled });
  return useMemo(() => {
    const byPlayer = new Map<number, number>();
    for (const game of data ?? []) {
      byPlayer.set(game.whitePlayer.id, game.id);
      byPlayer.set(game.blackPlayer.id, game.id);
    }
    return byPlayer;
  }, [data]);
};
