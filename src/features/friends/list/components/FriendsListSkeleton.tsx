import { UsersRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { FriendCardMode } from "../../components/FriendCard";

/**
 * Placeholder rows the same size as FriendCard (48px avatar, p-3, plus sm:p-4
 * in "manage" mode) while the list loads. Pass the expected count as `rows`
 * when it's known; 0 reserves the height of the "No friends yet" state.
 */
export const FriendsListSkeleton = ({
  rows = 4,
  mode = "manage",
}: {
  rows?: number;
  mode?: FriendCardMode;
}) => {
  if (rows === 0) {
    return (
      <Skeleton className="rounded-xl" role="status" aria-label="Loading friends">
        {/* Invisible copy of the empty state: same height, nothing to read */}
        <div className="invisible" aria-hidden="true">
          <EmptyState icon={UsersRound} title="No friends yet" />
        </div>
      </Skeleton>
    );
  }

  return (
    <div className="space-y-2" role="status" aria-label="Loading friends">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3",
            mode === "manage" && "sm:p-4"
          )}
        >
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
          <Skeleton className={cn("w-24 shrink-0", mode === "pick" ? "h-11" : "h-8")} />
        </div>
      ))}
    </div>
  );
};
