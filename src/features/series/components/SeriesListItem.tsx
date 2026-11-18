import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getSeriesRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { SeriesSummary } from "../types";
import {
  seriesFormatLabel,
  formatScoreline,
  playersFor,
  seriesOutcomeFor,
  seriesStatusLabel,
  spokenScoreline,
} from "../utils/seriesFormat";

const OUTCOME_STYLES = {
  won: "bg-win-bg text-win",
  lost: "bg-loss-bg text-loss",
  drawn: "bg-draw-bg text-draw",
  active: "bg-brand-soft text-primary",
} as const;

const OUTCOME_LABELS = { won: "Won", lost: "Lost", drawn: "Drawn", active: "Live" } as const;

/**
 * A series in a list: the matchup, score and how it ended, from `perspectiveId`'s
 * side (the profile being viewed) when they played in it.
 */
export const SeriesListItem = ({
  series,
  perspectiveId,
  viewerId,
}: {
  series: SeriesSummary;
  /** Whose side the result badge shows */
  perspectiveId?: number;
  /** The signed-in user, to say "You" */
  viewerId?: number;
}) => {
  const [left, right] = playersFor(series, perspectiveId);
  const outcome = seriesOutcomeFor(series, perspectiveId) ?? (series.status === "active" ? "active" : null);

  return (
    <li>
      <Link
        to={getSeriesRoute(series.id)}
        className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {outcome && (
          <span
            className={cn(
              "inline-flex h-6 min-w-12 shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium",
              OUTCOME_STYLES[outcome]
            )}
          >
            {OUTCOME_LABELS[outcome]}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {left.username} <span className="text-muted-foreground">vs</span> {right.username}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {seriesFormatLabel(series)} · {seriesStatusLabel(series, viewerId)}
          </span>
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          <span className="sr-only">{`Score ${spokenScoreline(left, right)}`}</span>
          <span aria-hidden="true">{formatScoreline(left, right)}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
};
