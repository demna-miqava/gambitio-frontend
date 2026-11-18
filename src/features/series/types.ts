import type { StoredGameListItem } from "@/types";
import type { OpeningSummary } from "@/features/openings/startingOpenings";

/**
 * A friend series (best of 3 or 5, a mirror match: two games, one with each
 * colour, or a timed match: as many games as fit in a fixed time, scored like
 * an arena), as the server sends it (SeriesSummary in the backend's
 * services/seriesService.ts).
 */
export type SeriesStatus = "active" | "finished";
/**
 * "played_out": decided by the games; "resignation": a player gave it up;
 * "expired": nobody played on for a week, so it ended on points. A timed
 * match: "time_up", decided on points when the time ran out; "abandoned",
 * on points after the players kept not making their first move
 */
export type SeriesEndReason = "played_out" | "resignation" | "expired" | "time_up" | "abandoned";

export interface SeriesPlayer {
  id: number;
  username: string;
  avatarUrl: string | null;
  /** Points; a draw is half a point. In a timed match, arena points (2 a win, 1 a draw) */
  score: number;
  /** Their starting clock in seconds when the series has time odds; null otherwise */
  time?: number | null;
  /** Wins in a row: in a timed match, from TIMED_STREAK_AFTER on points count double */
  streak?: number;
}

export interface SeriesSummary {
  id: number;
  createdAt: string;
  /** 0 for a timed match */
  bestOf: number;
  /** A timed match's length in minutes; null or missing for a best-of series */
  matchMinutes?: number | null;
  /** When a timed match's time is up */
  endsAt?: string | null;
  /** After this no new game of a timed match starts (the one being played still counts) */
  lastGameStartsBy?: string | null;
  /** The longer clock when the series has time odds (see SeriesPlayer.time) */
  time: number;
  increment: number;
  /** False when its games change no ratings: a casual series, or one with time odds */
  rated?: boolean;
  /** The opening every game starts from; null or missing for the initial position */
  opening?: OpeningSummary | null;
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
