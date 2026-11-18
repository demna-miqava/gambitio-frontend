import { ProvisionalMark } from "@/components/ProvisionalMark";
import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Eye, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { getGameRoute } from "@/constants/routes";
import { formatGameTime, hasTimeOdds } from "@/utils/timeControl";
import { cn } from "@/lib/utils";
import { fullMoves } from "@/utils/moves";
import type { LiveGameSummary, LivePlayer } from "@/types/liveGames.types";
import { LiveGamePreview } from "./LiveGamePreview";

const PlayerLine = ({ player, side }: { player: LivePlayer; side: "white" | "black" }) => {
  const avatarSrc = useAvatarSrc();
    return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full ring-1 ring-border",
          side === "white" ? "bg-white" : "bg-neutral-900"
        )}
      />
      <PlayerAvatar
        username={player.username}
        avatarUrl={avatarSrc(player.id, player.avatarUrl)}
        size="sm"
      />
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        <span className="sr-only">{side === "white" ? "White: " : "Black: "}</span>
        {player.username}
      </span>
      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
        {player.rating}
        <ProvisionalMark provisional={player.provisional} />
      </span>
    </div>
  );
};

interface LiveGameCardProps {
  game: LiveGameSummary;
  /** The signed-in user: their own game links back to it instead of watching */
  currentUserId?: number;
}

export const LiveGameCard = ({ game, currentUserId }: LiveGameCardProps) => {
  const matchup = `${game.whitePlayer.username} vs ${game.blackPlayer.username}`;
  const isOwnGame =
    currentUserId !== undefined &&
    (game.whitePlayer.id === currentUserId || game.blackPlayer.id === currentUserId);
  const started = formatDistanceToNowStrict(new Date(game.startedAt), { addSuffix: true });
  const moves = fullMoves(game.numMoves);

  return (
    <article
      aria-label={matchup}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-card"
    >
      <Link
        to={getGameRoute(game.id)}
        tabIndex={-1}
        aria-hidden="true"
        className="block transition-opacity hover:opacity-90"
      >
        <LiveGamePreview fen={game.fen} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <PlayerLine player={game.blackPlayer} side="black" />
        <PlayerLine player={game.whitePlayer} side="white" />
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">{formatGameTime(game)}</span>
          <span className="capitalize">
            {hasTimeOdds(game.whiteTime, game.blackTime) ? "unrated" : game.type}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {moves === 0 ? "Not started" : `Move ${moves}`}
          </span>
          <span aria-hidden="true">·</span>
          <span>Started {started}</span>
        </p>
        <Button asChild size="sm" variant={isOwnGame ? "default" : "outline"} className="mt-auto">
          <Link
            to={getGameRoute(game.id)}
            aria-label={isOwnGame ? `Return to your game: ${matchup}` : `Watch ${matchup}`}
          >
            {isOwnGame ? (
              <Swords aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {isOwnGame ? "Return to game" : "Watch"}
          </Link>
        </Button>
      </div>
    </article>
  );
};
