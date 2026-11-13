import type { PlayerColorOption } from "@/types/game.types";

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
