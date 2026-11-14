import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getArchiveGameRoute, getGameRoute } from "@/constants/routes";
import { ResultBadge } from "@/features/game-table/components/ResultBadge";
import { getResult } from "@/features/game-table/utils/gameResult";
import type { StoredGameListItem } from "@/types";
import { cn } from "@/lib/utils";

const SCORE: Record<string, string> = {
  white_win: "1–0",
  black_win: "0–1",
  draw: "½–½",
};

const REASONS: Record<string, string> = {
  checkmate: "checkmate",
  resignation: "resignation",
  timeout: "time",
  timeout_vs_insufficient_material: "time vs insufficient material",
  stalemate: "stalemate",
  draw_agreement: "agreement",
  threefold_repetition: "repetition",
  insufficient_material: "insufficient material",
  fifty_move_rule: "50-move rule",
};

/** The games of a series in order, each linking to its replay (or the live game). */
export const SeriesGamesList = ({
  games,
  viewerId,
  liveGameId,
}: {
  games: StoredGameListItem[];
  viewerId?: number;
  liveGameId: number | null;
}) => {
  const isPlayer = (g: StoredGameListItem) =>
    viewerId !== undefined && (g.whitePlayer.id === viewerId || g.blackPlayer.id === viewerId);

  return (
    <ol className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
      {games.map((game) => {
        const live = game.id === liveGameId || game.status === "in_progress";
        const aborted = game.result === "aborted";
        const reason = game.endReason ? REASONS[game.endReason] : undefined;
        return (
          <li key={game.id}>
            <Link
              to={live ? getGameRoute(game.id) : getArchiveGameRoute(game.id)}
              className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
                Game {game.seriesGame ?? "–"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  <span className="font-medium">{game.whitePlayer.username}</span>
                  <span className="text-muted-foreground"> (white) vs </span>
                  <span className="font-medium">{game.blackPlayer.username}</span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {live
                    ? "Being played now"
                    : aborted
                      ? "Aborted · doesn't count"
                      : reason
                        ? `By ${reason}`
                        : ""}
                </span>
              </span>
              {live ? (
                <span className="inline-flex h-6 items-center rounded-full bg-brand-soft px-2.5 text-xs font-semibold text-primary">
                  Live
                </span>
              ) : aborted ? null : isPlayer(game) ? (
                <ResultBadge result={getResult(game, viewerId)} />
              ) : (
                <span className={cn("text-sm font-semibold tabular-nums")}>
                  {game.result ? SCORE[game.result] : ""}
                </span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
};
