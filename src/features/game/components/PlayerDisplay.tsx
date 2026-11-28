import { CountingNumber } from "@/components/ui/shadcn-io/counting-number";
import type { ReactNode } from "react";
import { ProvisionalMark } from "@/components/ProvisionalMark";

interface PlayerDisplayProps {
  name: string;
  /** The name as something to click (it opens the player's card); `name` stays its text */
  nameSlot?: ReactNode;
  startingRating?: number;
  /** The rating is still settling: a "?" follows it */
  provisional?: boolean;
  newRating?: number;
  ratingChange?: number;
  avatar?: ReactNode;
  /** A short state beside the name and rating ("Disconnected") */
  status?: ReactNode;
  clock?: ReactNode;
  /** Captured pieces and material lead, shown under the name */
  material?: ReactNode;
}

/**
 * A player's strip above or below the board: avatar, the name with the
 * rating beside it (muted), the captured pieces under them, and the clock
 * at the right. 48px tall on phones, 52px from 640px.
 */
export const PlayerDisplay = ({
  name,
  nameSlot,
  startingRating,
  provisional,
  newRating,
  ratingChange,
  avatar,
  status,
  clock,
  material,
}: PlayerDisplayProps) => {
  const showNewRating = Boolean(newRating && newRating !== startingRating);

  return (
    <div className="flex h-12 items-center gap-3 px-3 sm:h-[52px] sm:px-0">
      {avatar}
      <div className="min-w-0 flex-1 leading-[1.3]">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-semibold text-foreground">{nameSlot ?? name}</span>
          {showNewRating ? (
            <span className="flex shrink-0 items-baseline gap-1.5 text-sm text-faint">
              <CountingNumber
                inView
                className="tabular-nums"
                fromNumber={startingRating}
                number={newRating!}
                transition={{ stiffness: 120, damping: 35 }}
              />
              <ProvisionalMark provisional={provisional} className="-ml-1.5" />
              {ratingChange !== undefined && (
                <span
                  className={
                    ratingChange >= 0
                      ? "font-semibold tabular-nums text-rating-up"
                      : "font-semibold tabular-nums text-rating-down"
                  }
                >
                  {ratingChange >= 0 ? "+" : "−"}
                  {Math.abs(ratingChange)}
                </span>
              )}
            </span>
          ) : (
            startingRating !== undefined && (
              <span className="shrink-0 text-sm tabular-nums text-faint">
                {startingRating}
                <ProvisionalMark provisional={provisional} />
              </span>
            )
          )}
          {status}
        </p>
        {/* On a page that counts material the line is always there, so the
            name doesn't jump when the first piece is taken */}
        {material !== undefined && <div className="flex h-5 min-w-0 items-center">{material}</div>}
      </div>
      {clock}
    </div>
  );
};
