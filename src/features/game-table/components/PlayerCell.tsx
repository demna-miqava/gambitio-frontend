import { cn } from "@/lib/utils";
import { SideDot } from "@/features/game-review/components/SideDot";

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

/** A small "bot" after a computer opponent's name */
export const BotTag = ({ className }: { className?: string }) => (
  <span className={cn("shrink-0 text-xs italic text-muted-foreground", className)}>bot</span>
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
    <SideDot side={color} />
    <span className="truncate text-foreground">{player.username}</span>
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
