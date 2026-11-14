import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getProfileRoute } from "@/constants/routes";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { RankBadge } from "./RankBadge";
import type { LeaderboardResponse } from "../types";

interface YourRankBarProps {
  me: NonNullable<LeaderboardResponse["me"]>;
  total: number;
  onShowPage: (page: number) => void;
}

/**
 * The signed-in user's row, pinned to the bottom of the screen (above the
 * phone nav bar) while their row isn't on the page being viewed.
 */
export const YourRankBar = ({ me, total, onShowPage }: YourRankBarProps) => {
  const avatarSrc = useAvatarSrc();
  return (
    <section
      aria-label="Your rank"
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 md:bottom-4"
    >
      <div className="flex items-center gap-3 rounded-xl bg-popover px-4 py-3 shadow-lg">
        <RankBadge rank={me.rank} className="text-foreground" />
        <PlayerAvatar
          username={me.username}
          avatarUrl={avatarSrc(me.id, me.avatarUrl)}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <Link
            to={getProfileRoute(me.id)}
            className="block truncate text-sm font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {me.username}
          </Link>
          <p className="text-xs text-muted-foreground">
            You are <span className="font-medium text-foreground">#{me.rank}</span> of{" "}
            {total.toLocaleString()}
          </p>
        </div>
        <span className="font-medium tabular-nums text-foreground">{me.rating}</span>
        <Button size="sm" variant="outline" onClick={() => onShowPage(me.page)}>
          Show<span className="sr-only sm:not-sr-only">&nbsp;my page</span>
        </Button>
      </div>
    </section>
  );
};
