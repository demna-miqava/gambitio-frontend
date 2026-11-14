import type { PlayerColor } from "@/features/game/types/game.types";

export type EndgameCategory =
  | "Checkmates"
  | "King and pawn"
  | "Opposition"
  | "Queen endgames"
  | "Rook endgames";

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
  | { type: "draw"; surviveMoves: number };

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
