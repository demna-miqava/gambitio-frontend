import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetStats } from "@/features/stats/hooks/useGetStats";
import { ResultsBar } from "@/features/stats/components/ResultsBar";
import { useUser } from "@/hooks/useUser";
import { getProfileStatsRoute } from "@/constants/routes";

/**
 * How the player's games have gone overall: win/draw/loss split and win rate.
 * Ratings live in the header, so they're not repeated here.
 */
export const ResultsSummary = () => {
  const { id } = useUser();
  const { stats, numberOfGames, isPending, isError, refetch } = useGetStats();

  const totals = Object.values(stats ?? {}).reduce(
    (acc, s) => ({
      wins: acc.wins + (s?.wins ?? 0),
      draws: acc.draws + (s?.draws ?? 0),
      losses: acc.losses + (s?.losses ?? 0),
    }),
    { wins: 0, draws: 0, losses: 0 }
  );
  const decided = totals.wins + totals.draws + totals.losses;
  const winRate = decided ? Math.round((totals.wins / decided) * 100) : 0;

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
      <SectionHeader
        title="Your results"
        action={
          <Link
            to={getProfileStatsRoute(id || 0)}
            // 44px tall on phones without moving the header (negative margin)
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground max-md:-my-3 max-md:min-h-11"
          >
            Details <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      {isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading results">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Couldn't load your results.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : decided === 0 ? (
        <p className="text-sm text-muted-foreground">
          Finish a game and your results will show up here.
        </p>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display-num text-4xl font-medium text-foreground">
                {winRate}%
              </p>
              <p className="text-xs text-muted-foreground">win rate</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {numberOfGames.toLocaleString()}
              </span>{" "}
              games played
            </p>
          </div>
          <ResultsBar {...totals} />
        </>
      )}
    </section>
  );
};
