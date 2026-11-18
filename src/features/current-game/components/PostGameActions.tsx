import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ReviewGameLinks } from "@/features/game-review/components/ReviewGameLinks";
import { getArchiveGameRoute, getGameReviewRoute, getGameRoute } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RematchState } from "../hooks/useRematch";
import type { SeriesSummary } from "@/features/series/types";
import { SeriesResultNote } from "@/features/series/components/SeriesResultNote";
import { nextGameLabel } from "@/features/series/utils/seriesFormat";
import RematchOffered from "./RematchOffered";
import RematchRequested from "./RematchRequested";

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
  className?: string;
};

/**
 * Rematch and New game after the game, with the rematch offer/waiting/
 * declined states, and links to the game's review and analysis. Rendered in both the result dialog and the side panel,
 * from the same rematch and matchmaking state.
 */
const PostGameActions = ({
  rematch,
  search,
  gameId,
  series,
  viewerId,
  rematchGameId,
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
  const nextGame = series?.status === "active" && started === null ? series.next : null;
  const rematchLabel = nextGame ? `Next game (${nextGame.number} of ${series!.bestOf})` : "Rematch";
  // Leave the queue first, or matchmaking could pair us into a second game
  const acceptRematchAndStopSearch = () => {
    if (isSearching) setShouldConnect(false);
    acceptRematch();
  };

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {series && <SeriesResultNote series={series} viewerId={viewerId} />}
      {nextGame && !rematchOffered && !rematchRequested && (
        <p className="text-center text-xs text-muted-foreground">{nextGameLabel(series!, viewerId)}</p>
      )}
      {rematchOffered && (
        <RematchOffered
          message={
            nextGame ? `Your opponent is ready for game ${nextGame.number}` : undefined
          }
          onAcceptRematch={acceptRematchAndStopSearch}
          onDeclineRematch={declineRematch}
        />
      )}
      {rematchRequested && (
        <RematchRequested onCancelRematchRequest={cancelRematch} />
      )}
      {rematchDeclined && !rematchRequested && !rematchOffered && (
        // Announced once by useRematch; this is shown in two places
        <p className="text-center text-sm text-muted-foreground">
          {nextGame
            ? "Your opponent isn't ready for the next game."
            : "Your opponent declined the rematch."}
        </p>
      )}
      {isSearching && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {isConnecting ? "Connecting…" : "Looking for an opponent…"}
        </p>
      )}
      {isSearching && (rematchOffered || rematchRequested) && (
        // The button row below is hidden while a rematch is pending
        <Button size="md" variant="outline" onClick={() => setShouldConnect(false)} className="w-full">
          Cancel search
        </Button>
      )}
      {!rematchOffered && !rematchRequested && (
        <div className="flex w-full gap-2">
          <Button size="md"
            variant={isSearching ? "outline" : "secondary"}
            onClick={() => setShouldConnect(!isSearching)}
            className="flex-1"
          >
            {isSearching ? "Cancel search" : "New game"}
          </Button>
          {started !== null ? (
            <Button size="md" asChild className="flex-1">
              <Link to={getGameRoute(started)}>
                {series ? "Go to next game" : "Go to rematch"}
              </Link>
            </Button>
          ) : (
            <Button size="md"
              onClick={requestRematch}
              disabled={rematchDeclined || rematchUsed || isSearching}
              className="flex-1"
            >
              {rematchLabel}
            </Button>
          )}
        </div>
      )}
      <ReviewGameLinks
        review={{ to: getGameReviewRoute(gameId) }}
        analysis={{ to: getArchiveGameRoute(gameId) }}
      />
    </div>
  );
};

export default PostGameActions;
