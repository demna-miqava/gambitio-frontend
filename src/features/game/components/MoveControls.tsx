import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import { BaseMoveControls, type MoveControl } from "./BaseMoveControls";

interface MoveNavigationControlsProps {
  goToFirstMove: () => void;
  goToPreviousMove: () => void;
  goToNextMove: () => void;
  goToLastMove: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
}

/** First / previous / next / last buttons, e.g. fed by useMoveNavigation. */
export const MoveNavigationControls = ({
  goToFirstMove,
  goToPreviousMove,
  goToNextMove,
  goToLastMove,
  isAtStart,
  isAtEnd,
}: MoveNavigationControlsProps) => {
  const controls = useMemo<MoveControl[]>(
    () => [
      {
        id: "first",
        icon: ChevronsLeft,
        title: "First move",
        onClick: goToFirstMove,
        disabled: isAtStart,
      },
      {
        id: "previous",
        icon: ChevronLeft,
        title: "Previous move",
        onClick: goToPreviousMove,
        disabled: isAtStart,
      },
      {
        id: "next",
        icon: ChevronRight,
        title: "Next move",
        onClick: goToNextMove,
        disabled: isAtEnd,
      },
      {
        id: "last",
        icon: ChevronsRight,
        title: "Last move",
        onClick: goToLastMove,
        disabled: isAtEnd,
      },
    ],
    [goToFirstMove, goToPreviousMove, goToNextMove, goToLastMove, isAtStart, isAtEnd]
  );

  return <BaseMoveControls controls={controls} />;
};

/** The controls for a page inside GameNavigationProvider. */
const MoveControls = () => <MoveNavigationControls {...useGameNavigation()} />;

export default MoveControls;
