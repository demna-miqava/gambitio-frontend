import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RatingDelta from "../RatingDelta";

export type PerformanceCardProps = {
  icon: ReactNode;
  label: string;
  rating: number;
  delta?: number;
  highestRating?: number;
  /** Shown instead of best/delta when there's nothing to compare yet, e.g. "No games yet" */
  emptyHint?: string;
  className?: string;
};

const CARD = "flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-card p-3 sm:gap-3 sm:p-4";
// The bottom line always takes its height, so every card (and the skeleton) is the same size
const FOOTER = "flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground";

export const PerformanceCard = ({
  icon,
  label,
  rating,
  delta,
  highestRating,
  emptyHint,
  className,
}: PerformanceCardProps) => {
  return (
    <div className={cn(CARD, className)}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
        {icon}
        {label}
      </span>
      <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{rating}</p>
      <div className={FOOTER}>
        {emptyHint ? (
          <span>{emptyHint}</span>
        ) : (
          <>
            {!!highestRating && (
              <span>
                Best <span className="font-medium tabular-nums text-foreground/80">{highestRating}</span>
              </span>
            )}
            {!!delta && <RatingDelta delta={delta} className="font-medium" />}
          </>
        )}
      </div>
    </div>
  );
};

/** A PerformanceCard-sized placeholder: same padding, gaps and line heights. */
export const PerformanceCardSkeleton = () => (
  <div className={CARD} aria-hidden="true">
    <div className="flex h-4 items-center sm:h-5">
      <Skeleton className="h-3 w-14 sm:h-3.5" />
    </div>
    <div className="flex h-8 items-center sm:h-9">
      <Skeleton className="h-6 w-16 sm:h-7" />
    </div>
    <div className={FOOTER}>
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export default PerformanceCard;
