import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { usePuzzle } from "../../contexts";
import { RushBoardOverlay } from "../modes/RushBoardOverlay";
import { CalculateBoardOverlay } from "../modes/CalculateBoardOverlay";

export const PuzzleBoard = () => {
  const { boardRef } = useChessBoardContext();
  const { mode } = usePuzzle();

  return (
    <div className="w-full">
      <BoardLayout boardRef={boardRef}>
        {mode === "rush" && <RushBoardOverlay />}
        {mode === "calculate" && <CalculateBoardOverlay />}
      </BoardLayout>
    </div>
  );
};
