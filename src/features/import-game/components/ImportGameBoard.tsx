import { useEffect } from "react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { AnalysisPromotion } from "@/features/archive-game/components/AnalysisPromotion";
import { useArchiveGame } from "@/features/archive-game/contexts/ArchiveGameContext";
import { boardLabel } from "@/features/archive-game/utils/announce";
import { SideDot } from "@/features/game-review/components/SideDot";
import type { Side } from "@/features/game-review/types";
import { useMediaQuery } from "@/hooks/use-mobile";

export interface ImportedPlayer {
  name: string;
  rating?: number;
}

export interface ImportedPlayers {
  white: ImportedPlayer;
  black: ImportedPlayer;
}

const DEFAULT_PLAYERS: ImportedPlayers = { white: { name: "White" }, black: { name: "Black" } };

/** Neutral avatar for a PGN player: the side's colour on a tile */
const SideAvatar = ({ side }: { side: Side }) => (
  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted" aria-hidden="true">
    <SideDot side={side} className="size-3.5" />
  </span>
);

interface ImportGameBoardProps {
  disabled?: boolean;
  /** From the PGN headers; "White" / "Black" when it has none */
  players?: ImportedPlayers;
}

/**
 * Board for imported PGNs and the free analysis board. From lg it shows
 * both players like an archived game, so it sizes like every other board
 * page (the sizing rule counts the player rows) and the analysis panel
 * beside it, which is as tall as the board column, gets that height too.
 * Phones keep the bare board.
 */
const ImportGameBoard = ({ disabled = false, players = DEFAULT_PLAYERS }: ImportGameBoardProps) => {
  const { boardRef, cgRef, color } = useChessBoardContext();
  const { currentNode } = useArchiveGame();
  const showPlayers = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({ viewOnly: disabled });
  }, [cgRef, disabled]);

  const topSide: Side = color === "white" ? "black" : "white";
  const bottomSide: Side = color === "white" ? "white" : "black";
  const row = (side: Side) => ({
    name: players[side].name,
    ...(players[side].rating !== undefined && { startingRating: players[side].rating }),
    avatar: <SideAvatar side={side} />,
  });

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={boardLabel(currentNode)}
      {...(showPlayers && { topPlayer: row(topSide), bottomPlayer: row(bottomSide) })}
    >
      <AnalysisPromotion />
    </BoardLayout>
  );
};

export default ImportGameBoard;
