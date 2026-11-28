import { cn } from "@/lib/utils";

import { SPARKLINE_HEIGHT as HEIGHT, SPARKLINE_PAD as PAD, SPARKLINE_WIDTH as WIDTH, sparklinePoints } from "../utils/sparkline";

/**
 * A rating's last few games as a small line, 72 by 24, with a dot on where
 * it stands now: which way it has been going, at a glance. Decorative (the
 * row's own text carries the rating and its change). With fewer than two
 * games there is no direction yet: a dashed flat line.
 */
export const RatingSparkline = ({ ratings, className }: { ratings?: readonly number[]; className?: string }) => {
  const points = ratings && ratings.length >= 2 ? sparklinePoints(ratings) : null;
  const last = points?.[points.length - 1];
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className={cn("shrink-0 text-faint", className)}
    >
      {points && last ? (
        <>
          <path
            d={points.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={last.x} cy={last.y} r="2.5" className="fill-foreground" />
        </>
      ) : (
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={HEIGHT / 2}
          y2={HEIGHT / 2}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
