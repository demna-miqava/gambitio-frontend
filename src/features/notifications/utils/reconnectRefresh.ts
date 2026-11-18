import type { QueryKey } from "@tanstack/react-query";
import {
  QKEY_ACTIVE_GAME,
  QKEY_CHALLENGES,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_USER_FRIENDS,
} from "@/constants/queryKeys";

/** Lists the notifications socket keeps up to date for the signed-in player */
const GLOBAL_KEYS: unknown[] = [QKEY_CHALLENGES, QKEY_ACTIVE_GAME];
/** Keyed [key, userId, ...]: only the signed-in player's own copy gets socket updates */
const OWN_KEYS: unknown[] = [QKEY_PENDING_FRIEND_REQUESTS, QKEY_USER_FRIENDS];

/**
 * Whether a query may have missed updates while the notifications socket was
 * down: challenges, the active game, and the signed-in player's own friend
 * requests and friends (not other players' friend lists, which the socket
 * never updates anyway).
 */
export const mayBeStaleAfterReconnect = (queryKey: QueryKey, userId: number | undefined) => {
  const [key, owner] = queryKey;
  if (GLOBAL_KEYS.includes(key)) return true;
  if (OWN_KEYS.includes(key)) return userId !== undefined && owner === userId;
  return false;
};

/** Reconnects spread their refetches over this long, so a redeploy doesn't bring every client's at once */
export const RECONNECT_REFRESH_SPREAD_MS = 3_000;
