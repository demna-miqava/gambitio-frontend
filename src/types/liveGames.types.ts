import type { TimeControlType } from "./game.types";

export type LivePlayer = {
  id: number;
  username: string;
  /** Rating when the game started */
  rating: number;
  avatarUrl: string | null;
};

/** A game in progress, as listed on the Watch page (GET /games/live/*). */
export type LiveGameSummary = {
  id: number;
  startedAt: string;
  time: number;
  increment: number;
  type: TimeControlType;
  numMoves: number;
  fen: string | null;
  whitePlayer: LivePlayer;
  blackPlayer: LivePlayer;
};
