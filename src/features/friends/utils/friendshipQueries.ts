import type { QueryClient } from "@tanstack/react-query";
import {
  QKEY_FRIEND_STATUSES,
  QKEY_LIVE_GAMES_FRIENDS,
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
} from "@/constants/queryKeys";

/**
 * What a friendship starting or ending changes: friend lists, the friend
 * counts on profile headers, friends' live games and who of them is online
 * (a removed friend mustn't stay listed, a new one may be online now).
 */
export const FRIENDSHIP_QUERY_KEYS = [
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
  QKEY_LIVE_GAMES_FRIENDS,
  QKEY_FRIEND_STATUSES,
] as const;

/** Refetch everything a new or ended friendship changes (FRIENDSHIP_QUERY_KEYS). */
export const invalidateAfterFriendshipChange = (queryClient: QueryClient) => {
  for (const key of FRIENDSHIP_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
};
