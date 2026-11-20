import { useQuery } from "@tanstack/react-query";
import { getFriendOpponents } from "@/services/friends";
import { QKEY_FRIEND_STATUSES } from "@/constants/queryKeys";
import { useUser } from "@/hooks/useUser";

/** Who is online changes all the time: the same pace as the status poll (useFriendStatuses) */
const OPPONENTS_POLL_MS = 30_000;

/**
 * A page of your friends in the order you'd pick an opponent: online first,
 * then playing, then most recently played, then by name (GET
 * /friends/opponents). Each carries its own status, so a list showing them
 * needs no separate status query.
 *
 * Keyed under QKEY_FRIEND_STATUSES: whatever refreshes friends' statuses (a
 * friendship or block changing, the notifications socket reconnecting)
 * refreshes this too. Polled only while the tab is visible.
 */
export const useFriendOpponents = ({
  page = 1,
  limit,
  search = "",
}: {
  page?: number;
  limit: number;
  search?: string;
}) => {
  const { id } = useUser();
  const query = useQuery({
    queryKey: [QKEY_FRIEND_STATUSES, "opponents", { page, limit, search }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("q", search);
      return getFriendOpponents(params.toString());
    },
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: OPPONENTS_POLL_MS,
  });

  return {
    friends: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isPending,
    // Nothing to show: a failed poll keeps the last list on screen
    isError: query.isError && query.data === undefined,
    refetch: query.refetch,
  };
};
