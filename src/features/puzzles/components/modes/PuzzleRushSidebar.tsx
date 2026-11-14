import { useRushMode } from "@/features/puzzles/contexts/PuzzleContext";
import { PuzzleControls } from "../shared/PuzzleControls";
import { PuzzleFeedNotice } from "../shared/PuzzleFeedNotice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Play, Trophy, X } from "lucide-react";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const PuzzleRushSidebar = () => {
  const { phase, timeLeft, score, strikes, maxStrikes, best, isGameOver, restart, puzzle } =
    useRushMode();
  const beforeRun = phase === "ready" || phase === "countdown";

  return (
    <div className="space-y-3">
      <div className="flex h-12 items-center justify-between rounded-xl bg-card px-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-5" aria-hidden="true" />
          <span className="text-sm font-medium">Time left</span>
        </div>
        <span
          role="timer"
          className={cn(
            "text-2xl font-medium tabular-nums",
            phase === "playing" && timeLeft < 30 ? "text-loss" : "text-foreground"
          )}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex h-16 flex-col justify-center rounded-xl bg-card px-3">
          <span className="text-xs font-medium text-muted-foreground">Solved</span>
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-2xl font-medium tabular-nums text-foreground"
          >
            <span className="sr-only">Solved </span>
            {score}
          </span>
        </div>
        <div className="flex h-16 flex-col justify-center rounded-xl bg-card px-3">
          <span className="text-xs font-medium text-muted-foreground">Strikes</span>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1 flex gap-1.5"
          >
            <span className="sr-only">{`${strikes} of ${maxStrikes} strikes`}</span>
            {Array.from({ length: maxStrikes }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  "flex size-6 items-center justify-center rounded-full transition-colors",
                  i < strikes
                    ? "bg-loss text-loss-foreground"
                    : "border-2 border-dashed border-muted-foreground/40"
                )}
              >
                {i < strikes && <X className="size-3.5" strokeWidth={3} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {beforeRun &&
        (puzzle ? (
          <p className="rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            Solve as many puzzles as you can before the clock runs out. A wrong move is a strike and
            skips to the next puzzle; {maxStrikes} strikes end the run.
          </p>
        ) : (
          <PuzzleFeedNotice />
        ))}

      {phase === "playing" && <PuzzleControls />}

      {isGameOver && (
        <Button onClick={restart} className="w-full" size="lg">
          <Play aria-hidden="true" />
          Play again
        </Button>
      )}

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Trophy className="size-3.5" aria-hidden="true" />
        Personal best: <span className="font-medium tabular-nums text-foreground">{best}</span>
      </p>
    </div>
  );
};
