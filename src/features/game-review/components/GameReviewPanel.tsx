import { useId, useState, type ReactNode } from "react";
import { ChartSpline, ChevronDown, ChevronUp, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useGameReview, type GameReviewContextValue } from "../contexts/GameReviewContext";
import { REVIEW_ENGINE } from "../constants";
import { EvalGraph } from "./EvalGraph";
import { ReviewPlayerRows } from "./ReviewPlayerRows";
import { formatAccuracy } from "../utils/formatAccuracy";
import { SideDot } from "./SideDot";
import { VerdictLine } from "./VerdictLine";

/** Below this viewport height the block starts collapsed to one row */
export const SHORT_VIEWPORT_QUERY = "(max-height: 719px)";

const progressPercent = (progress: GameReviewContextValue["progress"]) => {
  const total = progress?.total ?? 0;
  return total > 0 ? Math.round(((progress?.done ?? 0) / total) * 100) : 0;
};

const ProgressBar = ({ percent, className }: { percent: number; className?: string }) => (
  <div
    role="progressbar"
    aria-label="Reviewing game"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
    className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
  >
    <div
      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
      style={{ width: `${percent}%` }}
    />
  </div>
);

/** The graph's slot before the review is ready: same 64px box in every state */
const SlotBox = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex h-full items-center rounded-md bg-muted/50 px-3", className)}>{children}</div>
);

/** One-line hint under the graph slot (same height as the verdict) */
const Hint = ({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) => (
  <p className={cn("h-5 truncate text-xs leading-5", tone === "error" ? "text-destructive" : "text-muted-foreground")}>
    {children}
  </p>
);

/**
 * The computer review in the desktop analysis panel: heading, one row per
 * player (accuracy and error counts that jump to the moves), a short
 * evaluation graph and the verdict on the move on the board.
 *
 * Every state (not started, running, failed, ready) fills the same slots,
 * so the block keeps its height (about 190px) as the review moves along.
 * On short viewports it starts as a single row with both accuracies.
 * Renders nothing where no review is offered.
 */
export const GameReviewPanel = ({ className }: { className?: string }) => {
  const state = useGameReview();
  const isShort = useMediaQuery(SHORT_VIEWPORT_QUERY);
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const bodyId = useId();
  if (!state) return null;

  const { status, progress, review, start, cancel, retry, players, positionLabels, currentIndex, goToPosition } = state;
  const ready = status === "ready" && review !== null;
  const collapsed = isShort && !(expanded && ready);
  const percent = progressPercent(progress);

  const heading = (
    <h3 id={headingId} className="shrink-0 text-base font-display text-foreground">
      Game review
    </h3>
  );

  let content: ReactNode;
  if (collapsed) {
    // One row: heading, then the state in brief
    let brief: ReactNode;
    switch (status) {
      case "ready":
        brief = (
          <button
            type="button"
            aria-expanded={false}
            onClick={() => setExpanded(true)}
            className="-mr-1.5 ml-auto flex h-8 min-w-0 items-center gap-3 rounded-md px-1.5 text-sm font-medium tabular-nums text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {(["white", "black"] as const).map((side) => (
              <span key={side} className="flex items-center gap-1.5">
                <SideDot side={side} />
                <span className="sr-only">{`${players[side]} accuracy`}</span>
                {formatAccuracy(review?.[side].accuracy ?? null)}
              </span>
            ))}
            <span className="sr-only">Show the full review</span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        );
        break;
      case "idle":
        brief = (
          <Button size="sm" variant="outline" onClick={start} className="ml-auto">
            <ChartSpline aria-hidden="true" />
            Review game
          </Button>
        );
        break;
      case "running":
        brief = (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <ProgressBar percent={percent} className="w-20" />
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{percent}%</span>
            <Button size="icon" variant="ghost" onClick={cancel} aria-label="Cancel game review" className="size-8">
              <X aria-hidden="true" />
            </Button>
          </div>
        );
        break;
      case "error":
        brief = (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span role="alert" className="truncate text-xs text-destructive">
              Review failed
            </span>
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          </div>
        );
        break;
      case "empty":
        brief = <span className="ml-auto truncate text-xs text-muted-foreground">No moves to review yet</span>;
        break;
    }
    content = (
      <div className="flex h-8 items-center gap-3">
        {heading}
        {brief}
      </div>
    );
  } else {
    let graph: ReactNode;
    let hint: ReactNode;
    switch (status) {
      case "ready":
        graph = review && (
          <EvalGraph
            compact
            evals={review.evals}
            moves={review.moves}
            labels={positionLabels}
            currentIndex={currentIndex}
            onSelect={goToPosition}
          />
        );
        hint = review && (
          <VerdictLine
            move={currentIndex > 0 ? review.moves[currentIndex - 1] : undefined}
            label={currentIndex > 0 ? positionLabels[currentIndex] : undefined}
            currentIndex={currentIndex}
          />
        );
        break;
      case "idle":
        graph = (
          <SlotBox className="justify-center bg-background">
            <Button size="sm" onClick={start}>
              <ChartSpline aria-hidden="true" />
              Review game
            </Button>
          </SlotBox>
        );
        hint = <Hint>Accuracy and mistakes for every move, computed in your browser.</Hint>;
        break;
      case "running": {
        const total = progress?.total ?? 0;
        graph = (
          <SlotBox className="gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <ProgressBar percent={percent} />
              <p className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                <Loader2 className="size-3 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span className="truncate">
                  {total > 0
                    ? `Analysing position ${Math.min((progress?.done ?? 0) + 1, total)} of ${total}…`
                    : "Starting the engine…"}
                </span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={cancel} aria-label="Cancel game review">
              <X aria-hidden="true" />
              Cancel
            </Button>
          </SlotBox>
        );
        hint = <Hint>You can keep analysing while the review runs.</Hint>;
        break;
      }
      case "error":
        graph = (
          <SlotBox className="justify-between gap-3 bg-destructive/5 ring-1 ring-inset ring-destructive/25">
            <p role="alert" className="min-w-0 text-xs leading-snug text-destructive">
              The review couldn't finish.
            </p>
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          </SlotBox>
        );
        hint = <Hint>The engine may have failed to load.</Hint>;
        break;
      case "empty":
        graph = (
          <SlotBox className="justify-center bg-background">
            <p className="text-xs text-muted-foreground">There are no moves to review yet.</p>
          </SlotBox>
        );
        hint = <Hint>Make a move on the board to start.</Hint>;
        break;
    }

    content = (
      <div id={bodyId}>
        <div className="flex h-5 items-center justify-between gap-2">
          {heading}
          <div className="flex min-w-0 items-center gap-1">
            {ready && (
              <span className="truncate text-xs text-muted-foreground">Stockfish, depth {REVIEW_ENGINE.depth}</span>
            )}
            {isShort && ready && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setExpanded(false)}
                aria-expanded
                aria-controls={bodyId}
                aria-label="Collapse the review"
                className="-my-1.5 -mr-1.5 size-8"
              >
                <ChevronUp aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2">
          <ReviewPlayerRows
            review={ready ? review : null}
            players={players}
            currentIndex={currentIndex}
            onJump={goToPosition}
          />
        </div>
        <div className="mt-2.5 h-16">{graph}</div>
        <div className="mt-2">{hint}</div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={status === "running" || undefined}
      data-review-panel=""
      className={cn("px-4 py-3", className)}
    >
      {content}
    </section>
  );
};
