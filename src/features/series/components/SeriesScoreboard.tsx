import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileRoute } from "@/constants/routes";
import { formatTimeControl } from "@/utils/timeControl";
import { cn } from "@/lib/utils";
import type { SeriesPlayer, SeriesSummary } from "../types";
import {
  bestOfLabel,
  formatPoints,
  playersFor,
  seriesStatusLabel,
  spokenScoreline,
} from "../utils/seriesFormat";

const PlayerSide = ({
  player,
  isWinner,
  align,
}: {
  player: SeriesPlayer;
  isWinner: boolean;
  align: "start" | "end";
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
      {isWinner && <Crown className="size-4 shrink-0 text-gold" aria-label="Series winner" />}
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

  return (
    <section
      aria-label="Series score"
      className="rounded-2xl bg-card p-4 sm:p-6"
    >
      <p className="mb-4 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">
        <span>{bestOfLabel(series.bestOf)}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{formatTimeControl(series.time, series.increment)}</span>
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <PlayerSide player={left} isWinner={series.winnerId === left.id} align="start" />
        <p className="shrink-0 font-display-num text-4xl sm:text-5xl">
          <span className="sr-only">{`Score ${left.username} ${spokenScoreline(left, right)} ${right.username}`}</span>
          <span aria-hidden="true">
            {formatPoints(left.score)}
            <span className="px-1.5 text-muted-foreground">–</span>
            {formatPoints(right.score)}
          </span>
        </p>
        <PlayerSide player={right} isWinner={series.winnerId === right.id} align="end" />
      </div>
      <p
        className={cn(
          "mt-4 text-center text-sm font-medium",
          series.status === "active" ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {status}
      </p>
    </section>
  );
};
