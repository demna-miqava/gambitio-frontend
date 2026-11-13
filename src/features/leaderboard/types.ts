import type { LeaderboardVariant } from "./variants";

export type LeaderboardScope = "global" | "friends";

export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  avatarUrl: string | null;
  rating: number;
  highestRating: number;
  gamesPlayed: number;
}

/** GET /leaderboard */
export interface LeaderboardResponse {
  variant: LeaderboardVariant;
  scope: LeaderboardScope;
  data: LeaderboardEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** The signed-in user's entry and the page it's on; null until they play a rated game */
  me: (LeaderboardEntry & { page: number }) | null;
}
