import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import RatingDelta from "../RatingDelta";

export type PerformanceCardProps = {
  label: string;
  rating: number;
  delta?: number;
  highestRating?: number;
  /** Shown instead of best/delta when there's nothing to compare yet, e.g. "No games yet" */
  emptyHint?: string;
  className?: string;
};

// A figure under a rule, not a box: label, rating, then best and change
const CARD = "flex flex-col gap-1";
// The bottom line always takes its height, so every card (and the skeleton) is the same size
const FOOTER = "flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground";

export const PerformanceCard = ({
  label,
  rating,
  delta,
  highestRating,
  emptyHint,
  className,
}: PerformanceCardProps) => {
  return (
    <div className={cn(CARD, className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="font-display-num text-3xl leading-none text-foreground sm:text-4xl">{rating}</p>
      <div className={FOOTER}>
        {emptyHint ? (
          <span>{emptyHint}</span>
        ) : (
          <>
            {!!highestRating && (
              <span>
                Best <span className="tabular-nums text-foreground/80">{highestRating}</span>
              </span>
            )}
            {!!delta && <RatingDelta delta={delta} />}
          </>
        )}
      </div>
    </div>
  );
};

/** A PerformanceCard-sized placeholder: same padding, gaps and line heights. */
export const PerformanceCardSkeleton = () => (
  <div className={CARD} aria-hidden="true">
    <div className="flex h-5 items-center">
      <Skeleton className="h-3.5 w-14" />
    </div>
    <div className="flex h-[1.875rem] items-center sm:h-9">
      <Skeleton className="h-6 w-16 sm:h-7" />
    </div>
    <div className={FOOTER}>
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export default PerformanceCard;
