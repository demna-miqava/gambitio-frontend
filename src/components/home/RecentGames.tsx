import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import { BotTag } from "@/features/game-table/components/PlayerCell";
import { useUserGames } from "@/features/game-table/hooks/useUserGames";
import { getResult } from "@/features/game-table/utils/gameResult";
import { loadOpenings, loadedOpenings, type OpeningTable } from "@/features/openings/openings";
import { formatAccuracy } from "@/features/game-review/utils/formatAccuracy";
import RatingDelta from "@/features/stats/components/RatingDelta";
import { getGameReviewRoute, getGameRoute, getProfileGamesRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { isBotPlayer } from "@/utils/storedGame";
import { fullMoves } from "@/utils/moves";
import { cn } from "@/lib/utils";
import type { StoredGameListItem } from "@/types";
import { HOME_GAMES_LIMIT, HOME_GAMES_QUERY } from "./constants";
import { formatOfGame, openingOfGame, sideOf } from "./recentGame";
import { playedLabel } from "@/utils/playedLabel";

const RESULTS = {
  win: { label: "Won", className: "bg-win-bg text-win" },
  loss: { label: "Lost", className: "bg-loss-bg text-loss" },
  draw: { label: "Draw", className: "bg-muted text-muted-foreground" },
  aborted: { label: "Aborted", className: "bg-muted text-muted-foreground" },
  // A game still being played (the list shows it too)
  live: { label: "Playing", className: "bg-primary-soft text-primary" },
} as const;

// The columns that step aside as the panel narrows, the least needed first
const MOVES = "@max-[760px]:hidden";
const ACCURACY = "@max-[680px]:hidden";
const OPENING = "@max-[580px]:hidden";
const PLAYED = "@max-[420px]:hidden";

const th = "px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-faint first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5";
const td = "border-t border-border px-3 py-[11px] align-middle first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5";
const num = "text-right tabular-nums";

/** The opening table, fetched once there is a game to name */
const useOpeningTable = (wanted: boolean) => {
  const [table, setTable] = useState<OpeningTable | null>(loadedOpenings);
  const load = wanted && !table;
  useEffect(() => {
    if (!load) return;
    let current = true;
    loadOpenings()
      .then((loaded) => current && setTable(loaded))
      // The column stays empty; the next visit tries again
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [load]);
  return table;
};

/**
 * Home's recent games: how each went, against whom (their name opens their
 * card) and at what speed, the opening it went into, the accuracy of your
 * own play (once you have run the game's review), how long it was, what it
 * did to your rating, when, and a link to review it.
 *
 * As the panel narrows, columns step aside in the order they can be missed:
 * moves, accuracy, opening, then when. What is left on a phone is the
 * result, the opponent, the rating change and Review.
 *
 * `maxRows`: how many of the fetched games to show (Home passes what fits).
 */
export const RecentGames = ({ maxRows = HOME_GAMES_LIMIT }: { maxRows?: number }) => {
  const { id: userId } = useUser();
  // The same request as the New game panel and Home itself: one fetch
  const { games, isPending, isError, refetch } = useUserGames(HOME_GAMES_QUERY);
  const shown = games.slice(0, maxRows);
  const table = useOpeningTable(games.some((game) => game.pgn));
  const openings = useMemo(
    () => new Map(games.map((game) => [game.id, table ? openingOfGame(table, game.pgn) : null])),
    [games, table]
  );

  return (
    <section aria-labelledby="recent-games-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="recent-games-title" className="font-display text-xl leading-tight sm:text-[22px]">
          Recent games
        </h2>
        {games.length > 0 && (
          <Link
            to={getProfileGamesRoute(userId || 0)}
            className="relative touch-target text-[13px] font-semibold text-primary underline-offset-[3px] hover:underline"
          >
            All games
          </Link>
        )}
      </div>

      {isError ? (
        <div className="panel flex items-center justify-between gap-3 px-4 py-4 text-sm text-muted-foreground sm:px-5">
          Couldn't load your games.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="panel @container overflow-hidden">
          {isPending && (
            <p role="status" className="sr-only">
              Loading your games
            </p>
          )}
          <table className="w-full border-collapse text-sm" aria-busy={isPending || undefined}>
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Result
                </th>
                <th scope="col" className={th}>
                  Opponent
                </th>
                <th scope="col" className={cn(th, OPENING)}>
                  Opening
                </th>
                <th scope="col" className={cn(th, ACCURACY, "text-right")}>
                  Accuracy
                </th>
                <th scope="col" className={cn(th, MOVES, "text-right")}>
                  Moves
                </th>
                <th scope="col" className={cn(th, "text-right")}>
                  Rating
                </th>
                <th scope="col" className={cn(th, PLAYED)}>
                  Played
                </th>
                <th scope="col" className={th}>
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending
                ? [88, 104, 72, 96, 80, 92].slice(0, Math.max(3, Math.min(6, maxRows))).map((width) => (
                    <tr key={width} aria-hidden="true">
                      <td className={td}>
                        <Skeleton className="h-[22px] w-[46px]" />
                      </td>
                      <td className={td}>
                        <Skeleton className="h-3.5" style={{ width }} />
                        <Skeleton className="mt-1.5 h-2.5 w-14" />
                      </td>
                      <td className={cn(td, OPENING)}>
                        <Skeleton className="h-3.5" style={{ width: width + 60 }} />
                      </td>
                      <td className={cn(td, ACCURACY)}>
                        <Skeleton className="ml-auto h-3.5 w-8" />
                      </td>
                      <td className={cn(td, MOVES)}>
                        <Skeleton className="ml-auto h-3.5 w-5" />
                      </td>
                      <td className={td}>
                        <Skeleton className="ml-auto h-3.5 w-6" />
                      </td>
                      <td className={cn(td, PLAYED)}>
                        <Skeleton className="h-3.5 w-16" />
                      </td>
                      <td className={td}>
                        <Skeleton className="ml-auto h-3.5 w-11" />
                      </td>
                    </tr>
                  ))
                : shown.map((game) => (
                    <GameRow key={game.id} game={game} userId={userId} opening={openings.get(game.id)?.name} />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const GameRow = ({
  game,
  userId,
  opening,
}: {
  game: StoredGameListItem;
  userId: number | undefined;
  opening: string | undefined;
}) => {
  const live = game.status === "in_progress";
  const side = sideOf(game, userId);
  const own = side === "black" ? game.blackPlayer : game.whitePlayer;
  const opponent = side === "black" ? game.whitePlayer : game.blackPlayer;
  const result = RESULTS[live ? "live" : getResult(game, userId)];
  const accuracy = side && game.accuracy ? game.accuracy[side] : null;
  const openingName = opening ?? game.opening?.name;
  const change = game.rated && !live ? own.ratingChange : null;

  return (
    <tr className="hover:bg-hover">
      <td className={td}>
        <span
          className={cn(
            "inline-block min-w-[46px] rounded-[5px] px-2 py-[3px] text-center text-xs font-bold whitespace-nowrap",
            result.className
          )}
        >
          {result.label}
        </span>
      </td>
      {/* Without the opening column the opponent takes the room that is left */}
      <td className={cn(td, "max-w-0 w-[30%] @max-[580px]:w-full")}>
        <span className="flex min-w-0 items-baseline gap-1.5 text-[15px] font-semibold">
          {opponent.id !== null ? (
            <PlayerPopover
              player={{ ...opponent, id: opponent.id }}
              trigger="name"
              speed={game.type ?? undefined}
              canChallenge
            >
              {opponent.username}
            </PlayerPopover>
          ) : (
            <span className="truncate">{opponent.username}</span>
          )}
          {isBotPlayer(game, opponent) && <BotTag />}
          {!game.tableGame && (
            <span className="shrink-0 text-[13px] font-normal text-faint tabular-nums">
              {opponent.rating}
              <ProvisionalMark provisional={opponent.provisional} className="text-faint" />
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-faint tabular-nums">
          {formatOfGame(game)}
          {!game.rated && game.type !== null && !game.tableGame && ", casual"}
        </span>
      </td>
      <td className={cn(td, OPENING, "max-w-0 w-[34%] truncate text-muted-foreground")} title={openingName}>
        {openingName ?? <span className="text-faint">–</span>}
      </td>
      <td className={cn(td, ACCURACY, num)}>
        {accuracy !== null && accuracy !== undefined ? (
          formatAccuracy(accuracy)
        ) : (
          <span className="text-faint" title={live ? undefined : "Review the game to see your accuracy"}>
            <span aria-hidden="true">–</span>
            <span className="sr-only">{live ? "Game in progress" : "Not reviewed yet"}</span>
          </span>
        )}
      </td>
      <td className={cn(td, MOVES, num)}>{game.numMoves == null ? "–" : fullMoves(game.numMoves)}</td>
      <td className={cn(td, num, "font-semibold")}>
        {change ? (
          <RatingDelta delta={change} />
        ) : (
          <span className="font-normal text-faint">
            <span aria-hidden="true">{change === 0 ? "0" : "–"}</span>
            <span className="sr-only">
              {change === 0 ? "No change" : live ? "Game in progress" : "Not rated"}
            </span>
          </span>
        )}
      </td>
      <td className={cn(td, PLAYED, "whitespace-nowrap text-faint")}>
        {live ? "Now" : playedLabel(game.createdAt)}
      </td>
      <td className={cn(td, "text-right")}>
        <Link
          to={live ? getGameRoute(game.id) : getGameReviewRoute(game.id)}
          aria-label={`${live ? "Return to the game" : "Review game"} against ${opponent.username}`}
          className="relative touch-target rounded-sm text-[13px] font-semibold text-primary underline-offset-[3px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {live ? "Return" : "Review"}
        </Link>
      </td>
    </tr>
  );
};
