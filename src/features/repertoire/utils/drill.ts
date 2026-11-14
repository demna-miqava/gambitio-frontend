import { Chess } from "chess.js";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { RepertoireLine } from "@/services/repertoire";

/** The board position without move counters, so transpositions meet. */
export const positionKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

/** Whether the half-move at index `ply` (0 = White's first) is the player's. */
export const isPlayerPly = (color: PlayerColor, ply: number) => (ply % 2 === 0) === (color === "white");

/** Position keys before each move of a line (index i: before moves[i]). */
export function positionsBefore(moves: readonly string[]): string[] {
  const chess = new Chess();
  const keys: string[] = [];
  for (const san of moves) {
    keys.push(positionKey(chess.fen()));
    try {
      chess.move(san);
    } catch {
      break;
    }
  }
  return keys;
}

/**
 * Another line of the same colour that plays `san` from the position the
 * drill is in (`fen`), if any: the player remembered a different line of
 * their repertoire, not a wrong move.
 */
export function otherLinePlaying<T extends Pick<RepertoireLine, "id" | "color" | "moves">>(
  lines: readonly T[],
  drilled: Pick<RepertoireLine, "id" | "color">,
  fen: string,
  san: string
): T | null {
  const key = positionKey(fen);
  for (const line of lines) {
    if (line.id === drilled.id || line.color !== drilled.color) continue;
    const before = positionsBefore(line.moves);
    for (let i = 0; i < before.length; i++) {
      if (before[i] === key && line.moves[i] === san) return line;
    }
  }
  return null;
}

/** The squares of a SAN move in a position, for drawing it as an arrow. */
export function moveSquares(fen: string, san: string): { from: string; to: string } | null {
  try {
    const move = new Chess(fen).move(san);
    return { from: move.from, to: move.to };
  } catch {
    return null;
  }
}
