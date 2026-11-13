import { CountingNumber } from "@/components/ui/shadcn-io/counting-number";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";

interface PlayerDisplayProps {
  name: string;
  startingRating?: number;
  newRating?: number;
  ratingChange?: number;
  avatar?: ReactNode;
  clock?: ReactNode;
}

export const PlayerDisplay = ({
  name,
  startingRating,
  newRating,
  ratingChange,
  avatar,
  clock,
}: PlayerDisplayProps) => {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 sm:px-4 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {avatar}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {newRating && newRating !== startingRating ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CountingNumber
                inView
                className="text-xs tabular-nums"
                fromNumber={startingRating}
                number={newRating}
                transition={{ stiffness: 120, damping: 35 }}
              />
              {ratingChange !== undefined && (
                <span
                  className={
                    ratingChange >= 0
                      ? "flex items-center gap-0.5 font-medium text-rating-up"
                      : "flex items-center gap-0.5 font-medium text-rating-down"
                  }
                >
                  {ratingChange >= 0 ? (
                    <TrendingUp className="size-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="size-3" aria-hidden="true" />
                  )}
                  <span className="tabular-nums">
                    {ratingChange >= 0 ? "+" : ""}
                    {ratingChange}
                  </span>
                </span>
              )}
            </div>
          ) : (
            startingRating !== undefined && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {startingRating}
              </span>
            )
          )}
        </div>
      </div>
      {clock}
    </div>
  );
};
