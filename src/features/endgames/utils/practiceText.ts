import type { Move } from "chess.js";
import { describeMove } from "@/features/play-bots/utils/describeMove";
import type { ObjectiveEvaluation, PracticePosition } from "../types";
import { objectiveLabel } from "./objective";

/** Who the player is up against in endgame exercises and conversion drills */
export const PRACTICE_ENGINE_NAME = "Stockfish";

const ENGINE_FAILED = "The engine couldn't start. Try reloading the page.";

/**
 * The position shown on a practice board: it follows move navigation, the
 * starting position (positions[0]) included
 */
export const shownFenOf = (game: { positions: string[]; navigation: { currentIndex: number } }): string =>
  game.positions[game.navigation.currentIndex] ?? game.positions[0];

/** The parts of a practice game (useEndgameExercise) the texts depend on */
export interface PracticeTextState {
  history: Move[];
  evaluation: ObjectiveEvaluation;
  result: ObjectiveEvaluation | null;
  thinking: boolean;
  engineError: boolean;
  isPlayerTurn: boolean;
}

/**
 * The words around a practice board (endgame exercise, conversion drill):
 * - status: the line under the objective
 * - announcement: for the screen-reader live region (the engine's reply,
 *   and what it led to)
 * - boardLabel: the board's accessible description
 */
export const practiceText = (game: PracticeTextState, position: PracticePosition) => {
  const { history, evaluation, result, thinking, engineError, isPlayerTurn } = game;
  const playerCode = position.playerColor === "white" ? "w" : "b";
  const lastMove = history.at(-1);
  const engineMoved = lastMove && lastMove.color !== playerCode;

  const status = engineError
    ? ENGINE_FAILED
    : result
      ? result.message
      : evaluation.message ||
        (thinking ? `${PRACTICE_ENGINE_NAME} is thinking…` : isPlayerTurn ? "Your move" : "Waiting…");

  const announcement = engineError
    ? ENGINE_FAILED
    : [engineMoved && `${PRACTICE_ENGINE_NAME} played ${describeMove(lastMove)}.`, result?.message ?? evaluation.message]
        .filter(Boolean)
        .join(" ");

  const boardLabel = [
    "Chess board",
    `You play ${position.playerColor}. ${objectiveLabel(position.objective)}`,
    lastMove &&
      `Last move: ${lastMove.color === playerCode ? "you" : PRACTICE_ENGINE_NAME} played ${describeMove(lastMove)}`,
    result?.message ?? (isPlayerTurn ? "Your move" : undefined),
  ]
    .filter(Boolean)
    .join(". ");

  return { status, announcement, boardLabel };
};
