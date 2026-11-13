import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useInfiniteMode } from "../../contexts";
import { formatRatingChange } from "../../utils/puzzleRating";

/** Infinite mode: the user's puzzle rating and the change from this puzzle. */
export const PuzzleRatingCard = () => {
  const { attempt } = useInfiniteMode();
  const { chessProfile } = useUser();
  const rating = chessProfile?.puzzleRating;

  let change: ReactNode = null;
  if (attempt?.status === "pending") {
    change = (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        <span className="sr-only">Saving result</span>
      </span>
    );
  } else if (attempt?.status === "error") {
    change = <span className="text-xs text-loss">Not saved</span>;
  } else if (attempt?.status === "done" && !attempt.rated) {
    change = (
      <span className="text-xs text-muted-foreground" title="You've tried this puzzle before">
        Unrated
      </span>
    );
  } else if (attempt?.status === "done") {
    const { ratingChange } = attempt;
    change = (
      <span className="flex items-baseline gap-1.5">
        {attempt.hintUsed && <span className="text-xs text-muted-foreground">Hint used</span>}
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            ratingChange > 0 && "text-rating-up",
            ratingChange < 0 && "text-rating-down",
            ratingChange === 0 && "text-muted-foreground"
          )}
        >
          <span className="sr-only">Rating change </span>
          {formatRatingChange(ratingChange)}
        </span>
      </span>
    );
  }

  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-border/70 bg-card px-3">
      <span className="text-sm font-medium text-muted-foreground">Puzzle rating</span>
      <div className="flex items-center gap-2.5" role="status" aria-live="polite" aria-atomic="true">
        {change}
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {rating ?? <span aria-label="Loading rating">–</span>}
        </span>
      </div>
    </div>
  );
};
