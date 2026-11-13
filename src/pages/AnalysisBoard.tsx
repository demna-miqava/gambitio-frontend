import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { ArchiveGameProvider } from "@/features/archive-game/contexts/ArchiveGameContext";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { GameLayout } from "@/features/game/components/GameLayout";
import AnalysisBoardSection from "@/features/import-game/components/BoardSection";
import AnalysisBoardSidebar from "@/features/archive-game/components/ArchiveGameSidebar";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const AnalysisBoard = () => {
  useDocumentTitle("Analysis board");

  return (
    <ChessBoardProvider color="white" isArchiveMode>
      <ArchiveGameProvider storageKey="board">
        <EngineAnalysisProvider defaultEnabled>
          <GameModeProvider mode={GAME_MODES.ANALYSIS}>
            <h1 className="sr-only">Analysis board</h1>
            <GameLayout
              board={<AnalysisBoardSection isGameLoaded />}
              fitPanel
              sidebar={<AnalysisBoardSidebar />}
            />
          </GameModeProvider>
        </EngineAnalysisProvider>
      </ArchiveGameProvider>
    </ChessBoardProvider>
  );
};

export default AnalysisBoard;
