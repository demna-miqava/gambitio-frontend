import { SectionHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSeries } from "../hooks/useSeries";
import { SeriesListItem } from "./SeriesListItem";

/**
 * A player's latest friend series, for their profile. Renders nothing for
 * someone who never played one (or when it can't load), so it doesn't
 * crowd profiles of players who don't use series.
 */
export const UserSeriesCard = ({ userId, viewerId }: { userId: number; viewerId?: number }) => {
  const { data, isPending } = useUserSeries(userId, 5);
  if (!isPending && (!data || data.length === 0)) return null;

  return (
    <section
      aria-labelledby="user-series-title"
      className="flex flex-col gap-3 rounded-2xl bg-card p-5"
    >
      <SectionHeader title={<span id="user-series-title">Series</span>} />
      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading series">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <ul className="-mx-2">
          {data!.map((series) => (
            <SeriesListItem key={series.id} series={series} perspectiveId={userId} viewerId={viewerId} />
          ))}
        </ul>
      )}
    </section>
  );
};
