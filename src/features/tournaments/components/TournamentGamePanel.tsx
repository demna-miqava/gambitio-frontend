import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewGameLinks } from "@/features/game-review/components/ReviewGameLinks";
import { getArchiveGameRoute, getGameReviewRoute, getTournamentRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useNow } from "../hooks/useNow";
import { useTournamentActions } from "../hooks/useTournament";
import type { TournamentState } from "../types";
import { stillPairing, tournamentPhase } from "../utils/tournamentFormat";
import { ordinal } from "./TournamentStatusCard";

/**
 * One line above a tournament game's moves: the tournament, and where the
 * player stands in it, linking to the lobby. Just the link while the lobby
 * hasn't loaded.
 */
export const TournamentStrip = ({
  tournamentId,
  state,
  className,
}: {
  tournamentId: number;
  state: TournamentState | undefined;
  className?: string;
}) => {
  const me = state?.me;
  return (
    <Link
      to={getTournamentRoute(tournamentId)}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Medal className="size-4 shrink-0 text-gold" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate font-medium">{state?.tournament.name ?? "Tournament"}</span>
      {me && me.games > 0 && (
        <span className="shrink-0 text-muted-foreground">
          {ordinal(me.rank)} · <span className="font-medium tabular-nums text-foreground">{me.score}</span> pts
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
};

interface TournamentPostGameProps {
  tournamentId: number;
  /** The game that just ended, linked to its review and analysis */
  gameId: number;
  /** The tournament's lobby, from the page's one useTournament */
  state: TournamentState | undefined;
  /** The lobby socket is open: the player counts as here and can be paired */
  isConnected: boolean;
  className?: string;
}

/**
 * After a tournament game, in place of Rematch and New game: the next game
 * comes by itself. Says what is happening (pairing, paused, time up) and
 * links back to the lobby. Shown in the result dialog and the side panel.
 */
export const TournamentPostGame = ({
  tournamentId,
  gameId,
  state,
  isConnected,
  className,
}: TournamentPostGameProps) => {
  const { join } = useTournamentActions(tournamentId);
  const running = state?.tournament.status === "running";
  const now = useNow(1_000, running);
  const phase = state ? tournamentPhase(state.tournament, now) : null;
  const me = state?.me;

  let status;
  if (!state || !phase) {
    status = null;
  } else if (phase.kind === "finished") {
    status = <p className="text-center text-sm text-muted-foreground">The tournament is over.</p>;
  } else if (phase.kind === "closing") {
    status = (
      <p className="text-center text-sm text-muted-foreground">
        Time is up: no more games start. The last ones are being played.
      </p>
    );
  } else if (me?.status === "paused") {
    status = (
      <div className="space-y-2">
        <p className="text-center text-sm text-muted-foreground">You're paused and won't get another game.</p>
        <Button size="md" onClick={() => join.mutate()} disabled={join.isPending} className="w-full">
          {join.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Resume
        </Button>
      </div>
    );
  } else if (me?.status === "active" && phase.kind === "running" && !stillPairing(state.tournament, now)) {
    status = (
      <p className="text-center text-sm text-muted-foreground">
        The tournament is nearly over: no new games start this close to the end.
      </p>
    );
  } else if (me?.status === "active" && phase.kind === "running") {
    status = (
      <p role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {isConnected ? "Pairing your next game…" : "Reconnecting…"}
      </p>
    );
  } else {
    status = null;
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {me && me.games > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          You are <span className="font-medium text-foreground">{ordinal(me.rank)}</span> with{" "}
          <span className="font-medium tabular-nums text-foreground">{me.score}</span>{" "}
          {me.score === 1 ? "point" : "points"}.
        </p>
      )}
      {status}
      <Button size="md" asChild variant="secondary" className="w-full">
        <Link to={getTournamentRoute(tournamentId)}>Back to the tournament</Link>
      </Button>
      <ReviewGameLinks review={{ to: getGameReviewRoute(gameId) }} analysis={{ to: getArchiveGameRoute(gameId) }} />
    </div>
  );
};
