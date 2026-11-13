import type { StoredGameListItem } from "@/types";

/**
 * The result from the given user's side. Uses `result`, since in a bot game
 * a bot win has no winnerId (the bot isn't a user).
 */
export const getResult = (
  game: StoredGameListItem,
  currentUserId?: number
): "win" | "loss" | "draw" => {
  if (!currentUserId) return "draw";
  const userIdNum = Number(currentUserId);
  const side =
    game.whitePlayer.id === userIdNum
      ? "white"
      : game.blackPlayer.id === userIdNum
        ? "black"
        : null;
  if (!side) return "draw";

  if (game.result === "white_win" || game.result === "black_win") {
    return game.result === `${side}_win` ? "win" : "loss";
  }
  if (game.result) return "draw";
  // Very old rows without a result
  if (!game.winnerId) return "draw";
  return game.winnerId === userIdNum ? "win" : "loss";
};
