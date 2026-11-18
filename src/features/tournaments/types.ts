import type { TimeControlType } from "@/types";

export type TournamentStatus = "scheduled" | "running" | "finished" | "cancelled";
export type TournamentPlayerStatus = "active" | "paused" | "withdrawn";

/** An arena tournament, as lists and the lobby show it. */
export interface Tournament {
  id: number;
  name: string;
  format: "arena";
  /** Starting clock, seconds */
  time: number;
  increment: number;
  type: TimeControlType;
  rated: boolean;
  startsAt: string;
  /** No game starts after this; the tournament closes when the last one ends */
  endsAt: string;
  status: TournamentStatus;
  maxPlayers: number;
  playerCount: number;
  createdBy: { id: number; username: string };
  /** Set once finished, if any game was played */
  winner: { id: number; username: string } | null;
}

export interface TournamentListItem extends Tournament {
  /** The signed-in user is in it */
  joined: boolean;
}

/** A line of the standings. */
export interface Standing {
  rank: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  rating: number;
  provisional: boolean;
  score: number;
  /** Wins in a row; from 2 on, points count double */
  streak: number;
  games: number;
  wins: number;
  draws: number;
  performance: number;
  /** Points of their latest games, oldest first, one digit each ("2204") */
  sheet: string;
  status: TournamentPlayerStatus;
}

export interface TournamentLiveGame {
  id: number;
  white: { id: number; username: string };
  black: { id: number; username: string };
}

/** Everything the lobby shows (GET /tournaments/:id, and the socket's "state"). */
export interface TournamentState {
  tournament: Tournament;
  /** The top of the standings */
  standings: Standing[];
  standingsTotal: number;
  liveGames: TournamentLiveGame[];
  /** The viewer's own line; null if they aren't in */
  me: Standing | null;
  /** The viewer's game in progress in this tournament */
  myGameId: number | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** What the lobby socket sends. */
export type TournamentServerMessage =
  | { type: "state"; data: TournamentState }
  | {
      type: "standings";
      data: Pick<TournamentState, "standings" | "standingsTotal" | "liveGames"> & {
        playerCount: number;
        /** The players whose own line changed (their game ended; they joined, paused or left) */
        changed?: number[];
      };
    }
  | { type: "tournament"; data: { tournament: Tournament } }
  /** The games a pairing pass has just started: a player finds their own among them */
  | { type: "pairings"; data: { games: { id: number; whiteId: number; blackId: number }[] } }
  | { type: "error"; data?: { code?: string; message?: string } };

export interface CreateTournamentBody {
  name: string;
  time: number;
  increment: number;
  minutes: number;
  /** ISO time */
  startsAt: string;
  rated: boolean;
}
