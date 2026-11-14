import type { GameResult, StoredGamePlayer } from "@/types";

export type GifOrientation = "white" | "black";

/**
 * The side at the bottom of the GIF: the viewer's when they played the game,
 * otherwise white. A signed-out viewer (no id) never matches the computer's
 * side of a bot game, which has no id either.
 */
export function gifOrientation(
  players: { whitePlayer: Pick<StoredGamePlayer, "id">; blackPlayer: Pick<StoredGamePlayer, "id"> },
  viewerId: number | null | undefined
): GifOrientation {
  if (viewerId == null) return "white";
  return players.blackPlayer.id === viewerId ? "black" : "white";
}

export const gifFileName = (gameId: number | string) => `gambitio-game-${gameId}.gif`;

/** "magnus (2850)", or just the name when there's no rating to show */
export function playerLabel(player: Pick<StoredGamePlayer, "username" | "rating">): string {
  return Number.isFinite(player.rating) && player.rating > 0
    ? `${player.username} (${Math.round(player.rating)})`
    : player.username;
}

const END_REASONS: Record<string, string> = {
  checkmate: "checkmate",
  resignation: "resignation",
  time: "on time",
  timeout: "on time",
  stalemate: "stalemate",
  threefold_repetition: "repetition",
  fifty_move_rule: "50-move rule",
  insufficient_material: "insufficient material",
  agreement: "agreement",
  draw_agreement: "agreement",
  abandonment: "abandonment",
};

/** "1-0 · checkmate", "½-½ · stalemate", "0-1"; "" for an unknown result. */
export function resultLabel(result: GameResult | null, endReason: string | null): string {
  const score =
    result === "white_win" ? "1-0" : result === "black_win" ? "0-1" : result === "draw" ? "½-½" : "";
  if (!score) return "";
  const reason = endReason ? (END_REASONS[endReason] ?? endReason.replace(/_/g, " ")) : "";
  return reason ? `${score} · ${reason}` : score;
}
