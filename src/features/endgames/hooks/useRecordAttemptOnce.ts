import { useEffect, useRef } from "react";
import type { ObjectiveEvaluation } from "../types";

/**
 * Saves each finished attempt of a practice game (useEndgameExercise) once:
 * `save` gets whether it succeeded and the player's move count. Returns the
 * number of the attempt last saved, for pages that also save attempts given
 * up (so that one isn't saved twice).
 */
export const useRecordAttemptOnce = (
  game: { result: ObjectiveEvaluation | null; attempt: number; playerMoves: number },
  save: (success: boolean, moves: number) => void
) => {
  const recordedAttempt = useRef<number | null>(null);
  const { result, attempt, playerMoves } = game;
  // The latest save, so a new callback each render doesn't re-run the effect
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!result || recordedAttempt.current === attempt) return;
    recordedAttempt.current = attempt;
    saveRef.current(result.status === "success", playerMoves);
  }, [result, attempt, playerMoves]);
  return recordedAttempt;
};
