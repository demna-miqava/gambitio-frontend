import { formatDistanceToNowStrict } from "date-fns";
import type { FriendOpponent } from "@/types";
import { formatShortDate } from "@/lib/utils";

/** "Played 3 days ago", or since when you're friends if you haven't played lately */
export const opponentDetail = (friend: Pick<FriendOpponent, "lastPlayedAt" | "friendsSince">) =>
  friend.lastPlayedAt
    ? `Played ${formatDistanceToNowStrict(new Date(friend.lastPlayedAt), { addSuffix: true })}`
    : `Friends since ${formatShortDate(friend.friendsSince)}`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The same in as few characters as it takes, for a row with buttons beside
 * it: "Played 5h ago", "Played 12d ago", "Played 3mo ago". Null if you
 * haven't played lately.
 */
export const playedAgoShort = (lastPlayedAt: string | null, now = Date.now()): string | null => {
  if (!lastPlayedAt) return null;
  const ago = Math.max(0, now - new Date(lastPlayedAt).getTime());
  const amount =
    ago < MINUTE
      ? null
      : ago < HOUR
        ? `${Math.floor(ago / MINUTE)}m`
        : ago < DAY
          ? `${Math.floor(ago / HOUR)}h`
          : ago < 14 * DAY
            ? `${Math.floor(ago / DAY)}d`
            : ago < 60 * DAY
              ? `${Math.floor(ago / (7 * DAY))}w`
              : ago < 365 * DAY
                ? `${Math.floor(ago / (30 * DAY))}mo`
                : `${Math.floor(ago / (365 * DAY))}y`;
  return amount ? `Played ${amount} ago` : "Played just now";
};
