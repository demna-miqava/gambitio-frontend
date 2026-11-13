import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, type GetLeaderboardParams } from "@/services/leaderboard";
import { QKEY_LEADERBOARD } from "@/constants/queryKeys";

/** The server caches global pages for 30s, so refetching sooner gains nothing. */
const STALE_MS = 30_000;

export const useLeaderboard = (params: GetLeaderboardParams) => {
  const { variant, scope, page, limit } = params;
  return useQuery({
    queryKey: [QKEY_LEADERBOARD, variant, scope, page, limit],
    queryFn: () => getLeaderboard({ variant, scope, page, limit }),
    staleTime: STALE_MS,
    // While another page of the same board loads, keep the current one on
    // screen; switching variant or scope shows the skeleton instead of the
    // wrong board's players
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === variant && previousQuery.queryKey[2] === scope
        ? previous
        : undefined,
  });
};
