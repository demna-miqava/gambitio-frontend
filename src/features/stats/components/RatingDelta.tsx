import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const RatingDelta = ({
  delta,
  className,
}: {
  delta?: number;
  className?: string;
}) => {
  if (delta === 0 || !delta) return null;

  const trend = delta > 0 ? "up" : "down";
  const trendColor = trend === "up" ? "text-rating-up" : "text-rating-down";
  const IconComponent = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <IconComponent className={`size-3 ${trendColor}`} aria-hidden="true" />
      <span className={cn("tabular-nums", trendColor)}>
        <span className="sr-only">{trend === "up" ? "Up " : "Down "}</span>
        {Math.abs(delta)}
      </span>
    </span>
  );
};

export default RatingDelta;
