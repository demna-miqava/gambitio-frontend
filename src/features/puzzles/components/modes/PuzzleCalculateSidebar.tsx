import { useEffect, useRef } from "react";
import { ArrowRight, Check, CheckCircle2, Delete, Heart, Loader2, Play, Send, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { SideDot } from "@/features/game-review/components/SideDot";
import { useCalculateMode } from "../../contexts";
import { PuzzleFeedNotice } from "../shared/PuzzleFeedNotice";
import { PuzzleThemes } from "../shared/PuzzleThemes";
import { isPlayerIndex, moveLabels } from "../../utils/calculateLine";
import { movesToEnter } from "../../utils/calculateAttempt";
import { PUZZLE_CONFIG } from "../../constants/puzzle.constants";

const LIVES = PUZZLE_CONFIG.CALCULATE.INITIAL_LIVES;
const sideName = (side: "white" | "black") => (side === "white" ? "White" : "Black");

/** The line as slots: one per move of the solution, the player's own marked. */
const LineSlots = ({
  fen,
  sans,
  length,
  played = 0,
  mark,
  label,
}: {
  fen: string;
  sans: string[];
  length: number;
  /** Moves at the start already played on the board (after a reply predicted differently) */
  played?: number;
  /** Index of the move to mark wrong (red) or as the reply that differed (amber) */
  mark?: { index: number; kind: "wrong" | "differs" };
  label: string;
}) => {
  const labels = moveLabels(fen, length);
  return (
    <ol aria-label={label} className="grid grid-cols-2 gap-1 text-sm">
      {labels.map((number, i) => {
        const san = sans[i];
        const own = isPlayerIndex(i);
        const marked = mark?.index === i ? mark.kind : null;
        const isPlayed = i < played;
        return (
          <li
            key={i}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-lg px-2.5",
              own ? "bg-muted" : "bg-muted/50",
              isPlayed && "opacity-60",
              marked === "wrong" && "bg-loss-bg text-loss",
              marked === "differs" && "text-blitz ring-1 ring-blitz ring-inset"
            )}
          >
            <span className="tabular-nums text-xs text-muted-foreground">{number}</span>
            {san ? (
              <span className={cn("font-medium", !own && "font-normal")}>{san}</span>
            ) : (
              <span className="text-muted-foreground/60" aria-label={own ? "your move, not entered" : "reply, not entered"}>
                {own ? "?" : "…"}
              </span>
            )}
            <span className="sr-only">
              {own ? " (your move)" : " (reply)"}
              {isPlayed && ", played"}
              {marked === "wrong" && ", wrong"}
              {marked === "differs" && ", not what was played"}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export const PuzzleCalculateSidebar = () => {
  const context = useCalculateMode();
  const {
    puzzle,
    lives,
    history,
    isGameOver,
    runFinished,
    restart,
    attempt,
    enteredSan,
    solutionSan,
    differed,
    requiredMoves,
    canSubmit,
    entryError,
    addTypedMove,
    removeLast,
    clearLine,
    submit,
    isReplaying,
    onNextPuzzle,
    best,
  } = context;
  const { orientation, flipBoard } = useChessBoardContext();
  useFlipBoardKey(flipBoard);

  const entering = attempt.phase === "entering" && !isGameOver;
  const canRemove = attempt.entered.length > attempt.fixed;
  useShortcutKey("Backspace", removeLast, entering && canRemove);

  const nextRef = useRef<HTMLButtonElement>(null);
  const missedAfterReplay = attempt.phase === "done" && attempt.verdict?.result === "failed" && !isGameOver;
  useEffect(() => {
    if (missedAfterReplay) nextRef.current?.focus();
  }, [missedAfterReplay]);

  const livesRow = (
    <div className="flex h-12 items-center justify-between rounded-xl bg-card px-3">
      <span className="text-sm font-medium text-muted-foreground">Lives</span>
      <div className="flex gap-1" role="img" aria-label={`${lives} of ${LIVES} lives left`}>
        {Array.from({ length: LIVES }, (_, i) => (
          <Heart
            key={i}
            aria-hidden="true"
            className={cn("size-5 transition-all", i < lives ? "fill-loss text-loss" : "text-muted-foreground/30")}
          />
        ))}
      </div>
    </div>
  );

  const historyRow = history.length > 0 && (
    <div className="rounded-xl bg-card px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>This run</span>
        {best > 0 && <span className="tabular-nums">Best {best}</span>}
      </div>
      <ol className="flex flex-wrap gap-1.5">
        {history.map((solved, idx) => (
          <li
            key={idx}
            className={cn("rounded-full p-1.5", solved ? "bg-success-bg text-success" : "bg-loss-bg text-loss")}
          >
            <span className="sr-only">{`Puzzle ${idx + 1}: ${solved ? "solved" : "missed"}`}</span>
            {solved ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </div>
  );

  // Once the last line (after a miss, the solution) has played out
  if (runFinished) {
    return (
      <div className="space-y-3">
        {livesRow}
        {historyRow}
        <Button onClick={restart} className="w-full" size="lg">
          <Play aria-hidden="true" />
          Play again
        </Button>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="space-y-3">
        {livesRow}
        <section className="w-full lg:rounded-2xl lg:bg-card lg:p-4">
          <PuzzleFeedNotice />
        </section>
      </div>
    );
  }

  const side = puzzle.fen.split(" ")[1] === "b" ? "black" : "white";
  const opponent = side === "white" ? "black" : "white";
  const verdict = attempt.verdict;
  const left = movesToEnter(puzzle.moves.length, attempt.fixed);
  const own = attempt.fixed > 0 ? left.own : requiredMoves;
  const replies = left.replies;
  const asked = `${own} ${attempt.fixed > 0 ? "more " : ""}${own === 1 ? "move" : "moves"} of yours`;

  let header: React.ReactNode;
  let tone: "neutral" | "success" | "loss" = "neutral";
  if (attempt.phase === "entering") {
    header = (
      <>
        <SideDot side={side} className="size-3" />
        <span>
          {differed && `${sideName(opponent)} played ${differed.real}, not ${differed.predicted}. No penalty: `}
          {differed
            ? `enter the rest of the line from here, ${asked}`
            : `${sideName(side)} to play. Enter ${asked}`}
          {replies > 0 && ` and ${sideName(opponent)}'s ${replies === 1 ? "reply" : `${replies} replies`}`}
          {"."}
        </span>
      </>
    );
  } else if (verdict?.result === "solved") {
    tone = "success";
    header = (
      <>
        <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
        <span>{attempt.differed ? "Solved." : "Solved: you saw the whole line."}</span>
      </>
    );
  } else if (verdict?.result === "failed") {
    tone = "loss";
    header = (
      <>
        <XCircle className="size-5 shrink-0" aria-hidden="true" />
        <span>{`${enteredSan[verdict.index] ?? "That"} isn't the move. Here's the solution.`}</span>
      </>
    );
  } else if (verdict?.result === "reply-differs") {
    // Only while the line plays up to the real reply; then the rest is entered
    header = <span>Your moves were right so far. Playing the line…</span>;
  }

  return (
    <div className="space-y-3">
      {livesRow}
      {historyRow}

      <section className="w-full space-y-3 lg:rounded-2xl lg:bg-card lg:p-4">
        <div className="flex items-center gap-2">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium leading-snug",
              tone === "neutral" && "bg-muted text-foreground",
              tone === "success" && "bg-success-bg text-success",
              tone === "loss" && "bg-loss-bg text-loss"
            )}
          >
            {header}
            <span className="ml-auto shrink-0 rounded-md bg-background/60 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {puzzle.rating}
            </span>
          </div>
          <FlipBoardButton onFlip={flipBoard} orientation={orientation} />
        </div>

        {attempt.phase === "entering" && (
          <>
            <p className="text-xs text-muted-foreground">
              The board stays put. Tap a piece, then its square, or type the moves. Nothing tells you
              whether a move is right until you submit.
            </p>
            <LineSlots
              fen={puzzle.fen}
              sans={enteredSan}
              length={puzzle.moves.length}
              played={attempt.fixed}
              label="Your line"
            />
            {entryError && (
              <p role="alert" className="text-xs text-loss">
                {entryError}
              </p>
            )}
            <TypedMoveInput
              onSubmit={addTypedMove}
              revealOnFocus={false}
              label="Type the next move"
              hint="Enter adds it to your line. Backspace (outside the field) removes the last move."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={removeLast}
                disabled={!canRemove}
                aria-keyshortcuts="Backspace"
              >
                <Delete aria-hidden="true" />
                Remove last
              </Button>
              <Button variant="ghost" onClick={clearLine} disabled={!canRemove}>
                Clear
              </Button>
            </div>
            <Button className="w-full" size="lg" onClick={submit} disabled={!canSubmit}>
              <Send aria-hidden="true" />
              Submit line
            </Button>
          </>
        )}

        {verdict && (
          <div className="space-y-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Your line</div>
              <LineSlots
                fen={puzzle.fen}
                sans={enteredSan}
                length={attempt.entered.length}
                played={attempt.fixed}
                label="Your line"
                mark={
                  verdict.result === "failed"
                    ? { index: verdict.index, kind: "wrong" }
                    : verdict.result === "reply-differs"
                      ? { index: verdict.index, kind: "differs" }
                      : undefined
                }
              />
            </div>
            {verdict.result !== "solved" && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Solution</div>
                <LineSlots
                  fen={puzzle.fen}
                  sans={verdict.result === "failed" ? solutionSan : solutionSan.slice(0, verdict.index + 1)}
                  length={verdict.result === "failed" ? solutionSan.length : verdict.index + 1}
                  label="Solution"
                />
              </div>
            )}
          </div>
        )}

        {isReplaying && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Playing the line on the board…
          </p>
        )}

        {missedAfterReplay && (
          <Button ref={nextRef} className="w-full" onClick={onNextPuzzle}>
            Next puzzle
            <ArrowRight aria-hidden="true" />
          </Button>
        )}

        {/* Themes are hints, so not before the puzzle is over */}
        {attempt.phase === "done" && (
          <PuzzleThemes themes={puzzle.themes} />
        )}
      </section>
    </div>
  );
};
