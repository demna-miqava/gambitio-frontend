import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { readImportGameState } from "@/features/import-game/importGameState";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { ArchiveGameProvider } from "@/features/archive-game/contexts/ArchiveGameContext";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { GameLayout } from "@/features/game/components/GameLayout";
import BoardSection from "@/features/import-game/components/BoardSection";
import ImportGameSidebar from "@/features/import-game/components/ImportGameSidebar";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { GameReviewProvider } from "@/features/game-review";
import { parsePgn } from "@/features/archive-game/utils/pgn";
import type { ImportedPlayers } from "@/features/import-game/components/ImportGameBoard";

const ImportGame = () => {
  const location = useLocation();
  // Opened from the end of a bot game that couldn't be saved: that game is
  // loaded (and maybe reviewed)
  const [initial] = useState(() => readImportGameState(location.state));
  const [pgn, setPgn] = useState<string | null>(initial?.pgn ?? null);
  const showingHandedOffGame = !!initial && pgn === initial.pgn;
  const autoStartReview = showingHandedOffGame && !!initial.review;
  // Nothing was imported in that case, so don't call it that
  const title = showingHandedOffGame
    ? initial.review
      ? "Game review"
      : "Analysis"
    : "Import a game";
  const isGameLoaded = !!pgn;
  // Players from the PGN headers: names for the review summary, and names
  // and ratings for the board's player rows
  const boardPlayers = useMemo<ImportedPlayers | undefined>(() => {
    if (!pgn) return undefined;
    try {
      const { White, Black, WhiteElo, BlackElo } = parsePgn(pgn).headers;
      const rating = (elo?: string) => (elo && /^\d+$/.test(elo) ? { rating: Number(elo) } : {});
      return {
        white: { name: White || "White", ...rating(WhiteElo) },
        black: { name: Black || "Black", ...rating(BlackElo) },
      };
    } catch {
      return undefined;
    }
  }, [pgn]);
  const players = useMemo(
    () => (boardPlayers ? { white: boardPlayers.white.name, black: boardPlayers.black.name } : undefined),
    [boardPlayers]
  );
  useDocumentTitle(title);

  const handleLoadPgn = (newPgn: string) => {
    setPgn(newPgn);
  };

  const handleNewGame = () => {
    setPgn(null);
  };

  const page = (
    <GameModeProvider mode={GAME_MODES.ANALYSIS}>
      <h1 className="sr-only">{title}</h1>
      <GameLayout
        board={<BoardSection isGameLoaded={isGameLoaded} players={boardPlayers} />}
        fitPanel={isGameLoaded}
        sidebar={
          <ImportGameSidebar
            onLoadPgn={handleLoadPgn}
            onNewGame={handleNewGame}
            isGameLoaded={isGameLoaded}
          />
        }
      />
    </GameModeProvider>
  );

  return (
    <ChessBoardProvider
      color="white"
      isArchiveMode={isGameLoaded}
      key={pgn || "empty"}
    >
      <ArchiveGameProvider pgn={pgn || undefined}>
        <EngineAnalysisProvider>
          {/* Reviews of imported games are cached for the session only */}
          {isGameLoaded ? <GameReviewProvider players={players} autoStart={autoStartReview}>
              {page}
            </GameReviewProvider> : page}
        </EngineAnalysisProvider>
      </ArchiveGameProvider>
    </ChessBoardProvider>
  );
};

export default ImportGame;
