import type { PositionEval, ReviewMove, Side } from "../types";

const moverOf = (fen: string): Side => (fen.split(" ")[1] === "b" ? "black" : "white");

/**
 * The evaluation of a position, worked out from the evaluation after the
 * move played from it. Mate distances grow by one when the mating side made
 * the move; a position that ended the game becomes mate in 1 (or a draw).
 */
function evalBefore(after: PositionEval, mover: Side, bestMove: string | undefined): PositionEval {
  const best = bestMove ? { bestMove } : {};
  switch (after.type) {
    case "over":
      return after.result === 0 ? { type: "cp", value: 0, ...best } : { type: "mate", value: after.result, ...best };
    case "mate": {
      const matingSide: Side = after.value > 0 ? "white" : "black";
      const value = matingSide === mover ? after.value + Math.sign(after.value) : after.value;
      return { type: "mate", value, ...best };
    }
    case "cp":
      return { type: "cp", value: after.value, ...best };
  }
}

/**
 * When the move played is the one the engine chose, the position before it
 * is worth exactly what the position after it is worth, and the search of
 * the position after it looked one move further down that same line. So
 * its result replaces the shallower one, working back from the end of the
 * game.
 *
 * Without this, a depth-limited search that misjudges its own choice (say,
 * picks a recapture that walks into mate in 2) makes the opponent's
 * previous move look like a blunder, even though the very next search finds
 * the mate.
 *
 * `evals[i]` is the position before `moves[i]`; the last is the final
 * position. Each position keeps its own best move.
 */
export function backUpEvals(moves: ReviewMove[], evals: PositionEval[]): PositionEval[] {
  const result = [...evals];
  for (let i = moves.length - 1; i >= 0; i--) {
    const own = evals[i]!;
    if (own.type === "over" || own.bestMove !== moves[i]!.uci) continue;
    result[i] = evalBefore(result[i + 1]!, moverOf(moves[i]!.fenBefore), own.bestMove);
  }
  return result;
}
