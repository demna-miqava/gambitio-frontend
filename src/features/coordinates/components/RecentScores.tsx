import { formatDistanceToNowStrict } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { perspectiveLabel, secondsLabel } from "../utils/coordinates";
import type { CoordinateRun } from "../types";

/**
 * The latest runs with the chosen options, newest first, each with a bar
 * against the best so progress shows at a glance.
 */
export const RecentScores = ({
  runs,
  best,
  seconds,
  perspective,
  pending,
  error,
}: {
  runs: CoordinateRun[];
  best: number | null;
  seconds: number;
  perspective: CoordinateRun["perspective"];
  pending: boolean;
  error: boolean;
}) => {
  const scale = Math.max(best ?? 0, ...runs.map((r) => r.score), 1);
  return (
    <section aria-labelledby="coord-recent-heading" className="space-y-2">
      <h2 id="coord-recent-heading" className="text-sm font-medium text-foreground">
        Recent scores{" "}
        <span className="font-normal text-muted-foreground">
          · {secondsLabel(seconds)}, {perspectiveLabel(perspective)}
        </span>
      </h2>
      {pending ? (
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">Couldn't load your scores.</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No runs with these options yet.</p>
      ) : (
        <ol className="space-y-1">
          {runs.map((run) => (
            <li key={run.id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm">
              <span className="text-right font-medium tabular-nums text-foreground">{run.score}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${(run.score / scale) * 100}%` }}
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(run.createdAt), { addSuffix: true })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
