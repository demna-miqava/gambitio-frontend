import { Chess } from "chess.js";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { PositionEval } from "@/features/game-review/types";
import type { DrillEval } from "../types";

/**
 * "Clearly winning": at least this many centipawns up (the server refuses
 * less: CONVERSION_MIN_CP in the backend's src/game/conversion.ts).
 */
export const DRILL_MIN_CP = 300;
/**
 * Own moves in a row the player has to be clearly winning on. One alone is
 * often a tactic (the opponent just hung a piece): that's the mistake
 * deck's business. A lead that lasts is a position to convert.
 */
export const DRILL_MIN_RUN = 2;

/** Search limits for scanning: about a third of a second a position */
export const SCAN_LIMITS = { depth: 14, moveTimeMs: 300 } as const;

export interface ScanPosition {
  /** Half-moves of the game before it */
  ply: number;
  fen: string;
}

/**
 * The positions of a game where `color` was to move, in order, leaving out
 * any where the game was already over on the board. Empty for a PGN that
 * doesn't load.
 */
export const playerPositions = (pgn: string, color: PlayerColor): ScanPosition[] => {
  let moves: string[];
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    moves = game.history();
  } catch {
    return [];
  }
  const turn = color === "white" ? "w" : "b";
  const chess = new Chess();
  const positions: ScanPosition[] = [];
  for (let ply = 0; ply < moves.length; ply++) {
    if (chess.turn() === turn && !chess.isGameOver()) positions.push({ ply, fen: chess.fen() });
    chess.move(moves[ply]!);
  }
  return positions;
};

/** An evaluation (white's view) from `color`'s side; null for a finished game. */
export const playerEval = (evaluation: PositionEval, color: PlayerColor): DrillEval | null => {
  const sign = color === "white" ? 1 : -1;
  if (evaluation.type === "over") return null;
  return evaluation.type === "mate" ? { mate: sign * evaluation.value } : { cp: sign * evaluation.value };
};

export const isClearlyWinning = (evaluation: DrillEval | null): evaluation is DrillEval =>
  evaluation !== null && ("mate" in evaluation ? evaluation.mate > 0 : evaluation.cp >= DRILL_MIN_CP);

/**
 * The drill in one game: the first position of the first stretch where the
 * player was clearly winning on DRILL_MIN_RUN of their own moves in a row,
 * with its evaluation. Evaluates the positions in order and stops as soon
 * as it has one. Null when the game has none.
 */
export const findDrill = async (
  positions: readonly ScanPosition[],
  color: PlayerColor,
  evaluate: (fen: string) => Promise<PositionEval>,
  signal?: AbortSignal
): Promise<{ ply: number; eval: DrillEval } | null> => {
  let run: { ply: number; eval: DrillEval; length: number } | null = null;
  for (const position of positions) {
    if (signal?.aborted) throw new DOMException("Scan cancelled", "AbortError");
    const evaluation = playerEval(await evaluate(position.fen), color);
    if (!isClearlyWinning(evaluation)) {
      run = null;
      continue;
    }
    if (run) run.length += 1;
    else run = { ply: position.ply, eval: evaluation, length: 1 };
    if (run.length >= DRILL_MIN_RUN) return { ply: run.ply, eval: run.eval };
  }
  return null;
};

/** "+4.2" or "mate in 3", from the player's side */
export const formatDrillEval = (evaluation: DrillEval): string =>
  "mate" in evaluation ? `mate in ${evaluation.mate}` : `+${(evaluation.cp / 100).toFixed(1)}`;
