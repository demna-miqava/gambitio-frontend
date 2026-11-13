import { createContext, useContext, type ReactNode, useMemo } from "react";
import type { PlayerColor } from "../types/game.types";
import { useChessBoard } from "../hooks/useChessBoard";
import type { Chess } from "chess.js";
import type { Api } from "@lichess-org/chessground/api";

interface ChessBoardContextValue {
  boardRef: React.RefObject<HTMLDivElement | null>;
  chessRef: React.RefObject<Chess>;
  cgRef: React.RefObject<Api | null>;
  turn: PlayerColor | undefined;
  /** Call after changing chessRef: records the side to move and move count */
  setTurn: (turn: PlayerColor) => void;
  /** Half-moves played, as of the last setTurn (re-renders on resyncs) */
  ply: number;
  color: PlayerColor;
  isArchiveMode: boolean;
  /** True while the player can't move (game over, disconnected) */
  inputLocked: boolean;
  /** Same as inputLocked, readable from callbacks without re-subscribing */
  inputLockedRef: React.RefObject<boolean>;
  setInputLocked: (locked: boolean) => void;
}

const ChessBoardContext = createContext<ChessBoardContextValue | null>(null);

interface ChessBoardProviderProps {
  children: ReactNode;
  color: PlayerColor;
  isArchiveMode?: boolean;
  /** Decorative board: nothing can be moved or selected */
  viewOnly?: boolean;
}

export const ChessBoardProvider = ({
  children,
  color,
  isArchiveMode = false,
  viewOnly = false,
}: ChessBoardProviderProps) => {
  const chessBoard = useChessBoard({ color, viewOnly });

  const value = useMemo<ChessBoardContextValue>(() => ({
    boardRef: chessBoard.boardRef,
    chessRef: chessBoard.chessRef,
    cgRef: chessBoard.cgRef,
    turn: chessBoard.turn,
    setTurn: chessBoard.setTurn,
    ply: chessBoard.ply,
    color,
    isArchiveMode,
    inputLocked: chessBoard.inputLocked,
    inputLockedRef: chessBoard.inputLockedRef,
    setInputLocked: chessBoard.setInputLocked,
  }), [
    chessBoard.boardRef,
    chessBoard.chessRef,
    chessBoard.cgRef,
    chessBoard.turn,
    chessBoard.setTurn,
    chessBoard.ply,
    color,
    isArchiveMode,
    chessBoard.inputLocked,
    chessBoard.inputLockedRef,
    chessBoard.setInputLocked,
  ]);

  return (
    <ChessBoardContext.Provider value={value}>
      {children}
    </ChessBoardContext.Provider>
  );
};

/* eslint-disable-next-line */
export const useChessBoardContext = () => {
  const context = useContext(ChessBoardContext);
  if (!context) {
    throw new Error(
      "useChessBoardContext must be used within ChessBoardProvider"
    );
  }
  return context;
};
