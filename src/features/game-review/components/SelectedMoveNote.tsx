import { cn } from "@/lib/utils";
import type { MoveReview } from "../types";
import { CLASSIFICATION_META } from "../classificationMeta";
import { toWinPercent } from "../utils/winChance";

interface SelectedMoveNoteProps {
  /** Review of the move leading to the current position, if it's a game move */
  move: MoveReview | undefined;
  label: string | undefined;
  /** -1 in a variation, 0 at the start */
  currentIndex: number;
}

const ARTICLE: Record<MoveReview["classification"], string> = {
  best: "the best move",
  good: "a good move",
  inaccuracy: "an inaccuracy",
  mistake: "a mistake",
  blunder: "a blunder",
};

/** What the review says about the move on the board, including the engine's preferred move. */
export const SelectedMoveNote = ({ move, label, currentIndex }: SelectedMoveNoteProps) => {
  let content;
  if (currentIndex < 0) {
    content = <span className="text-muted-foreground">You're in a variation. The review covers the moves played in the game.</span>;
  } else if (!move || !label) {
    content = <span className="text-muted-foreground">Go to a move to see how it was judged.</span>;
  } else if (move.forced) {
    content = (
      <>
        <span className="font-medium">{label}</span> was the only legal move.
      </>
    );
  } else {
    const meta = CLASSIFICATION_META[move.classification];
    const before = Math.round(toWinPercent(move.winChanceBefore));
    const after = Math.round(toWinPercent(move.winChanceAfter));
    content = (
      <>
        <span className="font-medium">{label}</span> is{" "}
        <span className={cn("font-medium", meta.textClass)}>{ARTICLE[move.classification]}</span>.
        {move.bestMoveSan && (
          <>
            {" "}
            Best was <span className="font-medium">{move.bestMoveSan}</span>.
          </>
        )}
        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
          {move.side === "white" ? "White" : "Black"}'s winning chances: {before}% → {after}%
        </span>
      </>
    );
  }

  return (
    <p className="min-h-10 text-sm" aria-live="polite">
      {content}
    </p>
  );
};
