import { CountingNumber } from "@/components/ui/shadcn-io/counting-number";
import type { ReactNode } from "react";
import { ProvisionalMark } from "@/components/ProvisionalMark";

interface PlayerDisplayProps {
  name: string;
  startingRating?: number;
  /** The rating is still settling: a "?" follows it */
  provisional?: boolean;
  newRating?: number;
  ratingChange?: number;
  avatar?: ReactNode;
  clock?: ReactNode;
  /** Captured pieces and material lead, shown after the rating */
  material?: ReactNode;
}

export const PlayerDisplay = ({
  name,
  startingRating,
  provisional,
  newRating,
  ratingChange,
  avatar,
  clock,
  material,
}: PlayerDisplayProps) => {
  const showNewRating = Boolean(newRating && newRating !== startingRating);
  const hasDetails = showNewRating || startingRating !== undefined || Boolean(material);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 sm:px-0 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {avatar}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {hasDetails && (
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {showNewRating ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  <CountingNumber
                    inView
                    className="text-xs tabular-nums"
                    fromNumber={startingRating}
                    number={newRating!}
                    transition={{ stiffness: 120, damping: 35 }}
                  />
                  <ProvisionalMark provisional={provisional} className="-ml-1.5" />
                  {ratingChange !== undefined && (
                    <span
                      className={
                        ratingChange >= 0
                          ? "tabular-nums text-rating-up"
                          : "tabular-nums text-rating-down"
                      }
                    >
                      {ratingChange >= 0 ? "+" : "−"}
                      {Math.abs(ratingChange)}
                    </span>
                  )}
                </span>
              ) : (
                startingRating !== undefined && (
                  <span className="shrink-0 tabular-nums">
                    {startingRating}
                    <ProvisionalMark provisional={provisional} />
                  </span>
                )
              )}
              {material}
            </div>
          )}
        </div>
      </div>
      {clock}
    </div>
  );
};
