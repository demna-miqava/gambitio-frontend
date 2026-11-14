import type { Color, Move } from "chess.js";

/**
 * Half-moves Undo takes back in a bot game: the player's last move and the
 * bot's reply to it, or just the player's move while the bot hasn't replied
 * yet. 0 before the player has moved (a bot playing white may have).
 */
export const botUndoPlies = (moves: Pick<Move, "color">[], playerCode: Color): number => {
  const last = moves.at(-1);
  if (!last) return 0;
  if (last.color === playerCode) return 1;
  return moves.at(-2)?.color === playerCode ? 2 : 0;
};
