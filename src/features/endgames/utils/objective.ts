import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { EndgameExercise, EndgameObjective, ObjectiveEvaluation } from "../types";
import type { EngineScore } from "@/features/play-bots/services/botEngine";

const PIECES: PieceSymbol[] = ["q", "r", "b", "n"];

const playing = (message = ""): ObjectiveEvaluation => ({ status: "playing", message });
const success = (message: string): ObjectiveEvaluation => ({ status: "success", message });
const failure = (message: string): ObjectiveEvaluation => ({ status: "failure", message });

/** Pieces other than kings and pawns, per colour. */
const pieceCount = (chess: Chess, color: Color): number =>
  chess
    .board()
    .flat()
    .filter((square) => square && square.color === color && PIECES.includes(square.type)).length;

const pawnCount = (chess: Chess, color: Color): number =>
  chess
    .board()
    .flat()
    .filter((square) => square && square.color === color && square.type === "p").length;

/**
 * Whether the side to move can take the piece on `square` without it being
 * taken back: the piece is simply lost. (The side to move is the opponent
 * of the piece's owner.)
 */
export const isHanging = (chess: Chess, square: Square): boolean => {
  const captures = chess.moves({ verbose: true }).filter((move) => move.to === square);
  return captures.some((capture) => {
    const after = new Chess(chess.fen());
    after.move(capture);
    const recaptured = after.moves({ verbose: true }).some((move) => move.to === square);
    return !recaptured;
  });
};

/** Why the game ended in a draw, in words, or null if it isn't a draw. */
export const drawReason = (chess: Chess): string | null => {
  if (chess.isStalemate()) return "stalemate";
  if (chess.isInsufficientMaterial()) return "insufficient material";
  if (chess.isThreefoldRepetition()) return "threefold repetition";
  if (chess.isDraw()) return "the 50-move rule";
  return null;
};

/**
 * Where the pieces `color` got by promoting stand after `moves`, followed
 * move by move (a count against the starting pieces misses a promotion
 * that only replaces a piece the player took earlier).
 */
const promotedSquares = (moves: Move[], color: Color): Set<Square> => {
  const squares = new Set<Square>();
  for (const move of moves) {
    if (move.color === color) {
      if (move.promotion) squares.add(move.to);
      else if (squares.delete(move.from)) squares.add(move.to);
    } else {
      // Taken
      squares.delete(move.to);
    }
  }
  return squares;
};

/**
 * Whether the opponent has a new piece from a promotion that they keep: a
 * piece just promoted that the player can take for free doesn't count yet.
 */
const opponentKeepsPromotion = (chess: Chess, opponent: Color, lastMove: Move | undefined): boolean => {
  const promoted = promotedSquares(chess.history({ verbose: true }), opponent);
  const justPromoted = lastMove?.color === opponent && lastMove.promotion;
  if (justPromoted && isHanging(chess, lastMove.to)) promoted.delete(lastMove.to);
  return promoted.size > 0;
};

const describeLimit = (objective: EndgameObjective): string => {
  switch (objective.type) {
    case "checkmate":
      return objective.maxMoves ? `${objective.maxMoves} moves` : "";
    case "promote":
      return objective.maxMoves ? `${objective.maxMoves} moves` : "";
    case "draw":
      return `${objective.surviveMoves} moves`;
    case "convert":
      return "";
  }
};

/** The objective in a short sentence, e.g. "Checkmate within 15 moves". */
export const objectiveLabel = (objective: EndgameObjective): string => {
  const limit = describeLimit(objective);
  switch (objective.type) {
    case "checkmate":
      return limit ? `Checkmate within ${limit}` : "Checkmate";
    case "promote":
      return limit
        ? `Promote a pawn safely within ${limit}`
        : "Promote a pawn without losing the new queen";
    case "draw":
      return `Hold the draw for ${limit}`;
    case "convert":
      return "Win it: checkmate, or keep the advantage until the engine resigns";
  }
};

/**
 * How an attempt stands after the latest move. `chess` holds the position
 * reached from the exercise's FEN, with the moves played in its history;
 * `playerMoves` counts the player's own moves.
 *
 * - checkmate: success on mate; failure when the player is mated, the game
 *   is drawn, the opponent keeps a promoted piece, or the move limit runs out.
 * - promote: success when the player promotes and the new piece can't be
 *   taken for free (or gives mate); failure when the new piece hangs, the
 *   player has no pawns left, the game is drawn or lost, or the limit runs out.
 * - draw: success on a draw by rule, or after `surviveMoves` moves; failure
 *   when the player is mated, the opponent keeps a promoted piece, or the
 *   player loses their last piece (e.g. the rook in a rook ending).
 */
