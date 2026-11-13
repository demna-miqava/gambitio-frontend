import { formatScore, formatPv } from "../utils/engineAnalysis.utils";
import type { EvaluationLine } from "../types";
import type { PlayerColor } from "@/features/game/types/game.types";
import { cn } from "@/lib/utils";

interface AnalysisLineItemProps {
  line: EvaluationLine;
  fen: string;
  playerColor: PlayerColor;
  /** Plays the line's first move; makes the line clickable */
  onPlay?: () => void;
}

export const AnalysisLineItem = ({
  line,
  fen,
  playerColor,
  onPlay,
}: AnalysisLineItemProps) => {
  const content = (
    // 44px with the border on touch screens, 38px otherwise
    <div className="relative flex h-9 items-center gap-2 px-3 pointer-coarse:h-[42px] lg:px-4">
      <span className="w-11 shrink-0 text-sm font-semibold tabular-nums">
        {formatScore(line, playerColor)}
      </span>
      <span className="truncate text-sm text-foreground/90">
        {formatPv(line.pv, fen)}
      </span>
    </div>
  );

  const className = "relative w-full overflow-hidden rounded-md border border-border/50 bg-muted/30";

  if (!onPlay) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onPlay}
      title="Play this move"
      className={cn(
        className,
        "text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {content}
    </button>
  );
};
