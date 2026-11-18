import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendStatuses } from "@/services/friends";
import { QKEY_FRIEND_STATUSES } from "@/constants/queryKeys";
import { useUser } from "@/hooks/useUser";
import type { FriendStatus } from "@/types";

/**
 * Friends come online and start games all the time; keep it roughly
 * current. Only while the tab is visible: react-query doesn't poll in the
 * background. FriendUpdates and a notifications reconnect refetch it too.
 */
const FRIEND_STATUS_POLL_MS = 30_000;

/**
 * The signed-in user's friends who are online or playing, available ones
 * first, and the same by friend id. Every list that shows friends shares
 * this one query, so a page polls once however many lists it has.
 */
export const useFriendStatuses = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { id } = useUser();
  const query = useQuery({
    queryKey: [QKEY_FRIEND_STATUSES],
    queryFn: getFriendStatuses,
    enabled: enabled && !!id,
    staleTime: 10_000,
    refetchInterval: FRIEND_STATUS_POLL_MS,
  });
  const byId = useMemo(() => {
    const map = new Map<number, FriendStatus>();
    for (const status of query.data ?? []) map.set(status.id, status);
    return map;
  }, [query.data]);

  return {
    statuses: query.data ?? [],
    byId,
    isPending: query.isPending,
    isError: query.isError,
  };
};
