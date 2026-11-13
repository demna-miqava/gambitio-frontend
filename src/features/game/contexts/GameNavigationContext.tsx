import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useChessBoardContext } from "./ChessBoardContext";
import { Chess } from "chess.js";
import { calculateLegalMoves } from "../utils/board-utils";
import { useMoveNavigation } from "../hooks/useMoveNavigation";

interface GameNavigationContextValue {
  goToFirstMove: () => void;
  goToPreviousMove: () => void;
  goToNextMove: () => void;
  goToLastMove: () => void;
  /** Shows the position after `moveCount` moves (0 = start) */
  goToMove: (moveCount: number) => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  viewingIndex: number | null;
  currentIndex: number;
  isViewingHistory: boolean;
}

const GameNavigationContext = createContext<GameNavigationContextValue | null>(
  null
);

interface GameNavigationProviderProps {
  children: ReactNode;
}

export const GameNavigationProvider = ({
  children,
}: GameNavigationProviderProps) => {
  // `ply` is in the deps so this re-renders whenever moves are loaded
  const { chessRef, cgRef, color, isArchiveMode, inputLocked, ply } =
    useChessBoardContext();
  const totalMoves = chessRef.current?.history().length ?? ply;

  const {
    goToFirstMove,
    goToPreviousMove,
    goToNextMove,
    goToLastMove,
    goToMove,
    isAtStart,
    isAtEnd,
    viewingIndex,
    currentIndex,
    isViewingHistory,
  } = useMoveNavigation(totalMoves);

  // Handle navigation - runs when user explicitly navigates
  useEffect(() => {
    if (!chessRef.current || !cgRef.current) return;

    const history = chessRef.current.history({ verbose: true });

    if (isViewingHistory) {
      // Viewing a historical position
      const tempChess = new Chess();

      // Replay moves up to currentIndex
      for (let i = 0; i < currentIndex; i++) {
        tempChess.move(history[i].san);
      }
      const shownMove = history[currentIndex - 1];

      // Update the board to show this historical position
      cgRef.current.set({
        fen: tempChess.fen(),
        movable: {
          color: isArchiveMode ? "both" : undefined, // Allow moves in archive mode
          dests: isArchiveMode ? calculateLegalMoves(tempChess) : new Map(),
        },
        check: tempChess.inCheck(),
        turnColor: tempChess.turn() === "w" ? "white" : "black",
        lastMove: shownMove ? [shownMove.from, shownMove.to] : undefined,
      });
    } else if (viewingIndex === null && history.length > 0) {
      // User navigated back to current position - restore the live board state
      const playerColorCode = color === "white" ? "w" : "b";
      const isMyTurn = chessRef.current.turn() === playerColorCode;
      const lastMove = history[history.length - 1];
      const canMove = isArchiveMode || !inputLocked;

      cgRef.current.set({
        fen: chessRef.current.fen(),
        movable: {
          color: isArchiveMode ? "both" : inputLocked ? undefined : color,
          dests:
            canMove && (isArchiveMode || isMyTurn)
              ? calculateLegalMoves(chessRef.current)
              : new Map(),
        },
        check: chessRef.current.inCheck(),
        turnColor: chessRef.current.turn() === "w" ? "white" : "black",
        lastMove: [lastMove.from, lastMove.to],
      });
    }
  }, [
    viewingIndex,
    chessRef,
    cgRef,
    isViewingHistory,
    currentIndex,
    color,
    isArchiveMode,
    inputLocked,
  ]);

  const value = useMemo<GameNavigationContextValue>(() => ({
    goToFirstMove,
    goToPreviousMove,
    goToNextMove,
    goToLastMove,
    goToMove,
    isAtStart,
    isAtEnd,
    viewingIndex,
    currentIndex,
    isViewingHistory,
  }), [
    goToFirstMove,
    goToPreviousMove,
    goToNextMove,
    goToLastMove,
    goToMove,
    isAtStart,
    isAtEnd,
    viewingIndex,
    currentIndex,
    isViewingHistory
  ]);

  return (
    <GameNavigationContext.Provider value={value}>
      {children}
    </GameNavigationContext.Provider>
  );
};

/* eslint-disable-next-line */
export const useGameNavigation = () => {
  const context = useContext(GameNavigationContext);
  if (!context) {
    throw new Error(
      "useGameNavigation must be used within GameNavigationProvider"
    );
  }
  return context;
};
