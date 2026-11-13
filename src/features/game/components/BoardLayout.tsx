import type { ReactNode } from "react";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";
import { PlayerDisplay } from "./PlayerDisplay";

interface PlayerInfo {
  name: string;
  startingRating?: number;
  newRating?: number;
  ratingChange?: number;
  avatar?: ReactNode;
}

// Same height with or without a clock, so every board page sizes alike
const PLAYER_ROW = "flex min-h-12 flex-col justify-center sm:min-h-16";

interface BoardLayoutProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  topPlayer?: PlayerInfo;
  bottomPlayer?: PlayerInfo;
  topPlayerClock?: ReactNode;
  bottomPlayerClock?: ReactNode;
  /** Accessible name of the board (e.g. who's to move and the last move) */
  boardLabel?: string;
  children?: ReactNode;
}

/**
 * Reusable board layout component that displays a chess board
 * with player information and clocks at the top and bottom.
 *
 * Inside GameLayout the card is capped at --board-max, and the player rows
 * have a fixed minimum height (3rem, 4rem from 640px) that the cap in
 * index.css counts on. The board is a size container so the coordinates can
 * scale with the squares.
 */
export const BoardLayout = ({
  boardRef,
  topPlayer,
  bottomPlayer,
  topPlayerClock,
  bottomPlayerClock,
  boardLabel,
  children,
}: BoardLayoutProps) => {
  return (
    <section className="flex w-full max-w-(--board-max) flex-col overflow-hidden bg-card sm:rounded-2xl sm:border sm:border-border/70 sm:shadow-sm">
      {topPlayer && (
        <div className={PLAYER_ROW}>
          <PlayerDisplay {...topPlayer} clock={topPlayerClock} />
        </div>
      )}

      <div className="@container relative aspect-square w-full">
        <div
          ref={boardRef}
          className="h-full w-full"
          // Only the board graphic: overlays (promotion picker) stay outside
          {...(boardLabel ? { role: "img", "aria-label": boardLabel } : {})}
        />
        {children}
      </div>

      {bottomPlayer && (
        <div className={PLAYER_ROW}>
          <PlayerDisplay {...bottomPlayer} clock={bottomPlayerClock} />
        </div>
      )}
    </section>
  );
};
