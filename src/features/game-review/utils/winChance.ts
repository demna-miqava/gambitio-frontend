import { MAX_CP, WIN_CHANCE_K } from "../constants";
import type { PositionEval, Side } from "../types";

/**
 * Winning chances on Lichess's [-1, 1] scale (-1 lost, 0 even, 1 won).
 * Centipawns are clamped to ±10 pawns first, so +15 and +25 both read as
 * "winning" rather than one being noticeably better.
 */
export function cpWinChance(cp: number): number {
  const clamped = Math.max(-MAX_CP, Math.min(MAX_CP, cp));
  return 2 / (1 + Math.exp(-WIN_CHANCE_K * clamped)) - 1;
}

/**
 * Mate in N is treated like a huge advantage that shrinks the further away
 * the mate is (Lichess: (21 - min(10, N)) pawns). After clamping it is worth
 * the same as +10, so swapping a mate for a crushing position isn't punished,
 * but walking into a mate is.
 */
export function mateWinChance(mate: number): number {
  if (mate === 0) return 0; // not produced by the engine parser; neutral if it ever is
  const cp = Math.sign(mate) * (21 - Math.min(10, Math.abs(mate))) * 100;
  return cpWinChance(cp);
}

/** White's winning chances for an evaluation. */
export function evalWinChance(evaluation: PositionEval): number {
  switch (evaluation.type) {
    case "cp":
      return cpWinChance(evaluation.value);
    case "mate":
      return mateWinChance(evaluation.value);
    case "over":
      return evaluation.result;
  }
}

/** Flips white's winning chances to the given side's point of view. */
export function forSide(whiteChance: number, side: Side): number {
  return side === "white" ? whiteChance : -whiteChance;
}

/** Winning chances (-1..1) as a win percentage (0..100). */
export function toWinPercent(chance: number): number {
  return 50 + 50 * chance;
}
