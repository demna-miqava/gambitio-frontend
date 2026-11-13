import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProfileRoute } from "@/constants/routes";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { RankBadge } from "./RankBadge";
import { entryLabel, podiumTier } from "../utils/leaderboard";
import type { LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: number;
  /** Accessible table name, e.g. "Blitz leaderboard, global" */
  caption: string;
  isLoading: boolean;
  /** Dims the rows while another page loads */
  isFetching?: boolean;
  skeletonRows?: number;
  emptyState: React.ReactNode;
  /** Header of the activity-count column ("Games", "Puzzles") */
  countLabel?: string;
}

const YouTag = () => (
  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase leading-none tracking-wide text-primary-foreground">
    You
  </span>
);

/**
 * Ranked players. Each row's name is a link to the profile, stretched over
 * the whole row, so the row is one click/tap target and one Tab stop.
 * Peak rating and game count are hidden on narrow screens.
 */
export const LeaderboardTable = ({
  entries,
  currentUserId,
  caption,
  isLoading,
  isFetching = false,
  skeletonRows = 10,
  emptyState,
  countLabel = "Games",
}: LeaderboardTableProps) => {
  const avatarSrc = useAvatarSrc();
  if (!isLoading && entries.length === 0) {
    return <div className="rounded-2xl border border-border/70 bg-card">{emptyState}</div>;
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/70 bg-card"
      aria-busy={isLoading || isFetching || undefined}
    >
      <Table className={cn("transition-opacity", isFetching && "opacity-60")}>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 w-16 px-4 text-center text-xs font-medium text-muted-foreground">
              Rank
            </TableHead>
            <TableHead className="h-10 px-2 text-xs font-medium text-muted-foreground">Player</TableHead>
            <TableHead className="h-10 px-4 text-right text-xs font-medium text-muted-foreground">
              Rating
            </TableHead>
            <TableHead className="hidden h-10 px-4 text-right text-xs font-medium text-muted-foreground sm:table-cell">
              Peak
            </TableHead>
            <TableHead className="hidden h-10 px-4 text-right text-xs font-medium text-muted-foreground sm:table-cell">
              {countLabel}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="px-4 py-3">
                    <Skeleton className="mx-auto h-5 w-6" />
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="ml-auto h-4 w-12" />
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <Skeleton className="ml-auto h-4 w-12" />
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <Skeleton className="ml-auto h-4 w-8" />
                  </TableCell>
                </TableRow>
              ))
            : entries.map((entry) => {
                const isMe = entry.id === currentUserId;
                const tier = podiumTier(entry.rank);
                return (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      "relative border-border/60 focus-within:bg-accent/60",
                      tier && "bg-muted/30",
                      isMe && "bg-brand-soft hover:bg-brand-soft/80"
                    )}
                  >
                    <TableCell className="px-4 py-3 text-center">
                      <RankBadge rank={entry.rank} />
                    </TableCell>
                    <TableCell className="w-full max-w-0 px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <PlayerAvatar
                          username={entry.username}
                          avatarUrl={avatarSrc(entry.id, entry.avatarUrl)}
                          size="sm"
                        />
                        <Link
                          to={getProfileRoute(entry.id)}
                          aria-label={entryLabel(entry, isMe)}
                          className="min-w-0 truncate font-medium text-foreground outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                        >
                          {entry.username}
                        </Link>
                        {isMe && <YouTag />}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                      {entry.rating}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                      {entry.highestRating}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                      {entry.gamesPlayed.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
};
