import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_TOURNAMENT, QKEY_TOURNAMENTS } from "@/constants/queryKeys";
import { createTournament, getTournaments } from "@/services/tournaments";

/** How often the open list refreshes itself: player counts and starts move without any action here */
const OPEN_LIST_REFRESH_MS = 20_000;

/**
 * Tournaments that are running or coming up. `poll` (the default) keeps the
 * list fresh while its page is shown; a tab in the background doesn't ask.
 */
export const useOpenTournaments = (limit = 20, { poll = true }: { poll?: boolean } = {}) =>
  useQuery({
    queryKey: [QKEY_TOURNAMENTS, "open", limit],
    queryFn: () => getTournaments("open", 1, limit),
    staleTime: 10_000,
    refetchInterval: poll ? OPEN_LIST_REFRESH_MS : false,
  });

/** A page of the tournaments that have been played, latest first. */
export const useFinishedTournaments = (page: number, limit = 10) =>
  useQuery({
    queryKey: [QKEY_TOURNAMENTS, "finished", page, limit],
    queryFn: () => getTournaments("finished", page, limit),
    placeholderData: (previous) => previous,
  });

/** Creates a tournament; its lobby is in the cache when this resolves. */
export const useCreateTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTournament,
    onSuccess: (state) => {
      queryClient.setQueryData([QKEY_TOURNAMENT, state.tournament.id], state);
      return queryClient.invalidateQueries({ queryKey: [QKEY_TOURNAMENTS] });
    },
  });
};
