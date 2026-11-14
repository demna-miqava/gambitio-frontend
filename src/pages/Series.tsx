import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { Flag, Play, Swords } from "lucide-react";
import { OutgoingChallengeCard } from "@/features/create-game/components/OutgoingChallengeCard";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import type { BestOf } from "@/features/notifications/types/websocket-messages";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { NotFound } from "@/components/NotFound";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { getGameRoute } from "@/constants/routes";
import { SeriesScoreboard } from "@/features/series/components/SeriesScoreboard";
import { SeriesGamesList } from "@/features/series/components/SeriesGamesList";
import { useResignSeries, useSeries } from "@/features/series/hooks/useSeries";
import { bestOfLabel, nextGameLabel } from "@/features/series/utils/seriesFormat";

const SeriesSkeleton = () => (
  <div className="space-y-6" role="status" aria-label="Loading series">
    <Skeleton className="h-48 w-full rounded-2xl" />
    <Skeleton className="h-40 w-full rounded-2xl" />
  </div>
);

/** A friend series: the score, its games, and what happens next. */
const Series = () => {
  const params = useParams();
  const seriesId = Number(params.seriesId);
  const validId = Number.isSafeInteger(seriesId) && seriesId > 0;
  const { id: viewerId } = useUser();
  const { data, isPending, error, refetch } = useSeries(validId ? seriesId : null);
  const resign = useResignSeries(seriesId);
  const [confirmResign, setConfirmResign] = useState(false);
  const { sendChallenge, outgoingChallenge } = useChallenges();

  const series = data?.series;
  useDocumentTitle(
    series ? `${series.playerOne.username} vs ${series.playerTwo.username} · ${bestOfLabel(series.bestOf)}` : "Series"
  );

  const notFound = !validId || (isAxiosError(error) && error.response?.status === 404);
  if (notFound) {
    return <NotFound title="Series not found" description="This series doesn't exist." />;
  }
  if (error && !data) {
    return (
      <NotFound
        code=""
        title="Couldn't load this series"
        description="Check your connection and try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const isPlayer =
    !!series && (viewerId === series.playerOne.id || viewerId === series.playerTwo.id);
  const active = series?.status === "active";
  const liveGameId = data?.liveGameId ?? null;
  const next = series ? nextGameLabel(series, viewerId) : null;
  const opponent =
    series && isPlayer ? (series.playerOne.id === viewerId ? series.playerTwo : series.playerOne) : null;
  // The challenge to play the next game, while the opponent hasn't answered
  const waiting = !!outgoingChallenge && outgoingChallenge.seriesId === seriesId;
  // The next game starts like any friend game: a challenge, which the
  // server fills in from the series (clock, length, colours)
  const continueSeries = () => {
    if (!series?.next || !opponent) return;
    sendChallenge(
      {
        challengedId: opponent.id,
        color: series.next.whiteId === viewerId ? "white" : "black",
        time: series.time,
        increment: series.increment,
        bestOf: series.bestOf as BestOf,
        seriesId: series.id,
      },
      { username: opponent.username, seriesGame: series.next.number }
    );
  };

  return (
    <PageContainer className="max-w-3xl space-y-6">
      <PageHeader
        title="Series"
        description={
          series
            ? `${series.playerOne.username} challenged ${series.playerTwo.username} to a ${bestOfLabel(series.bestOf).toLowerCase()}. Colours alternate every game.`
            : undefined
        }
      />

      {isPending || !data || !series ? (
        <SeriesSkeleton />
      ) : (
        <>
          <SeriesScoreboard series={series} viewerId={viewerId} />

          {active && (
            <section aria-label="Next game" className="space-y-3 rounded-2xl bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm">
                  {liveGameId
                    ? `Game ${series.next?.number ?? ""} is being played.`
                    : next
                      ? `${next}.${isPlayer && opponent ? ` Challenge ${opponent.username} when you're both ready.` : ""}`
                      : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  {liveGameId ? (
                    <Button size="md" asChild>
                      <Link to={getGameRoute(liveGameId)}>
                        <Play aria-hidden="true" /> {isPlayer ? "Return to game" : "Watch"}
                      </Link>
                    </Button>
                  ) : (
                    isPlayer &&
                    opponent &&
                    !waiting && (
                      <Button size="md" onClick={continueSeries}>
                        <Swords aria-hidden="true" /> Play game {series.next?.number}
                      </Button>
                    )
                  )}
                  {isPlayer && !liveGameId && (
                    <Button size="md" variant="outline" onClick={() => setConfirmResign(true)}>
                      <Flag aria-hidden="true" /> Resign series
                    </Button>
                  )}
                </div>
              </div>
              {waiting && !liveGameId && <OutgoingChallengeCard />}
              {!liveGameId && (
                <p className="text-xs text-muted-foreground">
                  A series with no game for a week ends on points: the leader wins, or it's drawn.
                </p>
              )}
            </section>
          )}

          <section className="space-y-3">
            <SectionHeader title="Games" />
            {data.games.length === 0 ? (
              <EmptyState title="No games yet" description="The first game hasn't started." />
            ) : (
              <SeriesGamesList games={data.games} viewerId={viewerId} liveGameId={liveGameId} />
            )}
          </section>

          <ConfirmDialog
            open={confirmResign}
            onOpenChange={setConfirmResign}
            title="Resign this series?"
            description="Your opponent wins the series. The games already played keep their results."
            confirmLabel="Resign series"
            destructive
            isPending={resign.isPending}
            onConfirm={() =>
              resign.mutate(undefined, { onSettled: () => setConfirmResign(false) })
            }
          />
        </>
      )}
    </PageContainer>
  );
};

export default Series;
