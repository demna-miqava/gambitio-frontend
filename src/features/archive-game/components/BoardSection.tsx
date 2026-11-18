import { BoardEvaluationBar } from "@/features/game-review/components/BoardEvaluationBar";
import ArchiveGameBoard from "./ArchiveGameBoard";
import type { StoredGame } from "@/types";

const BoardSection = ({ gameData }: { gameData: StoredGame }) => {
  return (
    <div className="flex gap-3 w-full">
      <div className="game-layout-eval hidden lg:block w-7 self-stretch">
        {/* Live engine, or the game review while the engine is off */}
        <BoardEvaluationBar />
      </div>
      <ArchiveGameBoard
        whitePlayer={gameData.whitePlayer}
        blackPlayer={gameData.blackPlayer}
        timeControl={gameData.time ?? undefined}
        gameId={gameData.id}
        // In a bot game the computer is the side without a user id
        botSide={
          gameData.botId === null
            ? undefined
            : gameData.whitePlayer.id === null
              ? "white"
              : "black"
        }
      />
    </div>
  );
};

export default BoardSection;
