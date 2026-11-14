import { cn } from "@/lib/utils";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import type { PlayerColor } from "@/features/game/types/game.types";
import { SideDot } from "@/features/game-review/components/SideDot";

interface PuzzleCardHeaderProps {
  status: string;
  /** Side the player is solving for */
  side?: PlayerColor;
  rating?: number;
  /** SAN of the wrong move, when the attempt failed */
  wrongMove?: string;
  /** The solution was shown rather than solved */
  revealed?: boolean;
  /** Timed modes move on by themselves after a miss, so no "try again" */
  autoAdvance?: boolean;
}

/**
 * One compact row: whose move it is / result, plus the puzzle rating. It's
 * the panel's live region, so results (and the wrong move) are announced.
 */
const PuzzleCardHeader = ({
  status,
  side,
  rating,
  wrongMove,
  revealed = false,
  autoAdvance = false,
}: PuzzleCardHeaderProps) => {
  const shown = status === "success" && revealed;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium leading-snug",
        (status === "solving" || shown) && "bg-muted text-foreground",
        status === "success" && !shown && "bg-success-bg text-success",
        status === "failed" && "bg-loss-bg text-loss"
      )}
    >
      {status === "solving" && (
        <>
          {side && <SideDot side={side} className="size-3" />}
          <span>
            {side ? `Find the best move for ${side === "white" ? "White" : "Black"}` : "Find the best move"}
          </span>
        </>
      )}
      {status === "success" && !shown && (
        <>
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <span>Solved. Nicely done.</span>
        </>
      )}
      {shown && (
        <>
          <Eye className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>Here's the solution.</span>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircle className="size-5 shrink-0" aria-hidden="true" />
          <span>
            {wrongMove ? `${wrongMove} isn't the move.` : "Not quite."}
            {!autoAdvance && " Try again?"}
          </span>
        </>
      )}
      {rating !== undefined && (
        <span className="ml-auto shrink-0 rounded-md bg-background/60 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {rating}
        </span>
      )}
    </div>
  );
};

export default PuzzleCardHeader;
