import { cn } from "@/lib/utils";

export interface ResultCounts {
  wins: number;
  draws: number;
  losses: number;
}

const PARTS = [
  { key: "wins", label: "Won", dot: "bg-win" },
  { key: "draws", label: "Drawn", dot: "bg-draw" },
  { key: "losses", label: "Lost", dot: "bg-loss" },
] as const;

const percent = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/**
 * Won / drawn / lost as one thin segmented bar with a legend underneath.
 * The legend carries the numbers (in text colours, beside a colour dot), so
 * the bar itself needs no labels or hover to be read.
 */
export const ResultsBar = ({
  wins,
  draws,
  losses,
  className,
}: ResultCounts & { className?: string }) => {
  const counts = { wins, draws, losses };
  const total = wins + draws + losses;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        // A 2px gap between parts (the surface shows through) separates
        // them without relying on the colours alone
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${wins} won, ${draws} drawn, ${losses} lost`}
      >
        {total > 0 &&
          PARTS.map(({ key, dot }) =>
            counts[key] > 0 ? (
              <span
                key={key}
                className={cn("h-full first:rounded-l-full last:rounded-r-full", dot)}
                style={{ flexGrow: counts[key], flexBasis: 0 }}
              />
            ) : null
          )}
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {PARTS.map(({ key, label, dot }) => (
          <div key={key} className="rounded-xl bg-muted/50 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {counts[key].toLocaleString()}
              </span>
              {total > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {percent(counts[key], total)}%
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
