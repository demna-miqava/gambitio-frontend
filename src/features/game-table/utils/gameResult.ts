import type { StoredGameListItem } from "@/types";
import type { GameScore } from "../components/ResultBadge";

/**
 * The result from the given user's side. Uses `result`, since in a bot game
 * a bot win has no winnerId (the bot isn't a user).
 */
export const getResult = (
  game: StoredGameListItem,
  currentUserId?: number
): "win" | "loss" | "draw" | "aborted" => {
  if (game.result === "aborted") return "aborted";
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

/**
 * The score as written on a scoresheet, White first: "1–0", "0–1" or "½–½".
 * Undefined while the game is still being played, and for an aborted game,
 * which has no score.
 */
export const getScore = (game: StoredGameListItem): GameScore | undefined => {
  if (game.status === "in_progress" || game.result === "aborted") return undefined;
  if (game.result === "white_win") return "1–0";
  if (game.result === "black_win") return "0–1";
  if (game.result) return "½–½";
  // Very old rows without a result
  if (!game.winnerId) return "½–½";
  return game.winnerId === game.whitePlayer.id ? "1–0" : "0–1";
};
