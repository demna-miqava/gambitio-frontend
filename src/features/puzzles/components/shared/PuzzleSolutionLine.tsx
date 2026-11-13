import { useMemo } from "react";
import type { Puzzle } from "../../types/puzzle.types";
import { formatSolutionLine } from "../../utils/solutionLine";

/** The puzzle's solution in SAN, shown once it's solved or revealed. */
export const PuzzleSolutionLine = ({ puzzle }: { puzzle: Puzzle }) => {
  const line = useMemo(() => formatSolutionLine(puzzle.fen, puzzle.moves), [puzzle]);
  if (line.length === 0) return null;

  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <h3 className="mb-1 text-xs font-medium text-muted-foreground">Solution</h3>
      <ol className="flex flex-wrap gap-x-1.5 gap-y-0.5 font-mono text-sm leading-relaxed text-foreground">
        {line.map((move, idx) => (
          <li key={idx} className="whitespace-nowrap">
            {move.moveNumber && (
              <span className="mr-1 tabular-nums text-muted-foreground">{move.moveNumber}</span>
            )}
            {move.san}
          </li>
        ))}
      </ol>
    </div>
  );
};
