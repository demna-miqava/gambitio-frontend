import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getGameRoute } from "@/constants/routes";
import { useNow } from "../hooks/useNow";
import { useTournamentActions } from "../hooks/useTournament";
import type { TournamentState } from "../types";
import { isOpen, stillPairing, tournamentPhase } from "../utils/tournamentFormat";

interface TournamentStatusCardProps {
  state: TournamentState;
  viewerId: number | undefined;
  /** The lobby socket is open: the server counts the player as here */
  isConnected: boolean;
}

const Note = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="space-y-1">
    <p className="font-display text-lg text-foreground">{title}</p>
    {children && <p className="text-sm text-muted-foreground">{children}</p>}
  </div>
);

/**
 * The viewer's own place in the tournament, and what they can do about it:
 * join, go to their game, pause, come back, leave; the creator can call it
 * off before it starts.
 */
export const TournamentStatusCard = ({ state, viewerId, isConnected }: TournamentStatusCardProps) => {
  const { tournament, me, myGameId } = state;
  const actions = useTournamentActions(tournament.id);
  const [confirming, setConfirming] = useState<"leave" | "cancel" | null>(null);
  const open = isOpen(tournament);
  const now = useNow(1_000, open);
  const phase = tournamentPhase(tournament, now);
  const busy = actions.join.isPending || actions.pause.isPending || actions.withdraw.isPending;
  const isCreator = viewerId !== undefined && tournament.createdBy.id === viewerId;
  const full = tournament.playerCount >= tournament.maxPlayers;

  const joinButton = (label: string) => (
    <Button onClick={() => actions.join.mutate()} disabled={busy} className="w-full">
      {actions.join.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {label}
    </Button>
  );
  const leaveButton = (
    <Button variant="ghost" onClick={() => setConfirming("leave")} disabled={busy} className="w-full">
      Leave tournament
    </Button>
  );

  let body: ReactNode;
  if (tournament.status === "cancelled") {
    body = <Note title="Cancelled">This tournament was called off before it started.</Note>;
  } else if (tournament.status === "finished") {
    body = me ? (
      <Note title={me.rank === 1 && me.games > 0 ? "You won" : `You finished ${ordinal(me.rank)}`}>
        {me.score} {me.score === 1 ? "point" : "points"} from {me.games} {me.games === 1 ? "game" : "games"}.
      </Note>
    ) : (
      <Note title="Finished">
        {tournament.winner ? `Won by ${tournament.winner.username}.` : "No games were played."}
      </Note>
    );
  } else if (!me || me.status === "withdrawn") {
    body = (
      <>
        <Note title={me ? "You left this tournament" : "Join in"}>
          {me
            ? "Come back and you keep the points you scored."
            : tournament.status === "running"
              ? "It has started, but you can join at any time and are paired at once."
              : "You are paired as soon as it starts, and again after every game."}
        </Note>
        {full && !me ? (
          <p className="text-sm text-muted-foreground">This tournament is full.</p>
        ) : (
          joinButton(me ? "Rejoin" : "Join tournament")
        )}
      </>
    );
  } else if (me.status === "paused") {
    body = (
      <>
        <Note title="Paused">You keep your place in the standings but won't get games.</Note>
        {joinButton("Resume")}
        {leaveButton}
      </>
    );
  } else if (tournament.status === "scheduled") {
    body = (
      <>
        <Note title="You're in">
          Keep this page open: your first game starts when the tournament does
          {phase.kind === "starting"
            ? ", as soon as a second player joins. With nobody else five minutes after its start time, it is cancelled."
            : "."}
        </Note>
        {leaveButton}
      </>
    );
  } else {
    body = (
      <>
        {myGameId !== null ? (
          <>
            <Note title="Your game is on" />
            <Button asChild className="w-full">
              <Link to={getGameRoute(myGameId)}>Go to your game</Link>
            </Button>
          </>
        ) : phase.kind === "closing" ? (
          <Note title="Time is up">The last games are being played. No new ones start.</Note>
        ) : !stillPairing(tournament, now) ? (
          <Note title="Nearly over">No new games start this close to the end.</Note>
        ) : (
          <div role="status" className="space-y-1">
            <p className="flex items-center gap-2 font-display text-lg text-foreground">
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
              {isConnected ? "Finding you an opponent…" : "Reconnecting…"}
            </p>
            <p className="text-sm text-muted-foreground">
              Stay on this page. You are paired as soon as another player is free.
            </p>
          </div>
        )}
        <Button variant="outline" onClick={() => actions.pause.mutate()} disabled={busy} className="w-full">
          {actions.pause.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Pause
        </Button>
        {leaveButton}
      </>
    );
  }

  return (
    <section aria-label="Your place in the tournament" className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:p-5">
      {body}
      {open && me && me.status !== "withdrawn" && me.games > 0 && (
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">
          You are <span className="font-medium text-foreground">{ordinal(me.rank)}</span> with{" "}
          <span className="font-medium text-foreground tabular-nums">{me.score}</span>{" "}
          {me.score === 1 ? "point" : "points"}.
        </p>
      )}
      {isCreator && tournament.status === "scheduled" && (
        <Button
          variant="ghost"
          onClick={() => setConfirming("cancel")}
          disabled={actions.cancel.isPending}
          className="w-full text-destructive hover:text-destructive"
        >
          Cancel tournament
        </Button>
      )}

      <ConfirmDialog
        open={confirming === "leave"}
        onOpenChange={(next) => !next && setConfirming(null)}
        title="Leave this tournament?"
        description={
          me && me.games > 0
            ? "You keep the points you scored and can come back while it runs."
            : "You can join again while it is open."
        }
        confirmLabel="Leave"
        isPending={actions.withdraw.isPending}
        onConfirm={() => actions.withdraw.mutate(undefined, { onSettled: () => setConfirming(null) })}
      />
      <ConfirmDialog
        open={confirming === "cancel"}
        onOpenChange={(next) => !next && setConfirming(null)}
        title="Cancel this tournament?"
        description="Players who joined will find it cancelled. This can't be undone."
        confirmLabel="Cancel tournament"
        cancelLabel="Keep it"
        destructive
        isPending={actions.cancel.isPending}
        onConfirm={() => actions.cancel.mutate(undefined, { onSettled: () => setConfirming(null) })}
      />
    </section>
  );
};

/** "1st", "2nd", "3rd", "11th" */
// eslint-disable-next-line react-refresh/only-export-components
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
