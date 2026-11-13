import { Chess } from "chess.js";

export interface SolutionMove {
  /** "12." before a White move, "12…" before a Black move that starts the line */
  moveNumber?: string;
  san: string;
}

/**
 * The puzzle's solution (UCI moves from `fen`) in SAN with move numbers,
 * e.g. 23… Rxe4 24. Qxe4 Qxe4. Stops at the first move that doesn't apply.
 */
export const formatSolutionLine = (fen: string, moves: string[]): SolutionMove[] => {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return [];
  }

  const line: SolutionMove[] = [];
  for (const uci of moves) {
    const white = chess.turn() === "w";
    const number = chess.moveNumber();
    let san: string;
    try {
      san = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        ...(uci[4] ? { promotion: uci[4] } : {}),
      }).san;
    } catch {
      break;
    }
    const moveNumber = white ? `${number}.` : line.length === 0 ? `${number}…` : undefined;
    line.push(moveNumber ? { moveNumber, san } : { san });
  }
  return line;
};
