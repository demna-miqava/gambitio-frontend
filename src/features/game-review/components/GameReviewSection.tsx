import type { ReactNode } from "react";
import { ChartSpline, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameReview, type GameReviewContextValue } from "../contexts/GameReviewContext";
import { REVIEW_ENGINE } from "../constants";
import { ReviewSummary } from "./ReviewSummary";
import { EvalGraph } from "./EvalGraph";
import { SelectedMoveNote } from "./SelectedMoveNote";

const Shell = ({ children, busy = false }: { children: ReactNode; busy?: boolean }) => (
  <section
    aria-labelledby="game-review-heading"
    aria-busy={busy || undefined}
    className="space-y-3 rounded-xl border border-border/70 bg-card p-3"
  >
    {children}
  </section>
);

const Heading = ({ children }: { children?: ReactNode }) => (
  <div className="flex items-center justify-between gap-2">
    <h3 id="game-review-heading" className="text-sm font-semibold text-foreground">
      Game review
    </h3>
    {children}
  </div>
);

const Running = ({ progress, cancel }: Pick<GameReviewContextValue, "progress" | "cancel">) => {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <Heading>
        <Button variant="ghost" size="sm" onClick={cancel} aria-label="Cancel game review">
          <X aria-hidden="true" />
          Cancel
        </Button>
      </Heading>
      <div
        role="progressbar"
        aria-label="Reviewing game"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        {total > 0 ? `Analysing position ${Math.min(done + 1, total)} of ${total}…` : "Starting the engine…"}
      </p>
    </>
  );
};

/**
 * Computer review of the game: start/cancel, then both players' accuracy,
 * an evaluation graph and the verdict on the current move. Renders nothing
 * where no review is offered.
 */
export const GameReviewSection = ({ className }: { className?: string }) => {
  const reviewState = useGameReview();
  if (!reviewState) return null;
  const { status, progress, review, start, cancel, retry, players, positionLabels, currentIndex, goToPosition } =
    reviewState;

  let body;
  switch (status) {
    case "empty":
      body = (
        <>
          <Heading />
          <p className="text-sm text-muted-foreground">There are no moves to review yet.</p>
        </>
      );
      break;
    case "idle":
      body = (
        <>
          <Heading />
          <p className="text-sm text-muted-foreground">
            Accuracy, mistakes and an evaluation graph for every move, computed in your browser.
          </p>
          <Button onClick={start} className="w-full">
            <ChartSpline aria-hidden="true" />
            Review game
          </Button>
        </>
      );
      break;
    case "running":
      body = <Running progress={progress} cancel={cancel} />;
      break;
    case "error":
      body = (
        <>
          <Heading />
          <p role="alert" className="text-sm text-destructive">
            The review couldn't finish. The engine may have failed to load.
          </p>
          <Button variant="outline" onClick={retry} className="w-full">
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </>
      );
      break;
    case "ready":
      body = review && (
        <>
          <Heading>
            <span className="text-xs text-muted-foreground">Stockfish, depth {REVIEW_ENGINE.depth}</span>
          </Heading>
          <ReviewSummary review={review} players={players} />
          <EvalGraph
            evals={review.evals}
            moves={review.moves}
            labels={positionLabels}
            currentIndex={currentIndex}
            onSelect={goToPosition}
          />
          <SelectedMoveNote
            move={currentIndex > 0 ? review.moves[currentIndex - 1] : undefined}
            label={currentIndex > 0 ? positionLabels[currentIndex] : undefined}
            currentIndex={currentIndex}
          />
        </>
      );
      break;
  }

  return (
    <div className={cn(className)}>
      <Shell busy={status === "running"}>{body}</Shell>
    </div>
  );
};
