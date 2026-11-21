import { useSearchParams } from "react-router-dom";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { ArchiveGameProvider } from "@/features/archive-game/contexts/ArchiveGameContext";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { GameLayout } from "@/features/game/components/GameLayout";
import AnalysisBoardSection from "@/features/import-game/components/BoardSection";
import AnalysisBoardSidebar from "@/features/archive-game/components/ArchiveGameSidebar";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { FEN_PARAM } from "@/constants/routes";
import { playablePositionFromFen, toFen } from "@/features/board-editor/utils/editorPosition";

/**
 * The analysis board: from the usual position (analysis kept in this
 * browser as "board"), or from a position set up in the board editor
 * (?fen=, kept per position). A FEN that isn't a legal position is ignored.
 */
const AnalysisBoard = () => {
  useDocumentTitle("Analysis board");
  const [params] = useSearchParams();
  const position = playablePositionFromFen(params.get(FEN_PARAM));
  const fen = position ? toFen(position) : null;
  // A game that starts from the position: the tree's root is that FEN
  const pgn = fen ? `[SetUp "1"]\n[FEN "${fen}"]\n\n*` : undefined;

  return (
    <ChessBoardProvider
      // A new position is a new board
      key={fen ?? "start"}
      color={position?.turn === "b" ? "black" : "white"}
      isArchiveMode
    >
      <ArchiveGameProvider pgn={pgn} storageKey={fen ? `position:${fen}` : "board"}>
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
