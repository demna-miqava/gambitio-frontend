import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, Eye } from "lucide-react";
import { type PuzzleStatus } from "../../types/puzzle.types";

interface PuzzleActionButtonsProps {
  status: PuzzleStatus;
  onRetry: () => void;
  onNextPuzzle: () => void;
  onHint: () => void;
  onShowSolution: () => void;
  /** Timed modes load the next puzzle themselves after a result */
  autoAdvance?: boolean;
}

export const PuzzleActionButtons = ({
  status,
  onRetry,
  onNextPuzzle,
  onHint,
  onShowSolution,
  autoAdvance = false,
}: PuzzleActionButtonsProps) => {
  if (autoAdvance && status !== "solving") return null;

  return (
    <div className="flex flex-col gap-2">
      {status === "failed" && (
        <div className="flex gap-2 w-full">
          <Button size="md" onClick={onRetry} variant="outline" className="flex-1">
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
          <Button size="md" onClick={onShowSolution} variant="outline" className="flex-1">
            <Eye aria-hidden="true" />
            Solution
          </Button>
        </div>
      )}

      {status === "success" && (
        <Button size="md"
          onClick={onNextPuzzle}
          className="w-full gap-2"
        >
          Next puzzle
          <ArrowRight aria-hidden="true" />
        </Button>
      )}

      {status === "solving" && (
        <Button
          onClick={onHint}
          variant="ghost"
          size="sm"
          className="h-9 w-full text-muted-foreground"
        >
          Show a hint
        </Button>
      )}
    </div>
  );
};
