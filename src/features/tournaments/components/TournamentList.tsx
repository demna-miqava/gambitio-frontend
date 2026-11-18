import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Medal, Plus, RotateCw, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { getTournamentRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useFinishedTournaments, useOpenTournaments } from "../hooks/useTournaments";
import type { TournamentListItem } from "../types";
import { tournamentFacts } from "../utils/tournamentFormat";
import { TournamentClock } from "./TournamentClock";

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

const LiveDot = () => (
  <span className="relative flex size-2 shrink-0" aria-hidden="true">
    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
    <span className="relative inline-flex size-2 rounded-full bg-primary" />
  </span>
);

const TournamentRow = ({ tournament }: { tournament: TournamentListItem }) => {
  const running = tournament.status === "running";
  const finished = tournament.status === "finished";
  return (
    <li className="flex items-center gap-3 rounded-xl bg-card p-3 sm:p-4">
      <span
        className={cn(
          "hidden size-10 shrink-0 items-center justify-center rounded-lg sm:flex",
          running ? "bg-brand-soft text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Medal className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={getTournamentRoute(tournament.id)}
          className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {tournament.name}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{tournamentFacts(tournament)}</span>
          <span className="inline-flex items-center gap-1">
            <UsersRound className="size-3" aria-hidden="true" />
            {tournament.playerCount} {tournament.playerCount === 1 ? "player" : "players"}
          </span>
          {finished ? (
            <span>
              {tournament.winner ? `Won by ${tournament.winner.username}` : "No games played"} ·{" "}
              <time dateTime={tournament.endsAt}>{DATE_FORMAT.format(new Date(tournament.endsAt))}</time>
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-1.5", running && "font-medium text-foreground")}>
              {running && <LiveDot />}
              <TournamentClock tournament={tournament} compact />
            </span>
          )}
        </p>
      </div>
      <Button size="sm" variant={finished || tournament.joined ? "outline" : "default"} asChild className="shrink-0">
        <Link to={getTournamentRoute(tournament.id)} aria-label={`Open ${tournament.name}`}>
          {finished ? "Results" : tournament.joined ? "Open" : "Join"}
        </Link>
      </Button>
    </li>
  );
};

const Loading = ({ label }: { label: string }) => (
  <ul className="flex flex-col gap-3" aria-busy="true" aria-label={label}>
    {[0, 1].map((i) => (
      <li key={i}>
        <Skeleton className="h-[74px] w-full rounded-xl" />
      </li>
    ))}
  </ul>
);

const LoadError = ({ onRetry, busy }: { onRetry: () => void; busy: boolean }) => (
  <EmptyState
    icon={AlertCircle}
    title="Couldn't load the tournaments"
    description="Check your connection and try again."
    action={
      <Button variant="outline" onClick={onRetry} disabled={busy}>
        <RotateCw className={cn(busy && "animate-spin")} aria-hidden="true" /> Retry
      </Button>
    }
  />
);

/** What is running and coming up, then what has been played. */
export const TournamentLists = ({ onCreate }: { onCreate: () => void }) => {
  const open = useOpenTournaments();
  const [page, setPage] = useState(1);
  const finished = useFinishedTournaments(page);
  const finishedPages = finished.data?.pagination.totalPages ?? 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby="tournaments-open" className="space-y-3">
        <h2 id="tournaments-open" className="font-display text-xl text-foreground">
          Now and next
        </h2>
        {open.isPending ? (
          <Loading label="Loading tournaments" />
        ) : open.isError && !open.data ? (
          <LoadError onRetry={() => void open.refetch()} busy={open.isFetching} />
        ) : open.data.data.length === 0 ? (
          <EmptyState
            icon={Medal}
            title="No tournament is on"
            description="Start one: it begins at the time you pick, once a second player has joined."
            action={
              <Button onClick={onCreate}>
                <Plus aria-hidden="true" /> New tournament
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {open.data.data.map((tournament) => (
              <TournamentRow key={tournament.id} tournament={tournament} />
            ))}
          </ul>
        )}
      </section>

      {(finished.isPending || finished.isError || (finished.data?.data.length ?? 0) > 0) && (
        <section aria-labelledby="tournaments-finished" className="space-y-3">
          <h2 id="tournaments-finished" className="font-display text-xl text-foreground">
            Finished
          </h2>
          {finished.isPending ? (
            <Loading label="Loading finished tournaments" />
          ) : finished.isError && !finished.data ? (
            <LoadError onRetry={() => void finished.refetch()} busy={finished.isFetching} />
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {finished.data.data.map((tournament) => (
                  <TournamentRow key={tournament.id} tournament={tournament} />
                ))}
              </ul>
              <Pagination
                currentPage={page}
                totalPages={finishedPages}
                onPageChange={setPage}
                hasNextPage={page < finishedPages}
                hasPreviousPage={page > 1}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
};
