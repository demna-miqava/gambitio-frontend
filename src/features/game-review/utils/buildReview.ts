import { Chess } from "chess.js";
import { BEST_MAX_DROP, DROP_THRESHOLDS } from "../constants";
import type {
  GameReview,
  MoveClassification,
  MoveReview,
  PlayerReview,
  PositionEval,
  ReviewMove,
  Side,
} from "../types";
import { computeAccuracy } from "./accuracy";
import { backUpEvals } from "./backUpEvals";
import { evalWinChance, forSide, toWinPercent } from "./winChance";

/**
 * Class of a move from how much it dropped the mover's winning chances
 * (Lichess thresholds, see DROP_THRESHOLDS).
 *
 * The engine's own choice is always "best": if the next position then
 * scores worse, that's the search seeing further one move later (a horizon
 * effect), not a mistake by the player. A move within noise of it is "best"
 * too.
 */
export function classifyMove(drop: number, playedEngineMove: boolean): MoveClassification {
  if (playedEngineMove) return "best";
  if (drop > DROP_THRESHOLDS.blunder) return "blunder";
  if (drop > DROP_THRESHOLDS.mistake) return "mistake";
  if (drop > DROP_THRESHOLDS.inaccuracy) return "inaccuracy";
  if (drop <= BEST_MAX_DROP) return "best";
  return "good";
}

export function sideToMove(fen: string): Side {
  return fen.split(" ")[1] === "b" ? "black" : "white";
}

/** SAN of a UCI move in a position, or undefined if it isn't legal there. */
export function uciToSan(fen: string, uci: string): string | undefined {
  try {
    return new Chess(fen).move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci[4] ? { promotion: uci[4] } : {}),
    }).san;
  } catch {
    return undefined;
  }
}

function legalMoveCount(fen: string): number {
  try {
    return new Chess(fen).moves().length;
  } catch {
    return 0;
  }
}

function bestMoveOf(evaluation: PositionEval): string | undefined {
  return evaluation.type === "over" ? undefined : evaluation.bestMove;
}

function playerTotals(moves: MoveReview[], side: Side, accuracy: number | null): PlayerReview {
  const own = moves.filter((m) => m.side === side);
  const count = (c: MoveClassification) => own.filter((m) => m.classification === c).length;
  return {
    accuracy,
    inaccuracies: count("inaccuracy"),
    mistakes: count("mistake"),
    blunders: count("blunder"),
  };
}

/**
 * Turns per-position evaluations into the review: per-move winning chances,
 * classification and accuracy, and per-player totals.
 *
 * `engineEvals[i]` is the position before `moves[i]`; the last entry is the
 * final position. They're first backed up along the engine's own moves
 * (backUpEvals), and the review's `evals` are the backed-up ones. The only legal move in a position is never judged (always
 * "best") and doesn't count toward accuracy; the engine's own choice is
 * "best" and scores 100%.
 */
export function buildGameReview(moves: ReviewMove[], engineEvals: PositionEval[]): GameReview {
  if (engineEvals.length !== moves.length + 1) {
    throw new Error(`Expected ${moves.length + 1} evaluations, got ${engineEvals.length}`);
  }

  const evals = backUpEvals(moves, engineEvals);
  const whiteChances = evals.map(evalWinChance);
  const movers = moves.map((m) => sideToMove(m.fenBefore));
  const forced = moves.map((m) => legalMoveCount(m.fenBefore) === 1);
  const engineMoves = moves.map((m, i) => bestMoveOf(evals[i]!) === m.uci);
  const { perMove, white, black } = computeAccuracy({
    whiteWinPercents: whiteChances.map(toWinPercent),
    movers,
    skip: forced,
    perfect: engineMoves,
  });

  const reviewed = moves.map((move, i): MoveReview => {
    const side = movers[i]!;
    const before = forSide(whiteChances[i]!, side);
    const after = forSide(whiteChances[i + 1]!, side);
    const drop = Math.max(0, before - after);
    const bestUci = bestMoveOf(evals[i]!);
    const playedEngineMove = engineMoves[i]!;
    const classification = forced[i] ? "best" : classifyMove(drop, playedEngineMove);
    const showBest = !forced[i] && !playedEngineMove && classification !== "best" && bestUci;
    const bestSan = showBest ? uciToSan(move.fenBefore, bestUci) : undefined;

    return {
      index: i,
      san: move.san,
      uci: move.uci,
      side,
      winChanceBefore: before,
      winChanceAfter: after,
      drop,
      accuracy: forced[i] ? 100 : perMove[i]!,
      classification,
      forced: forced[i]!,
      ...(bestSan ? { bestMoveSan: bestSan, bestMoveUci: bestUci } : {}),
      evalAfter: evals[i + 1]!,
    };
  });

  return {
    moves: reviewed,
    evals,
    white: playerTotals(reviewed, "white", white),
    black: playerTotals(reviewed, "black", black),
  };
}

/** Short display text for an evaluation, from white's view: "+1.3", "-0.4", "M3", "-M2", "1-0", "½-½". */
export function formatEval(evaluation: PositionEval): string {
  switch (evaluation.type) {
    case "over":
      return evaluation.result === 1 ? "1-0" : evaluation.result === -1 ? "0-1" : "½-½";
    case "mate":
      return evaluation.value > 0 ? `M${evaluation.value}` : `-M${Math.abs(evaluation.value)}`;
    case "cp": {
      const pawns = evaluation.value / 100;
      if (Math.abs(pawns) < 0.05) return "0.0";
      return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
    }
  }
}
