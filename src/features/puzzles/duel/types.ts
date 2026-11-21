/** A player as invites and duels name them */
export interface DuelPerson {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface DuelInvite {
  id: number;
  createdAt: string;
  expiresAt: string;
  from: DuelPerson;
  to: DuelPerson;
  /** A rematch: the duel it follows */
  rematchOf: number | null;
}

/** The puzzle a player is on: the position and what's been played, never the solution */
export interface ShownPuzzle {
  /** Its place in the duel (both players get the same order) */
  index: number;
  fen: string;
  /** UCI moves already played in it (the player's right moves and the replies) */
  played: string[];
  rating: number;
}

/** A puzzle once it's over for the player (or the duel is): with its solution */
export interface FinishedPuzzle {
  index: number;
  puzzleId: string;
  fen: string;
  solution: string[];
  rating: number;
  themes: string[];
}

export interface DuelPlayer {
  userId: number;
  username: string;
  avatarUrl: string | null;
  score: number;
  strikes: number;
  out: boolean;
  /** Right or wrong per finished puzzle: your own as you go, both once it's over */
  results?: { index: number; solved: boolean }[];
}

/** GET /puzzle-duels/:id */
export interface DuelState {
  id: number;
  status: "active" | "finished";
  /** The server's clock when it answered (ms) */
  serverNow: number;
  startsAt: number;
  endsAt: number;
  endedAt: number | null;
  endReason: "time" | "both_out" | null;
  winnerId: number | null;
  rematchOf: number | null;
  maxStrikes: number;
  players: DuelPlayer[];
  /** Null before the countdown ends, once out, and after the duel */
  puzzle: ShownPuzzle | null;
  finishedPuzzles: FinishedPuzzle[];
}

/** POST /puzzle-duels/:id/moves */
export interface DuelMoveResult {
  outcome: "continue" | "solved" | "wrong";
  /** The move as the server took it (a promotion corrected to the solution's piece) */
  move: string;
  /** The opponent's reply, when the puzzle goes on */
  reply?: string;
  finishedPuzzle: FinishedPuzzle | null;
  nextPuzzle: ShownPuzzle | null;
  score: number;
  strikes: number;
  out: boolean;
}

/** Live updates on the notifications socket */
export type DuelProgressMessage = {
  type: "duel_progress";
  data: { duelId: number; userId: number; score: number; strikes: number; out: boolean };
};
export type DuelEndedMessage = {
  type: "duel_ended";
  data: {
    duelId: number;
    winnerId: number | null;
    endReason: "time" | "both_out";
    scores: { userId: number; score: number; strikes: number }[];
  };
};
export type DuelStartedMessage = {
  type: "duel_started";
  data: { duelId: number; inviteId: number; startsAt: string; endsAt: string };
};
export type DuelInviteMessage = {
  type: "duel_invite" | "duel_invite_sent";
  data: DuelInvite;
};
export type DuelInviteClosedMessage = {
  type: "duel_invite_closed";
  data: { inviteId: number; status: "declined" | "cancelled" | "expired" };
};
