import { Link } from "react-router-dom";
import { ChevronRight, Trophy } from "lucide-react";
import { getSeriesRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { SeriesSummary } from "../types";
import {
  bestOfLabel,
  isMirrorMatch,
  isTimedMatch,
  formatScoreline,
  playersFor,
  spokenScoreline,
} from "../utils/seriesFormat";
import { MatchClock } from "./MatchClock";

/**
 * One line above a series game's moves: "Best of 3 · Game 2 · alice 1–0
 * bobby" ("Mirror match 2/2" for a mirror match), linking to the series page.
 */
export const SeriesStrip = ({
  series,
  seriesGame,
  viewerId,
  className,
}: {
  series: SeriesSummary;
  /** This game's number in the series */
  seriesGame: number | null;
  viewerId?: number;
  className?: string;
}) => {
  const [left, right] = playersFor(series, viewerId);
  const timed = isTimedMatch(series);
  const gameLabel = timed
    ? seriesGame
      ? `Timed match · Game ${seriesGame}`
      : "Timed match"
    : !seriesGame
    ? bestOfLabel(series.bestOf)
    : isMirrorMatch(series.bestOf)
      ? `Mirror match ${seriesGame}/${series.bestOf}`
      : `Game ${seriesGame} of ${series.bestOf}`;
  const name = (id: number, username: string) => (id === viewerId ? "You" : username);

  return (
    <Link
      to={getSeriesRoute(series.id)}
      aria-label={`${gameLabel}. ${timed ? "Match" : "Series"} score: ${name(left.id, left.username)} ${spokenScoreline(left, right)} ${right.username}. Open the series`}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Trophy className="size-4 shrink-0 text-gold" aria-hidden="true" />
      <span className="shrink-0 font-medium">{gameLabel}</span>
      {timed && <MatchClock series={series} className="shrink-0 text-xs text-muted-foreground" />}
      <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">
        {name(left.id, left.username)}{" "}
        <span className="font-medium tabular-nums text-foreground">{formatScoreline(left, right)}</span>{" "}
        {right.username}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
};
