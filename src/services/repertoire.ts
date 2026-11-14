import { apiRequest } from ".";
import type { PlayerColor } from "@/features/game/types/game.types";

/** A prepared line, as GET /repertoire returns it. */
export interface RepertoireLine {
  id: number;
  /** The colour the player plays it with */
  color: PlayerColor;
  name: string;
  /** SAN from the standard starting position */
  moves: string[];
  plies: number;
  createdAt: string;
  updatedAt: string;
  practiceAttempts: number;
  practiceCorrect: number;
  /** Correct practice runs in a row */
  streak: number;
  lastPracticedAt: string | null;
  /** When the line should be practised next */
  dueAt: string;
}

export type GameCheckStatus = "followed" | "you_deviated" | "opponent_deviated" | "not_covered";

/** A recent game compared with the repertoire (GET /repertoire/check). */
export interface RepertoireGameCheck {
  gameId: number;
  createdAt: string;
  color: PlayerColor;
  opponent: { id: number | null; username: string };
  result: string | null;
  outcome: "win" | "loss" | "draw";
  botId: string | null;
  status: GameCheckStatus;
  /** Half-moves played inside the preparation */
  pliesInBook: number;
  divergence: {
    /** 1-based half-move number of the move that left the book */
    ply: number;
    moveNumber: number;
    /** Who was to move */
    color: PlayerColor;
    played: string;
    expected: string[];
    /** Position before the move */
    fen: string;
    lineNames: string[];
  } | null;
}

export interface NewRepertoireLine {
  color: PlayerColor;
  name: string;
  moves: string[];
}

export const getRepertoire = async (): Promise<RepertoireLine[]> =>
  (await apiRequest<{ lines: RepertoireLine[] }>("get", "/repertoire")).lines;

export const createRepertoireLine = async (line: NewRepertoireLine): Promise<RepertoireLine> =>
  (await apiRequest<{ line: RepertoireLine }>("post", "/repertoire", { data: line })).line;

export const updateRepertoireLine = async (
  id: number,
  changes: { name?: string; color?: PlayerColor }
): Promise<RepertoireLine> =>
  (await apiRequest<{ line: RepertoireLine }>("patch", `/repertoire/${id}`, { data: changes })).line;

export const deleteRepertoireLine = async (id: number): Promise<void> => {
  await apiRequest<void>("delete", `/repertoire/${id}`);
};

export const recordLinePractice = async (id: number, correct: boolean): Promise<RepertoireLine> =>
  (await apiRequest<{ line: RepertoireLine }>("post", `/repertoire/${id}/practice`, { data: { correct } }))
    .line;

export const getRepertoireCheck = async (limit = 20): Promise<RepertoireGameCheck[]> =>
  (await apiRequest<{ games: RepertoireGameCheck[] }>("get", `/repertoire/check?limit=${limit}`)).games;
