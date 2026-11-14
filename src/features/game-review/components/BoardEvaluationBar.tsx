import { useState } from "react";
import { EvaluationBar, EvaluationBarView, useAnalysis } from "@/features/engine-analysis";
import type { PositionEval } from "../types";
import { useGameReview } from "../contexts/GameReviewContext";
import { evalBarValue } from "../utils/evalBar";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";

/**
 * The evaluation bar beside an analysis board: the live engine's while it's
 * on, otherwise the game review's evaluation of the position on the board
 * (once the review is ready). In a variation the review has no evaluation,
 * so the last one stays, faded. Nothing when there's neither.
 */
export const BoardEvaluationBar = () => {
  const { engineEnabled } = useAnalysis();
  // Turns with the board: the bottom side's share fills from the bottom
  const { orientation } = useChessBoardContext();
  const reviewState = useGameReview();
  const reviewed =
    reviewState?.status === "ready" && reviewState.review && reviewState.currentIndex >= 0
      ? reviewState.review.evals[reviewState.currentIndex]
      : undefined;

  // Last reviewed position shown, kept while in a variation
  const [held, setHeld] = useState<PositionEval | undefined>(reviewed);
  if (reviewed && reviewed !== held) setHeld(reviewed);

  if (engineEnabled) return <EvaluationBar bottom={orientation} />;
  if (reviewState?.status !== "ready") return null;
  const shown = reviewed ?? held;
  if (!shown) return null;

  const value = evalBarValue(shown);
  return (
    <EvaluationBarView
      {...value}
      muted={!reviewed}
      bottom={orientation}
      spokenLabel={reviewed ? value.spokenLabel : `${value.spokenLabel}, before this variation`}
    />
  );
};