export const evaluateObjective = (
  exercise: Pick<EndgameExercise, "fen" | "playerColor" | "objective">,
  chess: Chess,
  playerMoves: number
): ObjectiveEvaluation => {
  const { objective } = exercise;
  const player: Color = exercise.playerColor === "white" ? "w" : "b";
  const opponent: Color = player === "w" ? "b" : "w";
  const start = new Chess(exercise.fen);
  const lastMove = chess.history({ verbose: true }).at(-1);
  const draw = drawReason(chess);

  if (chess.isCheckmate()) {
    // The side to move is the one mated
    return chess.turn() === player
      ? failure("You were checkmated.")
      : success(objective.type === "draw" ? "Checkmate! Even better than a draw." : "Checkmate!");
  }

  switch (objective.type) {
    case "checkmate": {
      if (draw) {
        return failure(
          draw === "stalemate"
            ? `Stalemate. The ${opponent === "w" ? "white" : "black"} king had no legal move but wasn't in check.`
            : `The game is drawn by ${draw}.`
        );
      }
      if (opponentKeepsPromotion(chess, opponent, lastMove)) {
        return failure("The pawn promoted and the new piece survived.");
      }
      if (objective.maxMoves !== undefined && playerMoves >= objective.maxMoves) {
        return failure(`No mate within ${objective.maxMoves} moves.`);
      }
      if (lastMove?.color === opponent && lastMove.promotion) {
        return playing("The pawn promoted. Take the new piece!");
      }
      return playing();
    }

    case "promote": {
      const promoted = lastMove?.color === player && lastMove.promotion ? lastMove : undefined;
      if (promoted) {
        if (draw) return failure(`Promoting drew the game by ${draw}.`);
        if (isHanging(chess, promoted.to)) {
          return failure("The new piece can be taken for free.");
        }
        return success("Promoted, and the new piece is safe.");
      }
      if (draw) return failure(`The game is drawn by ${draw}.`);
      if (opponentKeepsPromotion(chess, opponent, lastMove)) {
        return failure("Your opponent promoted first.");
      }
      if (pawnCount(chess, player) === 0) return failure("You have no pawns left to promote.");
      if (objective.maxMoves !== undefined && playerMoves >= objective.maxMoves) {
        return failure(`No promotion within ${objective.maxMoves} moves.`);
      }
      return playing();
    }

    case "convert": {
      if (draw) return failure(`The game is drawn by ${draw}. The win slipped away.`);
      return playing();
    }

    case "draw": {
      if (draw) return success(`Drawn by ${draw}. Well defended!`);
      if (opponentKeepsPromotion(chess, opponent, lastMove)) {
        return failure("The pawn promoted and the new queen survived.");
      }
      const startPlayerPieces = pieceCount(start, player);
      if (startPlayerPieces > 0 && pieceCount(chess, player) === 0 && pieceCount(chess, opponent) > 0) {
        return failure("You lost your last piece.");
      }
      if (playerMoves >= objective.surviveMoves) {
        return success(`You held for ${objective.surviveMoves} moves. That's a draw.`);
      }
      if (lastMove?.color === opponent && lastMove.promotion) {
        return playing("The pawn promoted. Take the new piece!");
      }
      return playing();
    }
  }
};

/** The player's own moves in a list of moves. */
export const countPlayerMoves = (moves: Move[], playerColor: EndgameExercise["playerColor"]): number => {
  const code: Color = playerColor === "white" ? "w" : "b";
  return moves.filter((move) => move.color === code).length;
};

/**
 * In a conversion: the engine resigns once it sees a forced mate against it,
 * or once it has been at least RESIGN_CP behind for RESIGN_AFTER searches in
 * a row (it would be hopeless to play on, even at full strength).
 */
export const CONVERSION_RESIGN_CP = 1000;
export const CONVERSION_RESIGN_AFTER = 3;
/**
 * The win has slipped away once the player's advantage is below SLIPPED_CP
 * for SLIPPED_AFTER searches in a row (one alone could be the engine's
 * noise), or the engine sees a mate for itself.
 */
export const CONVERSION_SLIPPED_CP = 150;
export const CONVERSION_SLIPPED_AFTER = 2;

/** "+4.2", "mate in 3" or "−0.5", from the player's side */
export const formatAdvantage = (score: EngineScore): string => {
  if (score.type === "mate") {
    return score.value > 0 ? `mate in ${score.value}` : `being mated in ${-score.value}`;
  }
  const pawns = score.value / 100;
  return `${pawns >= 0 ? "+" : "−"}${Math.abs(pawns).toFixed(1)}`;
};

/**
 * The lead has dipped: the engine's latest score (its side) leaves the
 * player under CONVERSION_SLIPPED_CP, or sees a mate for itself. One dip
 * doesn't fail the attempt (conversionVerdict wants two in a row), but an
 * attempt given up after one counts as a miss.
 */
export const hasSlipped = (latest: EngineScore | null): boolean =>
  latest !== null && (latest.type === "mate" ? latest.value > 0 : -latest.value < CONVERSION_SLIPPED_CP);

/** A score from the engine's side, turned to the player's. */
const playerSide = (score: EngineScore): EngineScore => ({ type: score.type, value: -score.value });

/**
 * How a conversion stands, from the engine's scores after each of the
 * player's moves (its own side to move, oldest first). Null while it goes
 * on; otherwise success (the engine resigns) or failure (the win slipped).
 */
export const conversionVerdict = (engineScores: readonly EngineScore[]): ObjectiveEvaluation | null => {
  const latest = engineScores.at(-1);
  if (!latest) return null;
  if (latest.type === "mate" && latest.value < 0) {
    return success("Stockfish sees the mate coming and resigns. Converted!");
  }
  if (latest.type === "mate" && latest.value > 0) {
    return failure(`Now Stockfish is the one mating (${formatAdvantage(playerSide(latest))}). The win slipped away.`);
  }
  const recent = (count: number) => (engineScores.length >= count ? engineScores.slice(-count) : null);
  const hopeless = recent(CONVERSION_RESIGN_AFTER);
  if (hopeless?.every((s) => s.type === "cp" && s.value <= -CONVERSION_RESIGN_CP)) {
    return success("Stockfish resigns: it's hopelessly behind. Converted!");
  }
  const slipping = recent(CONVERSION_SLIPPED_AFTER);
  if (slipping?.every((s) => s.type === "cp" && -s.value < CONVERSION_SLIPPED_CP)) {
    return failure(`Your advantage is down to ${formatAdvantage(playerSide(latest))}. The win slipped away.`);
  }
  return null;
};
