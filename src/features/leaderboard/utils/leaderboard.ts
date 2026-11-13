import type { LeaderboardEntry, LeaderboardResponse, LeaderboardScope } from "../types";
import {
  DEFAULT_LEADERBOARD_VARIANT,
  LEADERBOARD_VARIANTS,
  type LeaderboardVariant,
} from "../variants";

/** URL value -> variant; unknown values fall back to the default tab. */
export const parseVariant = (value: string | null): LeaderboardVariant =>
  LEADERBOARD_VARIANTS.find((v) => v.value === value)?.value ?? DEFAULT_LEADERBOARD_VARIANT;

export const parseScope = (value: string | null): LeaderboardScope =>
  value === "friends" ? "friends" : "global";

/** URL value -> page number (1 for anything that isn't a positive integer). */
export const parsePage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
};

export const variantInfo = (variant: LeaderboardVariant) =>
  LEADERBOARD_VARIANTS.find((v) => v.value === variant) ?? LEADERBOARD_VARIANTS[0];

export const variantLabel = (variant: LeaderboardVariant) => variantInfo(variant).label;

/** "try a puzzle" -> "Try a puzzle" */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export type PodiumTier = "gold" | "silver" | "bronze";

/** Ranks 1-3 get medals. Tied players share a rank, so a podium can hold more than three. */
export const podiumTier = (rank: number): PodiumTier | null =>
  rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null;

/** The user's own entry when it isn't among the listed rows (shown pinned below them). */
export const pinnedEntry = (
  response: Pick<LeaderboardResponse, "data" | "me"> | undefined
): LeaderboardResponse["me"] => {
  const me = response?.me;
  if (!me) return null;
  return response.data.some((entry) => entry.id === me.id) ? null : me;
};

/** Screen reader label for a row: "Rank 2, alice, 1500 rating". */
export const entryLabel = (entry: LeaderboardEntry, isMe: boolean) =>
  `Rank ${entry.rank}, ${entry.username}${isMe ? " (you)" : ""}, ${entry.rating} rating`;
