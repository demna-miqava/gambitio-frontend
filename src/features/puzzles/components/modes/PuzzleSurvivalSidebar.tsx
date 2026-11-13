import { useSurvivalMode } from "@/features/puzzles/contexts/PuzzleContext";
import { PuzzleControls } from "../shared/PuzzleControls";
import { Button } from "@/components/ui/button";
import { Heart, Check, X, Play } from "lucide-react";

export const PuzzleSurvivalSidebar = () => {
  const context = useSurvivalMode();
  const { lives, history, isGameOver, restart } = context;

  return (
    <div className="space-y-3">
      <div className="flex h-12 items-center justify-between rounded-xl border border-border/70 bg-card px-3">
        <span className="text-sm font-medium text-muted-foreground">Lives</span>
        <div className="flex gap-1" aria-label={`${lives} of 3 lives left`}>
          {[1, 2, 3].map((i) => (
            <Heart
              key={i}
              className={`size-5 transition-all ${
                i <= lives
                  ? "fill-loss text-loss"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">This run</div>
          <ol className="flex flex-wrap gap-1.5">
            {history.map((result, idx) => (
              <li
                key={idx}
                className={`rounded-full p-1.5 ${
                  result ? "bg-success-bg text-success" : "bg-loss-bg text-loss"
                }`}
              >
                <span className="sr-only">{`Puzzle ${idx + 1}: ${result ? "solved" : "missed"}`}</span>
                {result ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : (
                  <X className="size-3" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!isGameOver && <PuzzleControls />}

      {isGameOver && (
        <Button onClick={restart} className="w-full" size="lg">
          <Play aria-hidden="true" />
          Play again
        </Button>
      )}
    </div>
  );
};
