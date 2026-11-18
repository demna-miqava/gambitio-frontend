import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { getSeriesRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { SeriesSummary } from "../types";
import {
  formatScoreline,
  isTimedMatch,
  playersFor,
  seriesNoun,
  seriesOutcomeFor,
  seriesStatusLabel,
} from "../utils/seriesFormat";
import { MatchClock } from "./MatchClock";

/**
 * After a series game: the series result when it's over, or the score and
 * who has white next while it goes on.
 */
export const SeriesResultNote = ({
  series,
  viewerId,
  className,
}: {
  series: SeriesSummary;
  viewerId?: number;
  className?: string;
}) => {
  const [left, right] = playersFor(series, viewerId);
  const outcome = seriesOutcomeFor(series, viewerId);
  const over = series.status === "finished";
  const timed = isTimedMatch(series);
  const noun = seriesNoun(series);

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-center",
        outcome === "won" && "bg-win-bg text-win",
        outcome === "lost" && "bg-loss-bg text-loss",
        (outcome === "drawn" || outcome === "active" || outcome === null) && "bg-muted/60",
        className
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium">
        {over && <Trophy className="size-4" aria-hidden="true" />}
        {over
          ? seriesStatusLabel(series, viewerId)
          : `${timed ? "Match" : "Series"} score ${formatScoreline(left, right)}`}
        {over && <span className="tabular-nums">({formatScoreline(left, right)})</span>}
      </p>
      {timed && !over && (
        <p className="text-xs text-muted-foreground">
          The next game starts in a moment · <MatchClock series={series} />
        </p>
      )}
      <Link
        to={getSeriesRoute(series.id)}
        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        View {noun}
      </Link>
    </div>
  );
};
