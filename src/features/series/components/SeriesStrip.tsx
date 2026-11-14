import { Link } from "react-router-dom";
import { ChevronRight, Trophy } from "lucide-react";
import { getSeriesRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { SeriesSummary } from "../types";
import {
  bestOfLabel,
  formatScoreline,
  playersFor,
  spokenScoreline,
} from "../utils/seriesFormat";

/**
 * One line above a series game's moves: "Best of 3 · Game 2 · alice 1–0
 * bobby", linking to the series page.
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
  const gameLabel = seriesGame ? `Game ${seriesGame} of ${series.bestOf}` : bestOfLabel(series.bestOf);
  const name = (id: number, username: string) => (id === viewerId ? "You" : username);

  return (
    <Link
      to={getSeriesRoute(series.id)}
      aria-label={`${gameLabel}. Series score: ${name(left.id, left.username)} ${spokenScoreline(left, right)} ${right.username}. Open the series`}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Trophy className="size-4 shrink-0 text-gold" aria-hidden="true" />
      <span className="shrink-0 font-medium">{gameLabel}</span>
      <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">
        {name(left.id, left.username)}{" "}
        <span className="font-semibold tabular-nums text-foreground">{formatScoreline(left, right)}</span>{" "}
        {right.username}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
};
