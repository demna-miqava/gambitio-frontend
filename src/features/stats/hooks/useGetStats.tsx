import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { QKEY_USER_STATS_SUMMARY } from "@/constants/queryKeys";
import type { Stats } from "../types";

const emptyVariant = {
  rating: 0,
  delta: 0,
  highestRating: 0,
  highestDate: "",
  wins: 0,
  losses: 0,
  draws: 0,
  games: 0,
};
/** Puzzle rating card (absent from servers older than migration 008) */
export interface PuzzleStats {
  rating: number;
  highestRating: number;
  /** Rated puzzle attempts */
  attempts: number;
  solved: number;
  /** Rating change over the last 30 days */
  delta: number;
}

interface StatsSummary {
  numberOfGames: number;
  stats: Stats;
  puzzle?: PuzzleStats;
}

const EMPTY: StatsSummary = {
  numberOfGames: 0,
  stats: { bullet: emptyVariant, blitz: emptyVariant, rapid: emptyVariant },
};

/** Per-variant rating cards for the profile being viewed. */
export const useGetStats = () => {
  const userId = useProfileUserId();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [QKEY_USER_STATS_SUMMARY, userId],
    queryFn: () =>
      apiRequest<StatsSummary>("get", `/users/${userId}/stats/summary`),
    enabled: userId > 0,
  });

  return { ...(data ?? EMPTY), isPending, isError, refetch };
};
