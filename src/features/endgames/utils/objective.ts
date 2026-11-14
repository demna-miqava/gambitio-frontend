import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { EndgameExercise, EndgameObjective, ObjectiveEvaluation } from "../types";

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
 * Whether the opponent has a new piece from a promotion that they keep: a
 * piece just promoted that the player can take for free doesn't count yet.
 */
const opponentKeepsPromotion = (
  chess: Chess,
  opponent: Color,
  startPieces: number,
  lastMove: Move | undefined
): boolean => {
  if (pieceCount(chess, opponent) <= startPieces) return false;
  const justPromoted = lastMove?.color === opponent && lastMove.promotion;
  return !(justPromoted && isHanging(chess, lastMove.to));
};

const describeLimit = (objective: EndgameObjective): string => {
  switch (objective.type) {
    case "checkmate":
      return objective.maxMoves ? `${objective.maxMoves} moves` : "";
    case "promote":
      return objective.maxMoves ? `${objective.maxMoves} moves` : "";
    case "draw":
      return `${objective.surviveMoves} moves`;
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
  const startOpponentPieces = pieceCount(start, opponent);
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
            ? "Stalemate. The black king had no legal move but wasn't in check."
            : `The game is drawn by ${draw}.`
        );
      }
      if (opponentKeepsPromotion(chess, opponent, startOpponentPieces, lastMove)) {
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
      if (opponentKeepsPromotion(chess, opponent, startOpponentPieces, lastMove)) {
        return failure("Your opponent promoted first.");
      }
      if (pawnCount(chess, player) === 0) return failure("You have no pawns left to promote.");
      if (objective.maxMoves !== undefined && playerMoves >= objective.maxMoves) {
        return failure(`No promotion within ${objective.maxMoves} moves.`);
      }
      return playing();
    }

    case "draw": {
      if (draw) return success(`Drawn by ${draw}. Well defended!`);
      if (opponentKeepsPromotion(chess, opponent, startOpponentPieces, lastMove)) {
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
