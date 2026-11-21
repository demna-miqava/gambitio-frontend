import type { SaveTableGameBody } from "@/features/table-mode/utils/tableStorage";
import { apiRequest } from ".";
import type { PaginatedGamesResponse, GetUserGamesParams, StoredGame } from "@/types";

export const getUserGames = async ({
  userId,
  page = 1,
  limit = 10,
  filters,
}: GetUserGamesParams): Promise<PaginatedGamesResponse> => {
  return apiRequest<PaginatedGamesResponse>("get", `/users/${userId}/games`, {
    params: { page, limit, ...filters },
  });
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

/**
 * Stores a finished table-mode game (unrated). The server replays the moves
 * and checks the result against them; it returns the stored game.
 */
export const saveTableGame = async (body: SaveTableGameBody): Promise<StoredGame> =>
  apiRequest<StoredGame>("post", "/games/table", { data: body });

/** A friend's table game waiting for the signed-in player to confirm */
export interface TableGameRequest {
  gameId: number;
  createdAt: string;
  from: { id: number; username: string; avatarUrl: string | null };
  /** The signed-in player's side of the board */
  color: "white" | "black";
  time: number;
  increment: number;
  whiteTime: number | null;
  blackTime: number | null;
  result: "white_win" | "black_win" | "draw";
  endReason: string;
  numMoves: number;
}

export const getTableGameRequests = async (): Promise<TableGameRequest[]> =>
  (await apiRequest<{ requests: TableGameRequest[] }>("get", "/games/table/requests")).requests;

/** Confirm (it then shows in your history) or decline a friend's table game. */
export const answerTableGameRequest = async (gameId: number, action: "confirm" | "decline"): Promise<void> => {
  await apiRequest<void>("post", `/games/table/requests/${gameId}/${action}`);
};
