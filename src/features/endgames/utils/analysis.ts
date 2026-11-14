import { Chess } from "chess.js";
import type { EvaluationLine } from "@/features/engine-analysis/types";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { EndgameObjective } from "../types";
import {
  flipOutcome,
  mateInMoves,
  movesKeepingResult,
  outcomeOf,
  type Outcome,
  type TablebaseMove,
  type TablebaseResult,
} from "../services/tablebase";

/** A line of UCI moves as numbered SAN ("1. Kd6 Kd8 2. Qb7#"), stopping at the first illegal move. */
export const formatLine = (pv: string[], fen: string, maxPlies = 12): string => {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return "";
  }
  const parts: string[] = [];
  for (const uci of pv.slice(0, maxPlies)) {
    const white = chess.turn() === "w";
    const number = chess.moveNumber();
    let san: string;
    try {
      san = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }).san;
    } catch {
      break;
    }
    if (white) parts.push(`${number}. ${san}`);
    else parts.push(parts.length === 0 ? `${number}… ${san}` : san);
  }
  return parts.join(" ");
};

export interface Verdict {
  /** From the player's side */
  outcome: Outcome;
  /** Moves to mate (by whoever wins), when known */
  mateIn: number | null;
  source: "tablebase" | "engine";
}

const sideToMove = (fen: string): "w" | "b" => (fen.split(" ")[1] === "b" ? "b" : "w");

/**
 * The position's result for the player: the tablebase's when there is one,
 * otherwise only a mate Stockfish has found (an evaluation alone doesn't
 * settle a win or a draw).
 */
export const verdictFor = ({
  fen,
  playerColor,
  tablebase,
  engineLine,
}: {
  fen: string;
  playerColor: PlayerColor;
  tablebase: TablebaseResult | null;
  engineLine: EvaluationLine | null;
}): Verdict | null => {
  const playerToMove = sideToMove(fen) === (playerColor === "white" ? "w" : "b");
  if (tablebase && outcomeOf(tablebase.category) !== "unknown") {
    const forMover = outcomeOf(tablebase.category);
    const outcome = playerToMove ? forMover : flipOutcome(forMover);
    return { outcome, mateIn: outcome === "draw" ? null : mateInMoves(tablebase.dtm), source: "tablebase" };
  }
  if (engineLine?.mate !== undefined && engineLine.mate !== 0) {
    // Engine mates are from White's side
    const whiteWins = engineLine.mate > 0;
    const playerWins = whiteWins === (playerColor === "white");
    return { outcome: playerWins ? "win" : "loss", mateIn: Math.abs(engineLine.mate), source: "engine" };
  }
  return null;
};

export const verdictText = ({ outcome, mateIn }: Verdict): string => {
  switch (outcome) {
    case "win":
      return mateIn ? `Winning: mate in ${mateIn} with best play` : "Winning with best play";
    case "loss":
      return mateIn ? `Lost: mated in ${mateIn} with best play` : "Lost with best play";
    case "draw":
      return "A draw with best play";
    default:
      return "";
  }
};

/** A note when the objective can no longer be reached from here, or null. */
export const objectiveNote = (objective: EndgameObjective, verdict: Verdict | null): string | null => {
  if (!verdict || verdict.outcome === "unknown") return null;
  if (objective.type === "draw") {
    return verdict.outcome === "loss" ? "The draw is gone from this position. Retry and look for the hold earlier." : null;
  }
  return verdict.outcome === "win" ? null : "The win is gone from this position. Retry and look for a stronger move earlier.";
};

/**
 * The move to point at: Stockfish's, unless the tablebase knows it throws
 * the result away, then the tablebase's best.
 */
export const suggestedMove = (
  engineMove: string | undefined,
  tablebase: TablebaseResult | null
): string | null => {
  if (!tablebase) return engineMove ?? null;
  const keepers: TablebaseMove[] = movesKeepingResult(tablebase);
  if (keepers.length === 0) return engineMove ?? null;
  if (engineMove && keepers.some((move) => move.uci === engineMove)) return engineMove;
  return keepers[0]!.uci;
};
