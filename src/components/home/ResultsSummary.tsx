import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ResultsBar } from "@/features/stats/components/ResultsBar";
import type { ComprehensiveStatsData } from "@/features/stats/hooks/useGetComprehensiveStats";
import { useUser } from "@/hooks/useUser";
import { apiRequest } from "@/services";
import { getProfileStatsRoute } from "@/constants/routes";
import { QKEY_USER_STATS } from "@/constants/queryKeys";

const DAYS = "30";
const VARIANT = "all";

type RecentStats = Pick<
  ComprehensiveStatsData,
  "totalGames" | "wins" | "draws" | "losses" | "bestWin" | "winStreak"
>;

/**
 * How the player's rated games went over the last 30 days: win rate, the
 * win/draw/loss split, best win and longest streak. Ratings and their
 * 30-day change are in the header, so they're not repeated here.
 *
 * Same query key as the stats page with "30 days" and "All" picked, so
 * the two share a cache entry.
 */
export const ResultsSummary = () => {
  const { id } = useUser();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [QKEY_USER_STATS, id, DAYS, VARIANT],
    queryFn: () =>
      apiRequest<RecentStats>("get", `/users/${id}/stats`, {
        params: { days: DAYS, variant: VARIANT },
      }),
    enabled: !!id,
  });

  const total = data?.totalGames ?? 0;
  const winRate = total ? Math.round(((data?.wins ?? 0) / total) * 100) : 0;

  return (
    <section
      aria-labelledby="recent-results-title"
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-5"
    >
      <SectionHeader
        title={<span id="recent-results-title">Last 30 days</span>}
        action={
          <Link
            to={`${getProfileStatsRoute(id || 0)}?days=${DAYS}`}
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
      ) : !data || total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rated games in the last 30 days. Games against the computer aren't rated.
        </p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display-num text-4xl font-medium text-foreground">
                {winRate}%
              </p>
              <p className="text-xs text-muted-foreground">win rate</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {total.toLocaleString()}
              </span>{" "}
              rated {total === 1 ? "game" : "games"}
            </p>
          </div>
          <ResultsBar wins={data.wins} draws={data.draws} losses={data.losses} />
          {(data.bestWin > 0 || data.winStreak > 1) && (
            <dl className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-sm">
              {data.bestWin > 0 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Best win</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{data.bestWin}</dd>
                </div>
              )}
              {data.winStreak > 1 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Longest win streak</dt>
                  <dd className="font-semibold tabular-nums text-foreground">{data.winStreak}</dd>
                </div>
              )}
            </dl>
          )}
        </>
      )}
    </section>
  );
};
