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

/**
 * A game someone shared, by the token in its link (GET /shared-games/:token).
 * Needs no sign-in. 404 when the link was never made or has been turned off.
 */
export const getSharedGame = async (token: string): Promise<StoredGame> => {
  return apiRequest<StoredGame>("get", `/shared-games/${encodeURIComponent(token)}`);
};

/**
 * The share link's token for a finished game the user played, made on first
 * use: the same one every time, for both players, until it's turned off.
 */
export const shareGame = async (gameId: number): Promise<{ token: string }> => {
  return apiRequest<{ token: string }>("post", `/games/${gameId}/share`);
};

/** Turns the game's share link off: links already sent stop working. */
export const unshareGame = async (gameId: number): Promise<void> => {
  await apiRequest<void>("delete", `/games/${gameId}/share`);
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
