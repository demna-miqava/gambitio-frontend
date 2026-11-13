import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/PageHeader";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, getProfileRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { RankBadge } from "./RankBadge";
import { entryLabel, variantLabel } from "../utils/leaderboard";
import { DEFAULT_LEADERBOARD_VARIANT } from "../variants";

const TOP_COUNT = 5;

/** Home widget: the top five global players in the default variant. */
export const TopPlayers = () => {
  const { id: currentUserId } = useUser();
  const avatarSrc = useAvatarSrc();
  const variant = DEFAULT_LEADERBOARD_VARIANT;
  const { data, isPending, isError } = useLeaderboard({
    variant,
    scope: "global",
    page: 1,
    limit: TOP_COUNT,
  });
  const entries = data?.data ?? [];

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
      <SectionHeader
        title={`Top ${variantLabel(variant).toLowerCase()} players`}
        action={
          <Link
            to={`${ROUTES.LEADERBOARD}?variant=${variant}`}
            className="relative inline-flex touch-target items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Leaderboard <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      {isPending ? (
        <ul className="space-y-3" aria-hidden="true">
          {Array.from({ length: TOP_COUNT }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Couldn't load the leaderboard.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No one is ranked yet. Finish a rated game to take the top spot.
        </p>
      ) : (
        <ol className="-mx-2 space-y-0.5">
          {entries.map((entry) => {
            const isMe = entry.id === currentUserId;
            return (
              <li key={entry.id}>
                <Link
                  to={getProfileRoute(entry.id)}
                  aria-label={entryLabel(entry, isMe)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none",
                    isMe && "bg-brand-soft"
                  )}
                >
                  <RankBadge rank={entry.rank} />
                  <PlayerAvatar
                    username={entry.username}
                    avatarUrl={avatarSrc(entry.id, entry.avatarUrl)}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {entry.username}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {entry.rating}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {data?.me && !entries.some((e) => e.id === data.me!.id) && (
        <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
          You are <span className="font-semibold text-foreground">#{data.me.rank}</span> in{" "}
          {variantLabel(variant).toLowerCase()}
        </p>
      )}
    </section>
  );
};
