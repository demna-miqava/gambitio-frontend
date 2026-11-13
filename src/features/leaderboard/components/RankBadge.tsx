import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { podiumTier, type PodiumTier } from "../utils/leaderboard";

// Text stays >= 4.5:1 on the tint over every row background it sits on
// (card, podium row, your own row) in both themes
const TIER_CLASS: Record<PodiumTier, string> = {
  gold: "bg-amber-400/20 text-amber-800 ring-amber-500/40 dark:text-amber-300",
  silver: "bg-slate-400/20 text-slate-700 ring-slate-400/50 dark:text-slate-200",
  bronze: "bg-orange-500/15 text-orange-800 ring-orange-600/40 dark:text-orange-300",
};

/** Rank number; the top three get a medal-coloured badge (and a crown for #1). */
export const RankBadge = ({ rank, className }: { rank: number; className?: string }) => {
  const tier = podiumTier(rank);
  return (
    <span
      className={cn(
        "relative inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums",
        tier ? cn("ring-1", TIER_CLASS[tier]) : "text-muted-foreground",
        className
      )}
    >
      {tier === "gold" && (
        <Crown
          className="absolute -top-2.5 size-3.5 fill-amber-400 text-amber-500"
          aria-hidden="true"
        />
      )}
      {rank}
    </span>
  );
};
