import type { PlayerColor } from "@/features/game/types/game.types";
import type { GameResult } from "@/types/game.types";

/** An evaluation from the player's side: centipawns, or moves to a mate they deliver */
export type DrillEval = { cp: number } | { mate: number };

/**
 * A position from one of the player's own games where they were clearly
 * winning and didn't win (GET /conversion-drills; the backend's
 * services/conversionDrillService.ts). Reviewed with spaced repetition.
 */
export interface ConversionDrill {
  id: number;
  gameId: number;
  /** Half-moves of the game before the position */
  ply: number;
  fen: string;
  /** The player's side; they are to move in `fen` */
  color: PlayerColor;
  /** The evaluation when it was found */
  eval: DrillEval;
  createdAt: string;
  attempts: number;
  successes: number;
  /** Conversions in a row */
  streak: number;
  lastAttemptAt: string | null;
  dueAt: string;
  /** Fewest of the player's own moves in a conversion */
  bestMoves: number | null;
  game: {
    createdAt: string;
    result: GameResult | null;
    endReason: string | null;
    time: number | null;
    increment: number;
    opponent: { id: number | null; username: string; avatarUrl: string | null };
    botId: string | null;
  };
}

/** A finished game the player didn't win, still to be scanned for a drill */
export interface ScanCandidate {
  gameId: number;
  pgn: string;
  color: PlayerColor;
  createdAt: string;
}
