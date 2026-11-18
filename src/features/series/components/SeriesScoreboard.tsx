import { Link } from "react-router-dom";
import { Crown, Flame } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileRoute } from "@/constants/routes";
import { formatTimeControl, formatTimeOdds, timeOdds } from "@/utils/timeControl";
import { cn } from "@/lib/utils";
import type { SeriesPlayer, SeriesSummary } from "../types";
import {
  formatPoints,
  isTimedMatch,
  playersFor,
  seriesFormatLabel,
  seriesStatusLabel,
  spokenScoreline,
  TIMED_STREAK_AFTER,
} from "../utils/seriesFormat";
import { MatchClock } from "./MatchClock";

const PlayerSide = ({
  player,
  isWinner,
  align,
  onStreak = false,
}: {
  player: SeriesPlayer;
  isWinner: boolean;
  align: "start" | "end";
  /** A timed match: their wins count double */
  onStreak?: boolean;
}) => (
  <Link
    to={getProfileRoute(player.id)}
    className={cn(
      "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:gap-3",
      align === "end" && "sm:flex-row-reverse sm:text-right",
      align === "start" && "sm:text-left"
    )}
  >
    <UserAvatar src={player.avatarUrl} username={player.username} className="size-12 shrink-0 sm:size-14" />
    <span className="flex min-w-0 max-w-full items-center gap-1.5">
      <span className="truncate font-medium">{player.username}</span>
      {isWinner && <Crown className="size-4 shrink-0 text-gold" aria-label="Winner" />}
      {onStreak && (
        <Flame className="size-4 shrink-0 text-primary" aria-label="On a streak: points count double" />
      )}
    </span>
  </Link>
);

/**
 * Both players and the score, big. The viewer (when playing) is on the left.
 */
export const SeriesScoreboard = ({
  series,
  viewerId,
}: {
  series: SeriesSummary;
  viewerId?: number;
}) => {
  const [left, right] = playersFor(series, viewerId);
  const status = seriesStatusLabel(series, viewerId);
  // Time odds: each player's clock, in the order they are shown
  const odds = timeOdds(left.time, right.time);
  const timed = isTimedMatch(series);
  const onStreak = (p: SeriesPlayer) =>
    timed && series.status === "active" && (p.streak ?? 0) >= TIMED_STREAK_AFTER;

  return (
    <section
      aria-label={timed ? "Match score" : "Series score"}
      className="rounded-2xl bg-card p-4 sm:p-6"
    >
      <p className="mb-4 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">
        <span>{seriesFormatLabel(series)}</span>
        {series.opening && (
          <>
            <span aria-hidden="true">·</span>
            <span>{series.opening.name}</span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {odds
            ? formatTimeOdds(odds[0], odds[1], series.increment)
            : formatTimeControl(series.time, series.increment)}
        </span>
        {(odds || series.rated === false) && (
          <>
            <span aria-hidden="true">·</span>
            <span>Unrated</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <PlayerSide player={left} isWinner={series.winnerId === left.id} align="start" onStreak={onStreak(left)} />
        <p className="shrink-0 font-display-num text-4xl sm:text-5xl">
          <span className="sr-only">{`Score ${left.username} ${spokenScoreline(left, right)} ${right.username}`}</span>
          <span aria-hidden="true">
            {formatPoints(left.score)}
            <span className="px-1.5 text-muted-foreground">–</span>
            {formatPoints(right.score)}
          </span>
        </p>
        <PlayerSide player={right} isWinner={series.winnerId === right.id} align="end" onStreak={onStreak(right)} />
      </div>
      <p
        className={cn(
          "mt-4 text-center text-sm font-medium",
          series.status === "active" ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {status}
      </p>
      {timed && <MatchClock series={series} size="lg" className="mt-3" />}
      {timed && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Arena points: a win scores 2 and a draw 1, doubled after two wins in a row.
        </p>
      )}
    </section>
  );
};
