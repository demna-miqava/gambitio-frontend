import { cn } from "@/lib/utils";
import type { MoveClassification, MoveReview } from "../types";
import { CLASSIFICATION_META } from "../classificationMeta";
import { toWinPercent } from "../utils/winChance";
import { ClassificationGlyph } from "./ClassificationGlyph";

interface VerdictLineProps {
  /** Review of the move leading to the current position, if it's a game move */
  move: MoveReview | undefined;
  label: string | undefined;
  /** -1 in a variation, 0 at the start */
  currentIndex: number;
}

const VERDICT: Record<MoveClassification, string> = {
  best: "Best move.",
  good: "Good move.",
  inaccuracy: "Inaccuracy.",
  mistake: "Mistake.",
  blunder: "Blunder.",
};

/**
 * The review's verdict on the move on the board, on one line: "4... c4??
 * Blunder. Best was Nc6." and the mover's winning chances before → after.
 * Announced politely as you step through the game.
 */
export const VerdictLine = ({ move, label, currentIndex }: VerdictLineProps) => {
  let main;
  let side = null;
  if (currentIndex < 0) {
    main = <span className="text-muted-foreground">In a variation. The review covers the game's moves.</span>;
  } else if (!move || !label) {
    main = <span className="text-muted-foreground">Go to a move to see how it was judged.</span>;
  } else if (move.forced) {
    main = (
      <>
        <span className="font-semibold text-foreground">{label}</span>{" "}
        <span className="text-muted-foreground">Only legal move.</span>
      </>
    );
  } else {
    const meta = CLASSIFICATION_META[move.classification];
    main = (
      <>
        <span className="font-semibold text-foreground">{label}</span>
        <ClassificationGlyph classification={move.classification} />{" "}
        <span className={cn("font-semibold", meta.textClass)}>{VERDICT[move.classification]}</span>
        {move.bestMoveSan && (
          <>
            {" "}
            Best was <span className="font-semibold text-foreground">{move.bestMoveSan}</span>.
          </>
        )}
      </>
    );
    const before = Math.round(toWinPercent(move.winChanceBefore));
    const after = Math.round(toWinPercent(move.winChanceAfter));
    side = (
      <span
        className="shrink-0 text-xs tabular-nums text-muted-foreground"
        title={`${move.side === "white" ? "White" : "Black"}'s winning chances before and after the move`}
      >
        <span className="sr-only">{` ${move.side === "white" ? "White" : "Black"}'s winning chances: `}</span>
        {before}%<span aria-hidden="true"> → </span>
        <span className="sr-only"> to </span>
        {after}%
      </span>
    );
  }

  return (
    <p className="flex h-5 items-center gap-3 text-sm" aria-live="polite">
      <span className="min-w-0 flex-1 truncate">{main}</span>
      {side}
    </p>
  );
};
