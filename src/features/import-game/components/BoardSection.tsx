import { BoardEvaluationBar } from "@/features/game-review/components/BoardEvaluationBar";
import ImportGameBoard, { type ImportedPlayers } from "./ImportGameBoard";

interface BoardSectionProps {
  isGameLoaded: boolean;
  /** Names (and ratings) from the PGN headers */
  players?: ImportedPlayers;
}

const BoardSection = ({ isGameLoaded, players }: BoardSectionProps) => {
  return (
    <div className="flex gap-3 w-full">
      <div className="game-layout-eval hidden lg:block w-7 self-stretch">
        {/* Live engine, or the game review while the engine is off */}
        {isGameLoaded && <BoardEvaluationBar />}
      </div>
      <ImportGameBoard disabled={!isGameLoaded} players={players} />
    </div>
  );
};

export default BoardSection;
