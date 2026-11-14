import { SectionHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ResultsBar } from "@/features/stats/components/ResultsBar";
import { useHeadToHead } from "../hooks/useSeries";
import { SeriesListItem } from "./SeriesListItem";

/**
 * The signed-in player's record against the profile's player: games won,
 * drawn and lost (rated games between the two), series record and their
 * latest series. Shown on other players' profiles.
 */
export const HeadToHeadCard = ({ userId, viewerId }: { userId: number; viewerId?: number }) => {
  const { data, isPending, isError, refetch } = useHeadToHead(userId);

  const games = data ? data.wins + data.draws + data.losses : 0;
  const { won = 0, lost = 0, drawn = 0, active = 0 } = data?.series ?? {};
  const seriesPlayed = won + lost + drawn;

  return (
    <section
      aria-labelledby="head-to-head-title"
      className="flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <SectionHeader title={<span id="head-to-head-title">Head to head</span>} />
      {isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading head to head">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      ) : isError || !data ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Couldn't load your record.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : games === 0 && seriesPlayed === 0 && active === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't played {data.opponent.username} yet.
        </p>
      ) : (
        <>
          {games > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your games against {data.opponent.username}:{" "}
                <span className="font-medium text-foreground tabular-nums">{games}</span>
              </p>
              <ResultsBar wins={data.wins} draws={data.draws} losses={data.losses} />
            </div>
          )}
          {(seriesPlayed > 0 || active > 0) && (
            <p className="text-sm text-muted-foreground">
              Series:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {won} won · {drawn} drawn · {lost} lost
              </span>
              {active > 0 && ` · ${active} in progress`}
            </p>
          )}
          {data.recentSeries.length > 0 && (
            <ul className="-mx-2">
              {data.recentSeries.slice(0, 3).map((series) => (
                <SeriesListItem
                  key={series.id}
                  series={series}
                  perspectiveId={viewerId}
                  viewerId={viewerId}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};
