import { useMemo } from "react";
import { useChessBoardContext } from "../contexts/ChessBoardContext";
import { useGameNavigation } from "../contexts/GameNavigationContext";
import { positionsAlong } from "../utils/material";

/**
 * Positions from the start to the one on the board, for a page on
 * ChessBoardProvider + GameNavigationProvider (follows move navigation).
 *
 * Built from the board's shared move list, which is a new array whenever the
 * line changes (a server resync can replace moves without changing their
 * count), so memoizing on it is safe.
 */
export const useShownLine = (): string[] => {
  const { moves } = useChessBoardContext();
  const { currentIndex } = useGameNavigation();
  return useMemo(() => positionsAlong(moves, currentIndex), [moves, currentIndex]);
};
