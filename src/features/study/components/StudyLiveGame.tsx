import { AlertCircle, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import Clock from "@/features/game/components/Clock";
import { LiveGamePreview } from "@/features/watch/components/LiveGamePreview";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { cn } from "@/lib/utils";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { WatchedGame } from "../utils/watchedGame";
import { describeWatchedResult } from "../utils/watchedGame";
import type { WatchedGameStatus } from "../hooks/useWatchedGame";

interface StudyLiveGameProps {
  game: WatchedGame | null;
  status: WatchedGameStatus;
  /** The shared board is on the game's latest move */
  atLive: boolean;
  /** Moves the room's board to the game's latest move */
  onGoLive: () => void;
  /** The room has the latest move in its tree (it may lag the game socket for a moment) */
  canGoLive: boolean;
}

/** Full move number label of the latest move, e.g. "23. Nf3" or "23... Nf6" */
const moveLabel = (ply: number, san: string) => `${Math.ceil(ply / 2)}${ply % 2 === 1 ? "." : "..."} ${san}`;

/**
 * The game a room watches, as everyone watching it sees it: the players,
 * their clocks and the latest position, plus "Live", which takes the
 * room's board to the latest move (L). The room's own analysis is the
 * board beside it.
 */
export const StudyLiveGame = ({ game, status, atLive, onGoLive, canGoLive }: StudyLiveGameProps) => {
  useShortcutKey("l", onGoLive, canGoLive && !atLive);

  if (!game) {
    return (
      <section aria-label="The game" className="rounded-xl bg-card p-3 lg:rounded-none lg:bg-transparent">
        {status === "error" ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4 text-loss" aria-hidden="true" />
            Couldn't open the game. The room still works.
          </p>
        ) : (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Connecting to the game…
          </p>
        )}
      </section>
    );
  }

  const turn: PlayerColor = game.fen.split(" ")[1] === "b" ? "black" : "white";
  const row = (side: PlayerColor) => {
    const player = side === "white" ? game.white : game.black;
    const timeLeft = side === "white" ? game.whiteTimeLeft : game.blackTimeLeft;
    const active = game.inProgress && game.clockRunning && turn === side;
    return (
      <div className="flex min-w-0 items-center gap-2">
        <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium text-foreground">
            <span className="sr-only">{side === "white" ? "White: " : "Black: "}</span>
            {player.username}
          </div>
          <div className="text-xs tabular-nums text-muted-foreground">
            {player.rating}
            <ProvisionalMark provisional={player.provisional} />
          </div>
        </div>
        <div className="shrink-0 origin-right scale-90">
          <Clock
            startingTime={game.time}
            isActive={active}
            gameEnded={!game.inProgress}
            serverTimeLeft={timeLeft ?? undefined}
          />
        </div>
      </div>
    );
  };

  return (
    <section aria-label="The game" className="space-y-2.5 rounded-xl bg-card p-3 lg:rounded-none lg:bg-transparent">
      <div className="flex items-center justify-between gap-2 text-xs">
        {game.inProgress ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 font-medium text-foreground">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rating-up opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-rating-up" />
            </span>
            Watching live
          </span>
        ) : (
          <span role="status" className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
            {describeWatchedResult(game)}
          </span>
        )}
        {status === "reconnecting" && (
          <span role="status" className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            Reconnecting…
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-20 shrink-0 sm:w-24">
          <LiveGamePreview fen={game.fen} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {row("black")}
          {row("white")}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={atLive ? "secondary" : "default"}
        className={cn("w-full", atLive && "text-muted-foreground")}
        onClick={onGoLive}
        disabled={!canGoLive}
        aria-pressed={atLive}
        aria-keyshortcuts="L"
        title="Go to the latest move (L)"
      >
        <Radio aria-hidden="true" />
        {atLive ? "At the latest move" : "Live"}
        {game.lastMove && (
          <span className="font-normal tabular-nums opacity-80">· {moveLabel(game.ply, game.lastMove.san)}</span>
        )}
      </Button>
    </section>
  );
};
