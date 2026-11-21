import { Link } from "react-router-dom";
import { BookOpen, CircleCheck, CircleSlash, Swords, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ResultBadge } from "@/features/game-table/components/ResultBadge";
import { ROUTES, getArchiveGameRoute } from "@/constants/routes";
import { cn, formatShortDate } from "@/lib/utils";
import type { GameCheckStatus, RepertoireGameCheck } from "@/services/repertoire";
import { useRepertoireCheck } from "../hooks/useRepertoire";
import { describeCheck, listMoves, moveLabel, summarizeChecks } from "../utils/check";

const STATUS: Record<GameCheckStatus, { label: string; icon: LucideIcon; className: string }> = {
  followed: { label: "Followed", icon: CircleCheck, className: "bg-win-bg text-win" },
  you_deviated: { label: "You deviated", icon: UserRound, className: "bg-loss-bg text-loss" },
  opponent_deviated: { label: "Opponent deviated", icon: Swords, className: "bg-brand-soft text-primary" },
  not_covered: { label: "Not covered", icon: CircleSlash, className: "bg-muted text-muted-foreground" },
};

const GameRow = ({ game }: { game: RepertoireGameCheck }) => {
  const status = STATUS[game.status];
  const d = game.divergence;
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
            <status.icon className="size-3.5" aria-hidden="true" />
            {status.label}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            vs {game.opponent.username}
          </span>
          <span className="text-xs text-muted-foreground">
            as {game.color} · {formatShortDate(game.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{describeCheck(game)}</p>
        {d && game.status === "you_deviated" && d.lineNames.length > 0 && (
          <p className="text-xs text-muted-foreground">From: {d.lineNames.join(", ")}</p>
        )}
        {d && game.status === "opponent_deviated" && (
          <p className="text-xs text-muted-foreground">
            Worth preparing a reply to {moveLabel(d.moveNumber, d.color, d.played)} (your lines cover{" "}
            {listMoves(d.expected)}).
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ResultBadge result={game.outcome} />
        <Button variant="outline" size="sm" asChild>
          <Link to={getArchiveGameRoute(game.gameId)}>
            Open game<span className="sr-only"> against {game.opponent.username}</span>
          </Link>
        </Button>
      </div>
    </li>
  );
};

/** Recent games, each compared with the repertoire for the colour played. */
export const GamesView = ({ hasLines }: { hasLines: boolean }) => {
  const { data: games, isPending, isError, refetch, isFetching } = useRepertoireCheck();

  if (isPending) {
    return (
      <ul className="space-y-2" aria-busy="true" aria-label="Loading games">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </ul>
    );
  }
  if (isError) {
    return (
      <EmptyState
        title="Couldn't compare your games"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Try again
          </Button>
        }
      />
    );
  }
  if (games.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="No finished games yet"
        description="Play a few games and see where they leave your preparation."
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.PLAY}>Play a game</Link>
          </Button>
        }
      />
    );
  }

  const summary = summarizeChecks(games);
  // Games that reached a line at all: the others say nothing about it
  const covered = summary.total - summary.notCovered;
  return (
    <div className="space-y-4">
      {!hasLines && (
        <EmptyState
          icon={BookOpen}
          compact
          title="Your repertoire is empty"
          description="Save lines first; then each game shows where it left them."
        />
      )}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Followed your lines", value: summary.followed },
          { label: "You deviated", value: summary.youDeviated },
          { label: "Opponent deviated", value: summary.opponentDeviated },
          { label: "Not covered", value: summary.notCovered },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-2xl font-medium tabular-nums text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        {summary.youDeviated > 0
          ? `You left your preparation in ${summary.youDeviated} of your last ${summary.total} games.`
          : covered === 0
            ? `None of your last ${summary.total} games reached your lines.`
            : covered < summary.total
              ? `You stayed in your preparation in every game that reached it (${covered} of your last ${summary.total}).`
              : `You stayed in your preparation in all of your last ${summary.total} games.`}
      </p>
      <ul className="space-y-2">
        {games.map((game) => (
          <GameRow key={game.gameId} game={game} />
        ))}
      </ul>
    </div>
  );
};
