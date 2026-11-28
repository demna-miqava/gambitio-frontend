import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getArchiveGameRoute, getGameReviewRoute, getGameRoute } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RematchState } from "../hooks/useRematch";
import type { SeriesSummary } from "@/features/series/types";
import { SeriesResultNote } from "@/features/series/components/SeriesResultNote";
import { nextGameLabel } from "@/features/series/utils/seriesFormat";

/** The page's one matchmaking connection (useMatchmaking), shared by every "New game" button */
export interface NewGameSearch {
  isSearching: boolean;
  isConnecting: boolean;
  setShouldConnect: (connect: boolean) => void;
}

type Props = {
  rematch: RematchState;
  search: NewGameSearch;
  /** The finished game, linked to its review and analysis */
  gameId: number;
  /**
   * The series this game is part of, as it stands after the game. While it
   * goes on, the rematch starts its next game (the server picks the colours).
   */
  series?: SeriesSummary | null;
  /** The signed-in user, for "You play white in game 2" */
  viewerId?: number;
  /**
   * The game the rematch already started (e.g. this page was reopened after
   * it): the offer is over, so link to that game instead.
   */
  rematchGameId?: number | null;
  /** "ann" in "Waiting for ann"; "your opponent" without it */
  opponentName?: string;
  /**
   * The time control a new game goes back into the queue for ("3+2"): the
   * button reads "New 3+2". "New game" without it.
   */
  timeControl?: string;
  /** The game was aborted: there's nothing to review, and no rematch to offer */
  aborted?: boolean;
  className?: string;
};

const note = "text-sm font-semibold text-foreground";

/**
 * What to do after the game: Rematch, straight back into the queue for the
 * same time control, and the review. A rematch offer either way takes the
 * place of the Rematch button, with who is waiting on whom above the row.
 */
const PostGameActions = ({
  rematch,
  search,
  gameId,
  series,
  viewerId,
  rematchGameId,
  opponentName,
  timeControl,
  aborted = false,
  className,
}: Props) => {
  const started = rematchGameId ?? null;
  const {
    rematchOffered: offered,
    rematchRequested: requested,
    rematchDeclined,
    rematchUsed,
    requestRematch,
    acceptRematch,
    declineRematch,
    cancelRematch,
  } = rematch;
  // A stale offer on a game whose rematch already started can't be answered
  const rematchOffered = offered && started === null;
  const rematchRequested = requested && started === null;
  const { isSearching, isConnecting, setShouldConnect } = search;
  // A timed match starts its next game by itself: no rematch, and no new
  // game that would take a player out of the match
  const timedMatchOn = series?.matchMinutes != null && series.status === "active";
  const nextGame = series?.status === "active" && started === null && !timedMatchOn ? series.next : null;
  const rematchLabel = nextGame ? `Next game (${nextGame.number} of ${series!.bestOf})` : "Rematch";
  const them = opponentName ?? "your opponent";
  const Them = opponentName ?? "Your opponent";
  const newGameLabel = timeControl ? `New ${timeControl}` : "New game";
  // Leave the queue first, or matchmaking could pair us into a second game
  const acceptRematchAndStopSearch = () => {
    if (isSearching) setShouldConnect(false);
    acceptRematch();
  };

  const newGame = (
    <Button
      size="md"
      variant="outline"
      onClick={() => setShouldConnect(!isSearching)}
      aria-label={isSearching ? undefined : timeControl ? `New ${timeControl} game` : undefined}
      className="min-w-0 bg-card px-2 max-md:h-11"
    >
      {isSearching ? "Cancel search" : newGameLabel}
    </Button>
  );
  const review = (
    <Button size="md" variant="outline" asChild className="min-w-0 bg-card px-2 max-md:h-11">
      <Link to={getGameReviewRoute(gameId)}>Review game</Link>
    </Button>
  );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {series && <SeriesResultNote series={series} viewerId={viewerId} />}
      {nextGame && !rematchOffered && !rematchRequested && (
        <p className="text-[13px] text-muted-foreground">{nextGameLabel(series!, viewerId)}</p>
      )}
      {rematchOffered && (
        <p className={note}>
          {nextGame ? `${Them} is ready for game ${nextGame.number}.` : `${Them} wants a rematch.`}
        </p>
      )}
      {rematchRequested && (
        <p className={note}>
          {nextGame ? `Waiting for ${them}.` : `Rematch offered. Waiting for ${them}.`}
        </p>
      )}
      {rematchDeclined && !rematchRequested && !rematchOffered && (
        // Announced once by useRematch
        <p className="text-[13px] text-muted-foreground">
          {nextGame ? `${Them} isn't ready for the next game.` : `${Them} declined the rematch.`}
        </p>
      )}
      {isSearching && (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground" role="status">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          {isConnecting
            ? "Connecting…"
            : timeControl
              ? `Finding a ${timeControl} opponent…`
              : "Finding an opponent…"}
        </p>
      )}

      {timedMatchOn ? (
        started !== null && (
          <Button size="md" asChild className="w-full max-md:h-11">
            <Link to={getGameRoute(started)}>Go to next game</Link>
          </Button>
        )
      ) : aborted ? (
        <div className="grid auto-cols-fr grid-flow-col gap-2">
          <Button
            size="md"
            variant={isSearching ? "outline" : "default"}
            onClick={() => setShouldConnect(!isSearching)}
            className={cn("min-w-0 px-2 max-md:h-11", isSearching && "bg-card")}
          >
            {isSearching ? "Cancel search" : newGameLabel}
          </Button>
        </div>
      ) : (
        <div className={cn("grid gap-2", nextGame ? "grid-cols-2" : "grid-cols-3")}>
          {started !== null ? (
            <Button size="md" asChild className={cn("min-w-0 px-2 max-md:h-11", nextGame && "col-span-2")}>
              <Link to={getGameRoute(started)}>{series ? "Go to next game" : "Go to rematch"}</Link>
            </Button>
          ) : rematchOffered ? (
            <Button
              size="md"
              onClick={acceptRematchAndStopSearch}
              aria-label={nextGame ? "Accept the next game" : "Accept rematch"}
              className={cn("min-w-0 px-2 max-md:h-11", nextGame && "col-span-2")}
            >
              Accept
            </Button>
          ) : rematchRequested ? (
            <Button
              size="md"
              variant="outline"
              onClick={cancelRematch}
              className={cn("min-w-0 bg-card px-2 max-md:h-11", nextGame && "col-span-2")}
            >
              Cancel offer
            </Button>
          ) : (
            <Button
              size="md"
              onClick={requestRematch}
              disabled={rematchDeclined || rematchUsed || isSearching}
              className={cn("min-w-0 px-2 max-md:h-11", nextGame && "col-span-2")}
            >
              {rematchLabel}
            </Button>
          )}
          {newGame}
          {review}
        </div>
      )}

      {!aborted && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {rematchOffered && (
            <button
              type="button"
              onClick={declineRematch}
              className="relative touch-target font-semibold text-muted-foreground underline-offset-[3px] outline-none hover:text-foreground hover:underline focus-visible:underline"
            >
              {nextGame ? "Not now" : "Decline rematch"}
            </button>
          )}
          <Link
            to={getArchiveGameRoute(gameId)}
            className="relative touch-target font-semibold text-primary underline-offset-[3px] outline-none hover:underline focus-visible:underline"
          >
            Open the analysis board
          </Link>
        </p>
      )}
    </div>
  );
};

export default PostGameActions;
