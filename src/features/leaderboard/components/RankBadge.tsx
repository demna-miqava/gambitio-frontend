import { cn } from "@/lib/utils";
import { podiumTier } from "../utils/leaderboard";

/** Rank number in the display serif; the top three are in ink, the rest grey. */
export const RankBadge = ({ rank, className }: { rank: number; className?: string }) => (
  <span
    className={cn(
      "inline-flex h-7 min-w-7 items-center justify-center font-display-num text-base",
      podiumTier(rank) ? "text-foreground" : "text-muted-foreground",
      className
    )}
  >
    {rank}
  </span>
);
