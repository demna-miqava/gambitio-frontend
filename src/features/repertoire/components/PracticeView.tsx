import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Lightbulb, Loader2, RotateCcw, SkipForward, X } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { RepertoireLine } from "@/services/repertoire";
import { useLineDrill, type DrillFeedback } from "../hooks/useLineDrill";
import { useRecordPractice } from "../hooks/useRepertoire";
import { dueLabel, isDue, lineAccuracy, practiceOrder } from "../utils/lines";
import { MoveText } from "./MoveText";
import { RepertoireNav } from "./RepertoireNav";

const FeedbackNote = ({ feedback, failed }: { feedback: DrillFeedback | null; failed: boolean }) => {
  if (!feedback) return null;
  const tone =
    feedback.kind === "correct"
      ? failed
        ? "bg-muted text-foreground"
        : "bg-win-bg text-win"
      : feedback.kind === "other_line"
        ? "bg-muted text-foreground"
        : "bg-loss-bg text-loss";
  const text = (() => {
    switch (feedback.kind) {
      case "correct":
        return `${feedback.san} is right.`;
      case "other_line":
        return `${feedback.san} is your “${feedback.lineName}” line. This drill follows another one: try again.`;
      case "wrong":
        return `${feedback.san} isn't in this line. Play ${feedback.expected} (the arrow) to continue.`;
      case "hint":
        return `The line plays ${feedback.expected} (the arrow).`;
    }
  })();
  return <p className={cn("rounded-xl px-4 py-3 text-sm font-medium", tone)}>{text}</p>;
};

interface DrillProps {
  line: RepertoireLine;
  lines: RepertoireLine[];
  /** The next line to practise after this one, if any */
  nextLine: RepertoireLine | null;
  onNext: (line: RepertoireLine) => void;
  onRestart: () => void;
}

/** One run through one line. Remounted (by key) for every run. */
const LineDrill = ({ line, lines, nextLine, onNext, onRestart }: DrillProps) => {
  const record = useRecordPractice();
  const [result, setResult] = useState<boolean | null>(null);
  const onFinish = useCallback(
    (correct: boolean) => {
      setResult(correct);
      record.mutate({ id: line.id, correct });
    },
    // `record` is a new object each render; mutate is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [line.id, record.mutate]
  );
  const drill = useLineDrill(line, lines, onFinish);
  const accuracy = lineAccuracy(line);

  const board = (
    <BoardLayout
      boardRef={drill.boardRef}
      boardLabel={[
        `Practice board. You play ${line.color}.`,
        drill.playedText ? `Moves so far: ${drill.playedText}.` : "No moves yet.",
        drill.isPlayerTurn ? "Your move." : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );

  const sidebar = (
    <div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card lg:p-4">
      <RepertoireNav current="practice" className="hidden lg:block" />

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {line.color === "white" ? "White" : "Black"} line · {drill.ply}/{line.moves.length} moves
        </p>
        <h2 className="text-lg font-semibold text-foreground">{line.name}</h2>
        <p className="text-xs text-muted-foreground">
          {accuracy === null
            ? "First practice"
            : `${Math.round(accuracy * 100)}% recalled · streak ${line.streak}`}
        </p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Moves played"
        aria-valuemin={0}
        aria-valuemax={line.moves.length}
        aria-valuenow={drill.ply}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", drill.failed ? "bg-loss" : "bg-primary")}
          style={{ width: `${(drill.ply / line.moves.length) * 100}%` }}
        />
      </div>

      <div className="min-h-12 rounded-xl border border-border/70 px-3 py-2">
        {drill.playedMoves.length > 0 ? (
          <MoveText moves={drill.playedMoves} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {line.color === "white" ? "You move first." : "Your opponent moves first."}
          </p>
        )}
      </div>

      {drill.status === "playing" ? (
        <>
          <FeedbackNote feedback={drill.feedback} failed={drill.failed} />
          <TypedMoveInput onSubmit={drill.submitTypedMove} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="md" onClick={drill.showHint} disabled={!drill.isPlayerTurn}>
              <Lightbulb aria-hidden="true" /> Show move
            </Button>
            <Button variant="outline" size="md" onClick={onRestart}>
              <RotateCcw aria-hidden="true" /> Restart
            </Button>
          </div>
          {nextLine && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => onNext(nextLine)}>
              <SkipForward aria-hidden="true" /> Skip to next line
            </Button>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3",
              result ? "bg-win-bg text-win" : "bg-loss-bg text-loss"
            )}
          >
            {result ? <Check className="size-5" aria-hidden="true" /> : <X className="size-5" aria-hidden="true" />}
            <div className="text-sm">
              <p className="font-semibold">{result ? "Recalled perfectly" : "Finished with mistakes"}</p>
              <p className="text-xs opacity-90">
                {record.isPending ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Saving…
                  </span>
                ) : record.isError ? (
                  "Couldn't save this run."
                ) : record.data ? (
                  `${dueLabel(record.data.dueAt, Date.now())}.`
                ) : null}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {nextLine ? (
              <Button size="md" onClick={() => onNext(nextLine)}>
                <SkipForward aria-hidden="true" /> Next line
              </Button>
            ) : (
              <Button size="md" asChild>
                <Link to={ROUTES.REPERTOIRE}>All lines</Link>
              </Button>
            )}
            <Button size="md" variant="outline" onClick={onRestart}>
              <RotateCcw aria-hidden="true" /> Again
            </Button>
          </div>
          {nextLine && (
            <p className="text-xs text-muted-foreground">
              Next: {nextLine.name}
              {isDue(nextLine, Date.now()) ? " (due)" : ""}
            </p>
          )}
        </div>
      )}

      <Button variant="ghost" size="sm" className="self-start text-muted-foreground lg:hidden" asChild>
        <Link to={ROUTES.REPERTOIRE}>
          <ArrowLeft aria-hidden="true" /> Back to lines
        </Link>
      </Button>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {drill.announcement}
      </p>
    </div>
  );

  return <GameLayout board={board} sidebar={sidebar} bareBoard />;
};

interface PracticeViewProps {
  lines: RepertoireLine[];
  /** Line to start with (from the URL), else the most due one */
  startLineId: number | null;
  onLineChange: (lineId: number) => void;
}

/**
 * Practice: due lines first. The opponent's moves play themselves; the
 * player recalls their own. Each finished run is recorded and reschedules
 * the line.
 */
export const PracticeView = ({ lines, startLineId, onLineChange }: PracticeViewProps) => {
  const [run, setRun] = useState(0);
  const order = useMemo(() => practiceOrder(lines), [lines]);
  // Chosen once: finishing a run reschedules the line, which reorders the
  // queue, and the drill must not jump to another line under the player
  const [currentId, setCurrentId] = useState(() => startLineId ?? order[0]?.id ?? null);
  const line = lines.find((l) => l.id === currentId) ?? order[0] ?? null;
  // The next line by the schedule, never the one just practised
  const nextLine = order.find((l) => l.id !== line?.id) ?? null;

  if (!line) {
    return (
      <EmptyState
        title="Nothing to practise yet"
        description="Save lines from the analysis board, or add one by typing its moves."
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.REPERTOIRE}>Go to your lines</Link>
          </Button>
        }
      />
    );
  }

  return (
    <LineDrill
      key={`${line.id}:${run}`}
      line={line}
      lines={lines}
      nextLine={nextLine}
      onNext={(next) => {
        setRun((r) => r + 1);
        setCurrentId(next.id);
        onLineChange(next.id);
      }}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
};
