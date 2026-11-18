import { cn } from "@/lib/utils";
import { SideDot } from "@/features/game-review/components/SideDot";
import { ProvisionalMark } from "@/components/ProvisionalMark";

interface CellPlayer {
  /** Null for the computer in a bot game */
  id: number | null;
  username: string;
  rating: number;
  provisional?: boolean;
}

interface PlayerCellProps {
  white: CellPlayer;
  black: CellPlayer;
  /** The side without a user id is a computer bot */
  isBotGame?: boolean;
  /** A table game: unrated, a guest has no rating */
  hideRatings?: boolean;
}

/** A small "bot" after a computer opponent's name */
export const BotTag = ({ className }: { className?: string }) => (
  <span className={cn("shrink-0 text-xs italic text-muted-foreground", className)}>bot</span>
);

const PlayerLine = ({
  player,
  color,
  isBot,
  hideRating,
}: {
  player: CellPlayer;
  color: "white" | "black";
  isBot: boolean;
  hideRating: boolean;
}) => (
  <span className="flex min-w-0 items-center gap-2">
    <span className="sr-only">{color === "white" ? "White:" : "Black:"}</span>
    <SideDot side={color} />
    <span className="truncate text-foreground">{player.username}</span>
    {isBot && <BotTag />}
    {!hideRating && (
      <span className="text-xs tabular-nums text-muted-foreground">
        {player.rating}
        <ProvisionalMark provisional={player.provisional} />
      </span>
    )}
  </span>
);

export const PlayerCell = ({ white, black, isBotGame = false, hideRatings = false }: PlayerCellProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <PlayerLine player={white} color="white" isBot={isBotGame && white.id === null} hideRating={hideRatings} />
      <PlayerLine player={black} color="black" isBot={isBotGame && black.id === null} hideRating={hideRatings} />
    </div>
  );
};
