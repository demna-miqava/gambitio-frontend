import { getProfileFriendsRoute } from "@/constants/routes";
import type { FriendStatus } from "@/types";

/** The friends page's query param for which friends to list */
export const FRIENDS_SHOW_PARAM = "show";
export type FriendsShow = "all" | "online";

/** Your friends page, showing only friends who are online or playing. */
export const getOnlineFriendsRoute = (userId: number) =>
  `${getProfileFriendsRoute(userId)}?${FRIENDS_SHOW_PARAM}=online`;

/**
 * The friends online in a steady order while the list is read: those already
 * shown keep their places (`shownIds`, in order), friends who left drop out
 * and new ones come after, in the server's order (free to play first). The
 * server re-sorts on every poll, which would move a friend who just started
 * a game to the end, maybe onto another page.
 */
export const inStableOrder = (
  shownIds: readonly number[],
  statuses: readonly FriendStatus[]
): FriendStatus[] => {
  const byId = new Map(statuses.map((status) => [status.id, status]));
  const kept = shownIds.flatMap((id) => byId.get(id) ?? []);
  const keptIds = new Set(kept.map((status) => status.id));
  return [...kept, ...statuses.filter((status) => !keptIds.has(status.id))];
};

/** Whether two id lists are the same, in the same order */
export const sameIds = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);
