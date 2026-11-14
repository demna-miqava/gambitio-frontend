import { cn } from "@/lib/utils";
import type { GameReview, MoveReview, Side } from "../types";
import { CLASSIFICATION_META } from "../classificationMeta";
import { nextMoveOfType, type FlaggedClassification } from "../utils/chipNavigation";
import { formatAccuracy } from "../utils/formatAccuracy";
import { SideDot } from "./SideDot";

const SIDES: Side[] = ["white", "black"];

const CHIPS: { classification: FlaggedClassification; key: "inaccuracies" | "mistakes" | "blunders"; one: string; many: string }[] = [
  { classification: "inaccuracy", key: "inaccuracies", one: "inaccuracy", many: "inaccuracies" },
  { classification: "mistake", key: "mistakes", one: "mistake", many: "mistakes" },
  { classification: "blunder", key: "blunders", one: "blunder", many: "blunders" },
];

interface ReviewPlayerRowsProps {
  /** Null while there's no review yet: names only, with a dash for accuracy */
  review: GameReview | null;
  players: { white: string; black: string };
  /** Position on the board (-1 in a variation) */
  currentIndex: number;
  /** Go to a position of the game */
  onJump: (index: number) => void;
}

/**
 * One row per player: colour, name, accuracy, then inaccuracy / mistake /
 * blunder counts. Each count is a button that goes to that player's next
 * move of that kind, wrapping around to the first.
 */
export const ReviewPlayerRows = ({ review, players, currentIndex, onJump }: ReviewPlayerRowsProps) => {
  const currentMove: MoveReview | undefined = review && currentIndex > 0 ? review.moves[currentIndex - 1] : undefined;

  return (
    <ul aria-label="Accuracy and errors per player" className="space-y-1">
      {SIDES.map((side) => {
        const name = players[side];
        const stats = review?.[side];
        return (
          <li key={side} className="flex h-7 items-center gap-2">
            <SideDot side={side} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={name}>
              {name}
              <span className="sr-only">{`, ${side}`}</span>
            </span>
            <span
              className={cn(
                "w-14 shrink-0 text-right text-sm font-medium tabular-nums",
                stats ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="sr-only">accuracy </span>
              {formatAccuracy(stats?.accuracy ?? null)}
            </span>
            {/* Same width with or without a review, so nothing shifts when it lands */}
            <span className="flex w-34 shrink-0 justify-end gap-2">
              {review &&
                stats &&
                CHIPS.map(({ classification, key, one, many }) => {
                  const count = stats[key];
                  const meta = CLASSIFICATION_META[classification];
                  const target = nextMoveOfType(review.moves, side, classification, currentIndex);
                  const isCurrent = currentMove?.side === side && currentMove.classification === classification;
                  const noun = count === 1 ? one : many;
                  return (
                    <button
                      key={classification}
                      type="button"
                      disabled={target === null}
                      onClick={() => target !== null && onJump(target)}
                      aria-label={
                        count === 0
                          ? `${name}: no ${many}`
                          : `${name}: ${count} ${noun}. Go to the ${count === 1 ? "" : "next "}${one}`
                      }
                      title={count === 0 ? `No ${many}` : `${count} ${noun}: go to the ${count === 1 ? "" : "next "}${one}`}
                      data-current={isCurrent || undefined}
                      className={cn(
                        // 24px chip with a 32px hit area (gap-2 keeps neighbours' areas apart)
                        "relative inline-flex h-6 w-10 items-center justify-center gap-1 rounded-md border border-border bg-background text-xs tabular-nums transition-colors",
                        "after:absolute after:-inset-1 after:content-['']",
                        "hover:border-foreground/25 hover:bg-accent",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                        "disabled:pointer-events-none disabled:opacity-45",
                        "data-current:border-foreground/40 data-current:bg-accent"
                      )}
                    >
                      <span aria-hidden="true" className={cn("font-bold", meta.textClass)}>
                        {meta.glyph}
                      </span>
                      <span aria-hidden="true" className={cn(count > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
