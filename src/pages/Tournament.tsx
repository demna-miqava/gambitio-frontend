import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, UsersRound } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { NotFound } from "@/components/NotFound";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { Button } from "@/components/ui/button";
import { ROUTES, getGameRoute } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { parsePositiveId } from "@/utils/ids";
import { useTournament } from "@/features/tournaments/hooks/useTournament";
import { StandingsTable } from "@/features/tournaments/components/StandingsTable";
import { TournamentClock } from "@/features/tournaments/components/TournamentClock";
import { TournamentStatusCard } from "@/features/tournaments/components/TournamentStatusCard";
import { isOpen, tournamentFacts } from "@/features/tournaments/utils/tournamentFormat";

const BackToList = () => (
  <Button asChild variant="outline">
    <Link to={ROUTES.TOURNAMENTS}>All tournaments</Link>
  </Button>
);

/**
 * A tournament's lobby: its clock, the standings as they change, the games
 * being played, and the viewer's own place in it. Having this page open is
 * what gets a player paired.
 */
const Tournament = () => {
  const tournamentId = parsePositiveId(useParams().tournamentId);
  const { id: viewerId } = useUser();
  const { state, isPending, notFound, isError, refetch, isConnected } = useTournament(tournamentId);
  useDocumentTitle(state?.tournament.name);

  if (tournamentId === null || notFound) {
    return (
      <NotFound
        title="Tournament not found"
        description="This tournament doesn't exist or has been removed."
        action={<BackToList />}
      />
    );
  }
  if (isError) {
    return (
      <NotFound
        code=""
        title="Couldn't load this tournament"
        description="Check your connection and try again."
        action={
          <div className="flex gap-2">
            <Button onClick={() => void refetch()}>Retry</Button>
            <BackToList />
          </div>
        }
      />
    );
  }
  if (isPending || !state) return <FullScreenLoader height="h-[60vh] w-full" />;

  const { tournament, standings, standingsTotal, liveGames, me } = state;
  return (
    <PageContainer className="max-w-5xl space-y-6">
      <Link
        to={ROUTES.TOURNAMENTS}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Tournaments
      </Link>
      <PageHeader
        eyebrow={`Arena · by ${tournament.createdBy.username}`}
        title={<span className="break-words">{tournament.name}</span>}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{tournamentFacts(tournament)}</span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="size-4" aria-hidden="true" />
              {tournament.playerCount} {tournament.playerCount === 1 ? "player" : "players"}
            </span>
          </span>
        }
        actions={<TournamentClock tournament={tournament} className="sm:text-right" />}
      />

      {/* Phones: the player's own card first, then the standings. From
          1024px the standings take the wide column beside it. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="lg:col-start-2 lg:row-start-1">
          <TournamentStatusCard state={state} viewerId={viewerId} isConnected={isConnected} />
        </div>

        <section
          aria-labelledby="tournament-standings"
          className="space-y-3 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          <h2 id="tournament-standings" className="font-display text-xl text-foreground">
            Standings
          </h2>
          <StandingsTable tournamentId={tournament.id} top={standings} total={standingsTotal} me={me} />
        </section>

        <div className="space-y-6 lg:col-start-2 lg:row-start-2">
          {liveGames.length > 0 && (
            <section aria-labelledby="tournament-games" className="space-y-2">
              <h2 id="tournament-games" className="font-display text-base text-foreground">
                Being played now
              </h2>
              <ul className="overflow-hidden rounded-2xl bg-card">
                {liveGames.map((game) => (
                  <li key={game.id} className="border-t border-border first:border-t-0">
                    <Link
                      to={getGameRoute(game.id)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {game.white.username} <span className="text-muted-foreground">vs</span>{" "}
                        {game.black.username}
                      </span>
                      <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="sr-only">Watch</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isOpen(tournament) && (
            <section aria-labelledby="tournament-rules" className="space-y-1.5 text-sm text-muted-foreground">
              <h2 id="tournament-rules" className="font-display text-base text-foreground">
                How it works
              </h2>
              <p>
                A win is 2 points, a draw 1. After two wins in a row your points count double until
                a game you don't win.
              </p>
              <p>
                You are paired while this page, or your tournament game, is open. No takebacks or
                rematches; not making your first move loses the game and pauses you.
              </p>
              <p>Games still going when the time is up are played out and count.</p>
            </section>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Tournament;
