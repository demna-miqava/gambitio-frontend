import { Loader2 } from "lucide-react";
import { ReviewGameLinks } from "@/features/game-review/components/ReviewGameLinks";
import { getArchiveGameRoute, getGameReviewRoute } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RematchState } from "../hooks/useRematch";
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
  className?: string;
};

/**
 * Rematch and New game after the game, with the rematch offer/waiting/
 * declined states, and links to the game's review and analysis. Rendered in both the result dialog and the side panel,
 * from the same rematch and matchmaking state.
 */
const PostGameActions = ({ rematch, search, gameId, className }: Props) => {
  const {
    rematchOffered,
    rematchRequested,
    rematchDeclined,
    requestRematch,
    acceptRematch,
    declineRematch,
    cancelRematch,
  } = rematch;
  const { isSearching, isConnecting, setShouldConnect } = search;
  // Leave the queue first, or matchmaking could pair us into a second game
  const acceptRematchAndStopSearch = () => {
    if (isSearching) setShouldConnect(false);
    acceptRematch();
  };

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {rematchOffered && (
        <RematchOffered
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
          Your opponent declined the rematch.
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
          <Button size="md"
            onClick={requestRematch}
            disabled={rematchDeclined || isSearching}
            className="flex-1"
          >
            Rematch
          </Button>
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
