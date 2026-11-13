import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpening } from "./useOpening";

interface OpeningNameProps {
  /** Positions from the start of the game to the one on the board */
  fens: readonly string[];
  className?: string;
}

/**
 * "B90 · Sicilian Defense: Najdorf Variation" for the line on the board.
 * Renders nothing until the line reaches a named position.
 */
export const OpeningName = ({ fens, className }: OpeningNameProps) => {
  const opening = useOpening(fens);
  if (!opening) return null;

  const full = `${opening.eco} · ${opening.name}`;
  return (
    <p
      className={cn("flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", className)}
      title={full}
    >
      <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">Opening: </span>
      <span className="shrink-0 font-semibold tabular-nums text-foreground/80">
        {opening.eco}
      </span>
      <span className="truncate">{opening.name}</span>
    </p>
  );
};
