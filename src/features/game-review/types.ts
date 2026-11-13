/**
 * Evaluation of one position, always from white's point of view.
 * - cp: centipawns
 * - mate: moves to mate, positive when white mates
 * - over: the game has ended on the board (1 white won, -1 black won, 0 draw)
 */
export type PositionEval =
  | { type: "cp"; value: number; bestMove?: string }
  | { type: "mate"; value: number; bestMove?: string }
  | { type: "over"; result: 1 | 0 | -1 };

export type MoveClassification = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export type Side = "white" | "black";

/** A move of the game as the review sees it */
export interface ReviewMove {
  san: string;
  uci: string;
  /** Position the move was played from */
  fenBefore: string;
}

export interface MoveReview {
  /** Index in the game (0 = first move) */
  index: number;
  san: string;
  uci: string;
  side: Side;
  /** Mover's winning chances, -1..1, before and after the move */
  winChanceBefore: number;
  winChanceAfter: number;
  /** winChanceBefore - winChanceAfter, never below 0 */
  drop: number;
  /** Lichess-style accuracy of this move, 0-100 */
  accuracy: number;
  classification: MoveClassification;
  /** The only legal move: not judged, and left out of the player's accuracy */
  forced: boolean;
  /** Engine's choice, when it differs from the move played */
  bestMoveSan?: string;
  bestMoveUci?: string;
  /** Evaluation after the move */
  evalAfter: PositionEval;
}

export interface PlayerReview {
  /** 0-100, or null when the player made no judged moves */
  accuracy: number | null;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
}

export interface GameReview {
  moves: MoveReview[];
  /** One per position, starting with the initial position (moves.length + 1) */
  evals: PositionEval[];
  white: PlayerReview;
  black: PlayerReview;
}
