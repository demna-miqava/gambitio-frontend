import { cn } from "@/lib/utils";

/**
 * A rating change as a signed number: "+21", "−7" (a real minus sign).
 * Nothing for no change.
 */
const RatingDelta = ({
  delta,
  className,
}: {
  delta?: number;
  className?: string;
}) => {
  if (delta === 0 || !delta) return null;

  const up = delta > 0;

  return (
    <span
      className={cn(
        "tabular-nums",
        up ? "text-rating-up" : "text-rating-down",
        className
      )}
    >
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      <span aria-hidden="true">{up ? "+" : "−"}</span>
      {Math.abs(delta)}
    </span>
  );
};

export default RatingDelta;
