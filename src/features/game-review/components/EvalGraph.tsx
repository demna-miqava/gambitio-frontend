import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { MoveReview, PositionEval } from "../types";
import { evalWinChance, toWinPercent } from "../utils/winChance";
import { formatEval } from "../utils/buildReview";
import { CLASSIFICATION_META, isFlagged } from "../classificationMeta";

interface EvalGraphProps {
  evals: PositionEval[];
  moves: MoveReview[];
  /** Label per position: "Start", then "1. e4", "1... e5", … */
  labels: string[];
  /** Position shown on the board, or -1 when it isn't part of the game */
  currentIndex: number;
  onSelect: (index: number) => void;
  /**
   * Short graph without the readout row above it (the desktop analysis
   * panel); the hovered position is shown inside the graph instead.
   */
  compact?: boolean;
}

function describe(labels: string[], moves: MoveReview[], evals: PositionEval[], index: number): string {
  const move = moves[index - 1];
  const parts = [labels[index] ?? "", formatEval(evals[index]!)];
  if (move && isFlagged(move.classification)) parts.push(CLASSIFICATION_META[move.classification].label.toLowerCase());
  return parts.join(", ");
}

/**
 * White's winning chances across the game, like the evaluation bar over
 * time: the light area is white's share. Click or use the arrow keys to jump
 * to a position; inaccuracies, mistakes and blunders are marked.
 */
export const EvalGraph = ({ evals, moves, labels, currentIndex, onSelect, compact = false }: EvalGraphProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const last = evals.length - 1;

  const winPercents = useMemo(() => evals.map((e) => toWinPercent(evalWinChance(e))), [evals]);
  const x = (i: number) => (last === 0 ? 50 : (i / last) * 100);
  const area = useMemo(() => {
    const step = winPercents.length > 1 ? 100 / (winPercents.length - 1) : 0;
    const points = winPercents.map((v, i) => `${i * step},${100 - v}`).join(" L");
    return { fill: `M0,100 L${points} L100,100 Z`, line: `M${points}` };
  }, [winPercents]);

  const indexAt = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    return Math.max(0, Math.min(last, Math.round(ratio * last)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = currentIndex < 0 ? 0 : currentIndex;
    const next =
      event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? from - 1
        : event.key === "ArrowRight" || event.key === "ArrowUp"
          ? from + 1
          : event.key === "PageDown"
            ? from - 10
            : event.key === "PageUp"
              ? from + 10
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? last
                  : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(Math.max(0, Math.min(last, next)));
  };

  const shown = hover ?? (currentIndex >= 0 ? currentIndex : null);
  const shownMove = shown !== null ? moves[shown - 1] : undefined;

  return (
    <div className={cn(!compact && "space-y-1.5")}>
      <div
        className={cn("flex h-5 items-center justify-between gap-2 text-xs text-muted-foreground", compact && "hidden")}
        aria-hidden="true"
      >
        <span className="truncate">
          {shown !== null ? (
            <>
              <span className="font-medium text-foreground">{labels[shown]}</span>
              {shownMove && isFlagged(shownMove.classification) && (
                <span className={cn("ml-1 font-medium", CLASSIFICATION_META[shownMove.classification].textClass)}>
                  {CLASSIFICATION_META[shownMove.classification].label}
                </span>
              )}
            </>
          ) : (
            "Evaluation"
          )}
        </span>
        {shown !== null && <span className="font-medium tabular-nums text-foreground">{formatEval(evals[shown]!)}</span>}
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Evaluation graph. Use the arrow keys to go to a move."
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={Math.max(0, currentIndex)}
        aria-valuetext={currentIndex >= 0 ? describe(labels, moves, evals, currentIndex) : "In a variation"}
        onKeyDown={handleKeyDown}
        onPointerMove={(e) => setHover(indexAt(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => onSelect(indexAt(e))}
        className={cn(
          "relative w-full cursor-pointer touch-pan-y select-none overflow-hidden rounded-md bg-neutral-600",
          compact ? "h-16" : "h-30",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        )}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          <path d={area.fill} className="fill-neutral-200" />
          <path
            d={area.line}
            fill="none"
            className="stroke-neutral-400"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={0}
            x2={100}
            y1={50}
            y2={50}
            className="stroke-neutral-500"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {compact && hover !== null && (
          <span
            className="pointer-events-none absolute top-1 left-1 flex max-w-[calc(100%-0.5rem)] items-center gap-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[11px] leading-4 text-foreground shadow-sm"
            aria-hidden="true"
          >
            <span className="truncate font-medium">{labels[hover]}</span>
            <span className="tabular-nums text-muted-foreground">{formatEval(evals[hover]!)}</span>
          </span>
        )}
        {hover !== null && hover !== currentIndex && (
          <span
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-sky-400/80"
            style={{ left: `${x(hover)}%` }}
            aria-hidden="true"
          />
        )}
        {currentIndex >= 0 && (
          <span
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-primary"
            style={{ left: `${x(currentIndex)}%` }}
            aria-hidden="true"
          />
        )}

        {moves.map((move) => {
          if (!isFlagged(move.classification)) return null;
          const index = move.index + 1;
          return (
            <span
              key={move.index}
              className={cn(
                "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-neutral-800",
                compact ? "size-1.5 ring-1" : "size-2 ring-[1.5px]",
                CLASSIFICATION_META[move.classification].dotClass
              )}
              style={{ left: `${x(index)}%`, top: `${100 - winPercents[index]!}%` }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
};
