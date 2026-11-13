import { Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceCard, PerformanceCardSkeleton } from "./PerformanceCard";
import { TIME_CONTROL_ICONS } from "@/constants/timeControlIcons";
import { useGetStats } from "../../hooks/useGetStats";

const VARIANTS = [
  { key: "bullet", label: "Bullet" },
  { key: "blitz", label: "Blitz" },
  { key: "rapid", label: "Rapid" },
] as const;

// Three time controls plus puzzles: two rows of two on phones
const FOUR_CARDS = "grid-cols-2 sm:grid-cols-4";

export const PerformanceShowcase = () => {
  const { stats, puzzle, isPending } = useGetStats();

  if (isPending) {
    // Same grid and card size as the loaded cards (servers since migration
    // 008 always send the puzzle card)
    return (
      <div
        className={cn("grid gap-2 sm:gap-3", FOUR_CARDS)}
        role="status"
        aria-label="Loading ratings"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <PerformanceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2 sm:gap-3", puzzle ? FOUR_CARDS : "grid-cols-3")}>
      {VARIANTS.map(({ key, label }) => {
        const Icon = TIME_CONTROL_ICONS[key];
        const played = stats[key].games > 0;
        return (
          <PerformanceCard
            key={key}
            icon={<Icon className="size-4" aria-hidden="true" />}
            label={label}
            rating={stats[key].rating}
            delta={stats[key].delta}
            // A best rating means nothing before the first game
            highestRating={played ? stats[key].highestRating : undefined}
            emptyHint={played ? undefined : "No games yet"}
          />
        );
      })}
      {puzzle && (
        <PerformanceCard
          icon={<Puzzle className="size-4" aria-hidden="true" />}
          label="Puzzles"
          rating={puzzle.rating}
          delta={puzzle.delta}
          highestRating={puzzle.attempts > 0 ? puzzle.highestRating : undefined}
          emptyHint={puzzle.attempts > 0 ? undefined : "No puzzles yet"}
        />
      )}
    </div>
  );
};

export default PerformanceShowcase;
