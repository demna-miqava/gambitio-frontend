import { cn } from "@/lib/utils";

interface CellPlayer {
  /** Null for the computer in a bot game */
  id: number | null;
  username: string;
  rating: number;
}

interface PlayerCellProps {
  white: CellPlayer;
  black: CellPlayer;
  /** The side without a user id is a computer bot */
  isBotGame?: boolean;
}

/** Small "Bot" tag after a computer opponent's name */
export const BotTag = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "shrink-0 rounded bg-muted px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
      className
    )}
  >
    Bot
  </span>
);

const PlayerLine = ({
  player,
  color,
  isBot,
}: {
  player: CellPlayer;
  color: "white" | "black";
  isBot: boolean;
}) => (
  <span className="flex min-w-0 items-center gap-2">
    <span className="sr-only">{color === "white" ? "White:" : "Black:"}</span>
    <span
      aria-hidden="true"
      className={
        color === "white"
          ? "size-2.5 shrink-0 rounded-[3px] border border-foreground/30 bg-white"
          : "size-2.5 shrink-0 rounded-[3px] bg-neutral-800 dark:bg-neutral-950 dark:ring-1 dark:ring-white/25"
      }
    />
    <span className="truncate font-medium text-foreground">{player.username}</span>
    {isBot && <BotTag />}
    <span className="text-xs tabular-nums text-muted-foreground">{player.rating}</span>
  </span>
);

export const PlayerCell = ({ white, black, isBotGame = false }: PlayerCellProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <PlayerLine player={white} color="white" isBot={isBotGame && white.id === null} />
      <PlayerLine player={black} color="black" isBot={isBotGame && black.id === null} />
    </div>
  );
};
