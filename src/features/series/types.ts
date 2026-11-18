import type { StoredGameListItem } from "@/types";

/**
 * A friend series (best of 3 or 5), as the server sends it
 * (SeriesSummary in the backend's services/seriesService.ts).
 */
export type SeriesStatus = "active" | "finished";
/**
 * "played_out": decided by the games; "resignation": a player gave it up;
 * "expired": nobody played on for a week, so it ended on points
 */
export type SeriesEndReason = "played_out" | "resignation" | "expired";

export interface SeriesPlayer {
  id: number;
  username: string;
  avatarUrl: string | null;
  /** Points; a draw is half a point */
  score: number;
  /** Their starting clock in seconds when the series has time odds; null otherwise */
  time?: number | null;
}

export interface SeriesSummary {
  id: number;
  createdAt: string;
  bestOf: number;
  /** The longer clock when the series has time odds (see SeriesPlayer.time) */
  time: number;
  increment: number;
  status: SeriesStatus;
  endReason: SeriesEndReason | null;
  endedAt: string | null;
  /** Null while active, or when the series was drawn */
  winnerId: number | null;
  /** Games that counted (aborted games don't) */
  gamesPlayed: number;
  /** The challenger */
  playerOne: SeriesPlayer;
  playerTwo: SeriesPlayer;
  /** The game that would be played next, while active */
  next: { number: number; whiteId: number; blackId: number } | null;
}

/** GET /series/:id */
export interface SeriesDetail {
  series: SeriesSummary;
  /** Every game of the series in order, aborted ones included */
  games: StoredGameListItem[];
  /** The series game being played right now, if any */
  liveGameId: number | null;
}

/** GET /users/:id/head-to-head, from the signed-in player's side */
export interface HeadToHead {
  opponent: { id: number; username: string; avatarUrl: string | null };
  wins: number;
  draws: number;
  losses: number;
  series: { won: number; lost: number; drawn: number; active: number };
  recentGames: StoredGameListItem[];
  recentSeries: SeriesSummary[];
}
