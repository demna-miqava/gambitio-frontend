import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { StoredGameListItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchiveGameRoute } from "@/constants/routes";
import { getResult } from "../utils/gameResult";
import { ResultBadge } from "./ResultBadge";
import { TimeControlCell } from "./TimeControlCell";
import { BotTag } from "./PlayerCell";
import { isBotPlayer } from "@/utils/storedGame";
import { fullMoves } from "@/utils/moves";

interface GameListProps {
  games: StoredGameListItem[];
  userId?: number;
  isLoading: boolean;
  rows: number;
  emptyState: React.ReactNode;
}

/** Phone layout for the games table: one tappable row per game. */
export const GameList = ({ games, userId, isLoading, rows, emptyState }: GameListProps) => {
  if (isLoading) {
    return (
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card">{emptyState}</div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
      {games.map((game) => (
        <li key={game.id}>
          <Link
            to={getArchiveGameRoute(game.id)}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="flex min-w-0 items-center text-sm font-medium text-foreground">
                <span className="truncate">{game.whitePlayer.username}</span>
                {isBotPlayer(game, game.whitePlayer) && (
                  <BotTag className="ml-1.5" />
                )}
                <span className="shrink-0 px-1.5 font-normal text-muted-foreground">vs</span>
                <span className="truncate">{game.blackPlayer.username}</span>
                {isBotPlayer(game, game.blackPlayer) && (
                  <BotTag className="ml-1.5" />
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TimeControlCell type={game.type} time={game.time} increment={game.increment} />
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{fullMoves(game.numMoves ?? 0)} moves</span>
                <span aria-hidden="true">·</span>
                <span>{format(new Date(game.createdAt), "MMM d")}</span>
              </div>
            </div>
            <ResultBadge result={game.status === "in_progress" ? "live" : getResult(game, userId)} />
          </Link>
        </li>
      ))}
    </ul>
  );
};
