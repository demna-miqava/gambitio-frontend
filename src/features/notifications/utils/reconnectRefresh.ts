import type { QueryKey } from "@tanstack/react-query";
import {
  QKEY_ACTIVE_DUEL,
  QKEY_ACTIVE_GAME,
  QKEY_CHALLENGES,
  QKEY_DUEL,
  QKEY_DUEL_INVITES,
  QKEY_FRIEND_STATUSES,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_TABLE_GAME_REQUESTS,
  QKEY_USER_FRIENDS,
} from "@/constants/queryKeys";

/**
 * Lists the notifications socket keeps up to date for the signed-in player
 * (challenges, the active game, friends' table games to confirm, a puzzle
 * duel being played and whether one is on: a missed "duel started" or the
 * other player's progress), and friends' statuses: polled, but a reconnect
 * (the network or the computer waking up) is when they are most likely out
 * of date
 */
const GLOBAL_KEYS: unknown[] = [
  QKEY_CHALLENGES,
  QKEY_ACTIVE_GAME,
  QKEY_FRIEND_STATUSES,
  QKEY_TABLE_GAME_REQUESTS,
  QKEY_DUEL,
  QKEY_ACTIVE_DUEL,
];
/** Keyed [key, userId, ...]: only the signed-in player's own copy gets socket updates */
const OWN_KEYS: unknown[] = [QKEY_PENDING_FRIEND_REQUESTS, QKEY_USER_FRIENDS, QKEY_DUEL_INVITES];

/**
 * Whether a query may have missed updates while the notifications socket was
 * down: challenges, the active game, friends' statuses and table games to
 * confirm, and the signed-in
 * player's own friend requests and friends (not other players' friend lists, which the socket
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
