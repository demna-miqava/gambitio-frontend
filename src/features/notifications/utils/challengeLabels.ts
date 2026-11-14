import type { PlayerColorOption } from "@/types/game.types";

/**
 * "Best of 3" for a series challenge, "Game 2 of 3" for one that continues
 * a series; null for a single game.
 */
export const describeMatchFormat = (bestOf: number | undefined, seriesGame?: number | null): string | null => {
  if (!bestOf || bestOf <= 1) return null;
  return seriesGame ? `Game ${seriesGame} of ${bestOf}` : `Best of ${bestOf}`;
};

/** "You play white" / "You play black" / "Random colors", from the receiver's side. */
export const describeChallengeColor = (color: PlayerColorOption): string => {
  switch (color) {
    case "white":
      return "You play white";
    case "black":
      return "You play black";
    default:
      return "Random colors";
  }
};
