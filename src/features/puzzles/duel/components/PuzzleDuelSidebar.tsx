import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Microscope, RotateCcw, Swords, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, getAnalysisFromPositionRoute, getPuzzleDuelRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import type { DuelGame } from "../hooks/useDuelGame";
import { useDuelInvites } from "../hooks/useDuelInvites";
import type { DuelPlayer, FinishedPuzzle } from "../types";
import { duelOutcome, formatDuelClock, secondsLeft } from "../utils/duel";

const OUTCOME_TITLES = { win: "You won the duel", loss: "You lost the duel", draw: "A draw" } as const;

/** One player's puzzles: right or wrong, each openable in the analysis board */
const PuzzleList = ({ player, puzzles }: { player: DuelPlayer; puzzles: Map<number, FinishedPuzzle> }) => {
  const results = player.results ?? [];
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {player.username}: {player.score} right, {results.filter((r) => !r.solved).length} wrong
      </p>
      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground">No puzzles finished.</p>
      ) : (
        <ol className="flex flex-wrap gap-1.5">
          {results.map((result) => {
            const puzzle = puzzles.get(result.index);
            const Icon = result.solved ? CheckCircle2 : XCircle;
            const label = `Puzzle ${result.index + 1}, ${result.solved ? "right" : "wrong"}`;
            const chip = (
              <>
                <Icon className="size-3.5" aria-hidden="true" />
                <span className="tabular-nums">{result.index + 1}</span>
              </>
            );
            const className = cn(
              "inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
              result.solved ? "bg-win-bg text-win" : "bg-loss-bg text-loss"
            );
            return (
              <li key={result.index}>
                {puzzle ? (
                  <Link
                    to={getAnalysisFromPositionRoute(puzzle.fen)}
                    className={cn(className, "hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
                    aria-label={`${label}: look at it on the analysis board`}
                    title={`Rated ${puzzle.rating}. Open on the analysis board`}
                  >
                    {chip}
                  </Link>
                ) : (
                  <span className={className} aria-label={label}>
                    {chip}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

/** After the duel: who won, both scores, every puzzle, and Rematch. */
const DuelResult = ({ game }: { game: DuelGame }) => {
  const { id: viewerId } = useUser();
  const { state, me, opponent, finishedPuzzles } = game;
  const navigate = useNavigate();
  const invites = useDuelInvites();
  if (!state || !me || !opponent) return null;
  const outcome = duelOutcome(state.winnerId, viewerId);
  const puzzles = new Map(finishedPuzzles.map((p) => [p.index, p]));
  const theirRematch = invites.incoming.find((i) => i.rematchOf === state.id);
  const myRematch = invites.outgoing.find((i) => i.rematchOf === state.id);

  return (
    <section aria-labelledby="duel-result-title" className="space-y-4">
      <div
        className={cn(
          "space-y-1 rounded-xl px-4 py-3",
          outcome === "win" && "bg-win-bg text-win",
          outcome === "loss" && "bg-loss-bg text-loss",
          outcome === "draw" && "bg-muted text-foreground"
        )}
      >
        <h2 id="duel-result-title" className="flex items-center gap-1.5 font-display text-xl">
          {outcome === "win" && <Trophy className="size-5" aria-hidden="true" />}
          {OUTCOME_TITLES[outcome]}
        </h2>
        <p className="font-display-num text-3xl tabular-nums">
          {me.score} – {opponent.score}
        </p>
        <p className="text-sm">
          {state.endReason === "both_out" ? "Both players struck out." : "The clock ran out."}
        </p>
      </div>

      <PuzzleList player={me} puzzles={puzzles} />
      <PuzzleList player={opponent} puzzles={puzzles} />

      <div className="grid gap-2">
        {theirRematch ? (
          <Button
            size="lg"
            disabled={invites.accept.isPending}
            onClick={() =>
              invites.accept.mutate(theirRematch.id, {
                // Not left to the socket's "duel started" alone
                onSuccess: ({ duelId }) => {
                  const route = getPuzzleDuelRoute(duelId);
                  if (window.location.pathname !== route) navigate(route);
                },
              })
            }
          >
            <Swords aria-hidden="true" /> Accept {opponent.username}'s rematch
          </Button>
        ) : myRematch ? (
          <Button size="lg" variant="outline" onClick={() => invites.cancel.mutate(myRematch.id)}>
            Waiting for {opponent.username}… Cancel
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={invites.send.isPending}
            onClick={() => invites.send.mutate({ recipientId: opponent.userId, rematchOf: state.id })}
          >
            <RotateCcw aria-hidden="true" /> Rematch
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <Link to={ROUTES.PUZZLE_DUEL}>Back to duels</Link>
        </Button>
      </div>
    </section>
  );
};

/** Beside the board: the clock, what to do now, and at the end the result. */
export const PuzzleDuelSidebar = ({ game }: { game: DuelGame }) => {
  const { state, phase, serverNow, color, flash, me, opponent, isLoading, isError, retry } = game;

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl bg-card p-5" role="status" aria-label="Loading the duel">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError || !state) {
    return (
      <div className="space-y-3 rounded-2xl bg-card p-5">
        <p className="text-sm text-muted-foreground">Couldn't load this duel.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => retry()}>
            Try again
          </Button>
          <Button asChild variant="ghost">
            <Link to={ROUTES.PUZZLE_DUEL}>Back to duels</Link>
          </Button>
        </div>
      </div>
    );
  }

  const left = secondsLeft(state.endsAt, serverNow);
  const status =
    phase === "countdown"
      ? "Get ready: the first puzzle is coming."
      : phase === "waiting"
        ? "Time's up. Counting the scores…"
        : phase === "out"
          ? `You're out with ${me?.score ?? 0}. ${opponent?.out ? "" : `${opponent?.username ?? "Your opponent"} is still going.`}`
          : flash?.kind === "solved"
            ? "Right!"
            : flash?.kind === "missed"
              ? "Missed. That's a strike."
              : `Find the best move for ${color}.`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:p-5">
      <h1 className="font-display text-2xl text-foreground">Puzzle duel</h1>
      {phase !== "over" && (
        <>
          <div className="flex h-12 items-center justify-between rounded-xl bg-muted/60 px-3">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-5" aria-hidden="true" /> Time left
            </span>
            <span
              role="timer"
              aria-label="Time left"
              className={cn(
                "text-2xl font-medium tabular-nums",
                phase === "playing" && left < 30 ? "text-loss" : "text-foreground"
              )}
            >
              {formatDuelClock(phase === "countdown" ? Math.round((state.endsAt - state.startsAt) / 1000) : left)}
            </span>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-medium",
              flash?.kind === "solved" && "bg-win-bg text-win",
              flash?.kind === "missed" && "bg-loss-bg text-loss",
              !flash && "bg-muted text-foreground"
            )}
          >
            {status}
          </p>
          <p className="text-xs text-muted-foreground">
            The same puzzles for both of you, easiest first. A wrong move is a strike and moves you on;{" "}
            {state.maxStrikes} strikes and you're out. You see {opponent?.username ?? "your opponent"}'s score, not
            their board. Leaving doesn't stop the clock: come back from Puzzles.
          </p>
          {(phase === "out" || phase === "playing") && game.finishedPuzzles.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Microscope className="size-3.5" aria-hidden="true" />
              The puzzles you finished can be opened once the duel is over.
            </p>
          )}
        </>
      )}
      {phase === "over" && <DuelResult game={game} />}
    </div>
  );
};
