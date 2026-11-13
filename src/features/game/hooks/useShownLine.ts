import { useChessBoardContext } from "../contexts/ChessBoardContext";
import { useGameNavigation } from "../contexts/GameNavigationContext";
import { positionsAlong } from "../utils/material";

/**
 * Positions from the start to the one on the board, for a page on
 * ChessBoardProvider + GameNavigationProvider (follows move navigation).
 *
 * Read on every render, like MovesList: the game lives in a ref, and a server
 * resync can replace moves without changing their count.
 */
export const useShownLine = (): string[] => {
  const { chessRef } = useChessBoardContext();
  const { currentIndex } = useGameNavigation();
  return positionsAlong(chessRef.current?.history({ verbose: true }) ?? [], currentIndex);
};
