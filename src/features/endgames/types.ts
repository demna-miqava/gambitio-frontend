import type { PlayerColor } from "@/features/game/types/game.types";

export type EndgameCategory =
  | "Checkmates"
  | "King and pawn"
  | "Opposition"
  | "Pawn races"
  | "Minor pieces"
  | "Queen endgames"
  | "Rook endgames"
  | "Rook vs minor piece";

export type EndgameDifficulty = "beginner" | "intermediate" | "advanced";

/**
 * What the player has to achieve. Moves are counted as the player's own
 * moves (not half-moves).
 */
export type EndgameObjective =
  /** Deliver checkmate, within `maxMoves` if set */
  | { type: "checkmate"; maxMoves?: number }
  /** Promote a pawn to a piece the opponent can't simply take, within `maxMoves` if set */
  | { type: "promote"; maxMoves?: number }
  /**
   * Hold the draw: reach a draw by rule (stalemate, insufficient material,
   * repetition, 50 moves) or last `surviveMoves` moves without the opponent
   * keeping a new queen or giving mate
   */
  | { type: "draw"; surviveMoves: number }
  /**
   * Win a won position (conversion drills): checkmate, or keep the advantage
   * until the engine resigns. Failure is a draw, a loss, or the advantage
   * slipping away (see conversionVerdict)
   */
  | { type: "convert" };

/** What the board hook needs to play a position against the engine */
export type PracticePosition = Pick<EndgameExercise, "fen" | "playerColor" | "objective">;

export interface EndgameExercise {
  /** Slug, also the key the server stores progress under */
  id: string;
  title: string;
  category: EndgameCategory;
  difficulty: EndgameDifficulty;
  fen: string;
  /** The side the player plays; always the side to move in `fen` */
  playerColor: PlayerColor;
  objective: EndgameObjective;
  /** The idea, in a few sentences */
  lesson: string;
  /** Shown one at a time, from a nudge to the full idea */
  hints: string[];
  /** Moves a strong player needs (for a checkmate, with best defence) */
  par?: number;
}

/** Progress on one exercise, as GET /endgames/progress returns it */
export interface EndgameProgress {
  exerciseId: string;
  attempts: number;
  completedAt: string | null;
  bestMoves: number | null;
}

export type ObjectiveStatus = "playing" | "success" | "failure";

export interface ObjectiveEvaluation {
  status: ObjectiveStatus;
  /** What happened (or, while playing, what to watch out for); empty when there's nothing to say */
  message: string;
}
