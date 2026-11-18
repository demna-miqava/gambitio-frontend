import { apiRequest } from ".";
import type { PaginatedGamesResponse, GetUserGamesParams, StoredGame } from "@/types";
import { getUserGames as getUserGamesAPI } from "./user";

export const getUserGames = async ({
  userId,
  page = 1,
  limit = 10,
}: GetUserGamesParams): Promise<PaginatedGamesResponse> => {
  const query = `page=${page}&limit=${limit}`;
  return getUserGamesAPI(userId, query);
};

/**
 * Any stored game, including bot games (see isPlayerGame). A number, not
 * route text: parse params with parsePositiveId (@/utils/ids) first.
 */
export const getGameById = async (gameId: number): Promise<StoredGame> => {
  return apiRequest<StoredGame>("get", `/games/${gameId}`);
};

/** The signed-in user's live game, or null when they aren't playing. */
export const getActiveGame = async (): Promise<{ gameId: number | null }> => {
  return apiRequest<{ gameId: number | null }>("get", "/games/active");
};

export interface SaveBotGameBody {
  botId: string;
  /** The player's colour */
  color: "white" | "black";
  pgn: string;
  endReason:
    | "checkmate"
    | "resignation"
    | "stalemate"
    | "insufficient_material"
    | "threefold_repetition"
    | "fifty_move_rule";
}

/**
 * Stores a finished game against a bot (unrated). The server replays the
 * moves and decides the result; it returns the stored game.
 */
export const saveBotGame = async (body: SaveBotGameBody): Promise<StoredGame> => {
  return apiRequest<StoredGame>("post", "/games/bot", { data: body });
};
