import { BarChart3 } from "lucide-react";
import RatingChart from "./RatingChart";
import RatingOverview from "./RatingOverview";
import ResultsBreakdown from "./ResultsBreakdown";
import { useGetComprehensiveStats } from "../../hooks/useGetComprehensiveStats";
import { useGetStats } from "../../hooks/useGetStats";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD = "rounded-2xl bg-card p-5 sm:p-6";

/** A placeholder bar centred in a box of one text line's height. */
const Line = ({ box, bar }: { box: string; bar: string }) => (
  <div className={cn("flex items-center", box)}>
    <Skeleton className={bar} />
  </div>
);

/**
 * The loaded layout with placeholders: rating card (number, best, three
 * ranks), chart card (220px plot) and results card, with the same paddings
 * and line heights, so the page doesn't jump when the numbers arrive.
 */
const StatsSkeleton = () => (
  <div className="space-y-4" role="status" aria-label="Loading stats">
    <div className={cn(CARD, "flex flex-col gap-6 md:flex-row md:items-end md:justify-between")}>
      <div className="space-y-1">
        <Line box="h-5" bar="h-3.5 w-16" />
        <Line box="h-12" bar="h-10 w-32" />
        <Line box="h-5" bar="h-3.5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-0.5">
            <Line box="h-4" bar="h-3 w-16" />
            <Line box="h-7" bar="h-5 w-14" />
          </div>
        ))}
      </div>
    </div>
    <div className={CARD}>
      <Line box="mb-4 h-6" bar="h-4 w-32" />
      <Skeleton className="h-[220px] w-full rounded-xl" />
      <Line box="mt-2 h-4" bar="h-3 w-full" />
    </div>
    <div className={cn(CARD, "space-y-5")}>
      <Line box="h-6" bar="h-4 w-20" />
      <div className="space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[66px] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-0.5">
            <Line box="h-4" bar="h-3 w-20" />
            <Line box="h-7" bar="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Rating, rating chart and results for the selected variant and period. */
const ComprehensiveStats = () => {
  const { statsData, selectedVariant, isPending, isError, isUpdating, refetch } =
    useGetComprehensiveStats();
  // All-time game counts (the same request as the rating cards): tells "no
  // games in this period" apart from "never played this time control"
  const summary = useGetStats();
  const gamesEver =
    selectedVariant === "all"
      ? summary.numberOfGames
      : (summary.stats[selectedVariant]?.games ?? 0);
  const neverPlayed = !summary.isError && gamesEver === 0;

  if (isPending || summary.isPending) return <StatsSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Couldn't load these stats"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div
      className={cn("space-y-4 transition-opacity", isUpdating && "opacity-60")}
      aria-busy={isUpdating || undefined}
    >
      <RatingOverview
        variant={selectedVariant}
        currentRating={statsData.currentRating}
        ratingGain={statsData.ratingGain}
        highestRating={statsData.highestRating}
        globalRank={statsData.globalRank}
        percentile={statsData.percentile}
        friendsRank={statsData.friendsRank}
        friendsCount={statsData.friendsCount}
        unrated={neverPlayed}
      />
      {neverPlayed ? (
        <EmptyState
          icon={BarChart3}
          title="No rated games yet"
          description="The rating chart and results show up after the first rated game."
        />
      ) : statsData.totalGames === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No games in this period"
          description="Pick a longer period, or play a few games and come back."
        />
      ) : (
        <>
          <RatingChart ratingHistory={statsData.ratingHistory ?? []} />
          <ResultsBreakdown statsData={statsData} />
        </>
      )}
    </div>
  );
};

export default ComprehensiveStats;
