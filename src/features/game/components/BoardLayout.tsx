import { useMemo, type ReactNode } from "react";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@/assets/pieces/chessground.merida.css";
import { PlayerDisplay } from "./PlayerDisplay";
import { MaterialDisplay } from "./MaterialDisplay";
import { getMaterial } from "../utils/material";
import type { PlayerColor } from "../types/game.types";
import { cn } from "@/lib/utils";

interface PlayerInfo {
  name: string;
  /** The name as something to click (it opens the player's card); `name` stays its text */
  nameSlot?: ReactNode;
  startingRating?: number;
  provisional?: boolean;
  newRating?: number;
  ratingChange?: number;
  avatar?: ReactNode;
  /** A short state beside the name ("Disconnected") */
  status?: ReactNode;
}

// Same height with or without a clock, so every board page sizes alike. From
// 640px the row is the 52px strip plus a 12px gap on the board's side, so the
// strips' outer edges are the top and bottom of the board column.
const PLAYER_ROW = "flex min-h-12 flex-col sm:min-h-16";

interface BoardLayoutProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  topPlayer?: PlayerInfo;
  bottomPlayer?: PlayerInfo;
  topPlayerClock?: ReactNode;
  bottomPlayerClock?: ReactNode;
  /** Accessible name of the board (e.g. who's to move and the last move) */
  boardLabel?: string;
  /**
   * Show captured pieces and the material lead in the player rows, for the
   * position `fen` (the one on the board) with `bottom` the colour of the
   * bottom player.
   */
  material?: { fen: string; bottom: PlayerColor };
  children?: ReactNode;
}

/**
 * Reusable board layout component that displays a chess board
 * with player information and clocks at the top and bottom.
 *
 * No card: the board sits in a thin ink frame with the players above and
 * below it. Inside GameLayout the column is capped at --board-max, and the player rows
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
  material,
  children,
}: BoardLayoutProps) => {
  const fen = material?.fen;
  const bottom = material?.bottom ?? "white";
  const sides = useMemo(() => (fen ? getMaterial(fen) : null), [fen]);
  const materialFor = (side: PlayerColor) =>
    sides ? (
      <MaterialDisplay
        material={sides[side]}
        capturedColor={side === "white" ? "black" : "white"}
      />
    ) : undefined;
  const top: PlayerColor = bottom === "white" ? "black" : "white";

  return (
    <section className="board-layout flex w-full max-w-(--board-max) flex-col">
      {topPlayer && (
        <div className={cn(PLAYER_ROW, "board-layout-top justify-start")}>
          <PlayerDisplay {...topPlayer} clock={topPlayerClock} material={materialFor(top)} />
        </div>
      )}

      <div className="board-layout-board board-frame @container relative aspect-square w-full">
        <div
          ref={boardRef}
          className="h-full w-full"
          // Only the board graphic: overlays (promotion picker) stay outside
          {...(boardLabel ? { role: "img", "aria-label": boardLabel } : {})}
        />
        {children}
      </div>

      {bottomPlayer && (
        <div className={cn(PLAYER_ROW, "board-layout-bottom justify-end")}>
          <PlayerDisplay
            {...bottomPlayer}
            clock={bottomPlayerClock}
            material={materialFor(bottom)}
          />
        </div>
      )}
    </section>
  );
};
