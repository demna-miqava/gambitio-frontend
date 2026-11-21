import { forwardRef } from "react";
import { Loader2, Play, RotateCcw, Settings2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { perspectiveLabel, runStats, secondsLabel } from "../utils/coordinates";
import type { CoordinateOptions } from "../types";

interface RunResultProps {
  options: CoordinateOptions;
  score: number;
  misses: number;
  /** The best for these options including this run, as far as is known */
  best: number | null;
  newBest: boolean;
  saving: boolean;
  saveFailed: boolean;
  onRetrySave: () => void;
  onPlayAgain: () => void;
  onChangeOptions: () => void;
}

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-muted/60 px-3 py-2.5">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="text-xl font-medium tabular-nums text-foreground">{value}</dd>
  </div>
);

/** After a run: score, accuracy, time per square, the best, and Play again. */
export const RunResult = forwardRef<HTMLButtonElement, RunResultProps>(
  (
    { options, score, misses, best, newBest, saving, saveFailed, onRetrySave, onPlayAgain, onChangeOptions },
    playAgainRef
  ) => {
    const stats = runStats(score, misses, options.seconds);
    return (
      <section aria-labelledby="coord-result-heading" className="space-y-4">
        <div
          className={cn(
            "space-y-1 rounded-xl px-4 py-3",
            newBest ? "bg-win-bg text-win" : "bg-muted/60 text-foreground"
          )}
        >
          <h2 id="coord-result-heading" className="text-sm font-medium">
            {newBest ? (
              <span className="flex items-center gap-1.5">
                <Trophy className="size-4" aria-hidden="true" /> New personal best!
              </span>
            ) : (
              "Time's up"
            )}
          </h2>
          <p className="font-display-num text-5xl leading-none">
            {score}
            <span className="sr-only"> squares found</span>
          </p>
          <p className={cn("text-sm", newBest ? "text-win" : "text-muted-foreground")}>
            {`${secondsLabel(options.seconds)}, seen from ${perspectiveLabel(options.perspective)}`}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <Figure label="Accuracy" value={stats.accuracy === null ? "–" : `${stats.accuracy}%`} />
          <Figure
            label="Per square"
            value={stats.secondsPerSquare === null ? "–" : `${stats.secondsPerSquare.toFixed(2)} s`}
          />
          <Figure label="Best" value={best === null ? "–" : String(best)} />
        </dl>
        {misses > 0 && (
          <p className="text-sm text-muted-foreground">
            {misses} {misses === 1 ? "miss" : "misses"}
          </p>
        )}

        {saving && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
          </p>
        )}
        {saveFailed && (
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-loss" role="alert">
            Couldn't save this run.
            <Button variant="link" size="sm" className="h-auto p-0" onClick={onRetrySave}>
              <RotateCcw aria-hidden="true" /> Try again
            </Button>
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {/* Scrolled into view when the run ends: clear of the phone's bottom bar (AppLayout's padding for it) */}
          <Button
            ref={playAgainRef}
            size="lg"
            className="scroll-mb-[calc(5rem+env(safe-area-inset-bottom))] md:scroll-mb-4"
            onClick={onPlayAgain}
          >
            <Play aria-hidden="true" /> Play again
          </Button>
          <Button size="lg" variant="outline" onClick={onChangeOptions}>
            <Settings2 aria-hidden="true" /> Change options
          </Button>
        </div>
      </section>
    );
  }
);
RunResult.displayName = "RunResult";
