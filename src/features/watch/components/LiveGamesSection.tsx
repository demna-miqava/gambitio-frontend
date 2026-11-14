import type { ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/PageHeader";
import type { LiveGameSummary } from "@/types/liveGames.types";
import { cn } from "@/lib/utils";
import { LiveGameCard } from "./LiveGameCard";

interface LiveGamesSectionProps {
  title: string;
  /** For aria-labelledby */
  id: string;
  games: LiveGameSummary[] | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  empty: ReactNode;
  currentUserId?: number;
  skeletonCount?: number;
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

/** One list of live games with its loading, error and empty states. */
export const LiveGamesSection = ({
  title,
  id,
  games,
  isPending,
  isError,
  isFetching,
  onRetry,
  empty,
  currentUserId,
  skeletonCount = 3,
}: LiveGamesSectionProps) => {
  const headingId = `${id}-heading`;
  let body: ReactNode;

  if (isPending) {
    body = (
      <ul className={GRID} aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <li
            key={i}
            // One card per row on phones: more would only be scrolled past
            className={cn(
              "overflow-hidden rounded-2xl bg-card",
              i > 0 && "max-sm:hidden"
            )}
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            {/* LiveGameCard's rows: two players (32px avatars), the meta line, the button */}
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-3 w-1/2 my-0.5" />
              <Skeleton className="h-8 w-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (isError && !games) {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
          Couldn't load these games.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>
          <RotateCw className={isFetching ? "animate-spin" : undefined} aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  } else if (!games || games.length === 0) {
    body = (
      <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  } else {
    body = (
      <ul className={GRID}>
        {games.map((game) => (
          <li key={game.id}>
            <LiveGameCard game={game} currentUserId={currentUserId} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <SectionHeader
        title={
          <span id={headingId}>
            {title}
            {games && games.length > 0 && (
              <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                {games.length}
              </span>
            )}
          </span>
        }
      />
      {body}
    </section>
  );
};
