import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { ArchiveGameProvider } from "@/features/archive-game/contexts/ArchiveGameContext";
import { GameLoadError } from "@/features/archive-game/components/GameLoadError";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { useParams, useSearchParams } from "react-router-dom";
import { REVIEW_PARAM } from "@/constants/routes";
import { useGameData } from "@/features/archive-game/hooks/useGameData";
import { useUser } from "@/hooks/useUser";
import type { PlayerColor } from "@/features/game/types/game.types";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { GameLayout } from "@/features/game/components/GameLayout";
import BoardSection from "@/features/archive-game/components/BoardSection";
import ArchiveGameSidebar from "@/features/archive-game/components/ArchiveGameSidebar";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { GameReviewProvider } from "@/features/game-review";
import { ShareGifProvider } from "@/features/share-gif";

const ArchiveGame = () => {
  const { gameId } = useParams();
  const { data: gameData, isPending, isFetching, error, refetch } = useGameData(gameId, {
    requireFinished: true,
  });
  const [searchParams] = useSearchParams();
  // Links from the end of a game ask for the review to start right away
  const autoStartReview = searchParams.get(REVIEW_PARAM) === "1";
  const { id: currentUserId } = useUser();
  useDocumentTitle(
    gameData
      ? `${gameData.whitePlayer.username} vs ${gameData.blackPlayer.username}`
      : undefined
  );

  // A copy cached while the game was on is being replaced: don't show it
  const refreshingUnfinished = gameData?.status !== "finished" && isFetching;
  if (isPending || refreshingUnfinished) {
    return <FullScreenLoader height="h-[60vh] w-full" />;
  }

  if (error || !gameData) {
    return <GameLoadError error={error} onRetry={() => refetch()} />;
  }

  // Players see the board from their side; everyone else from white's
  const playerColor: PlayerColor =
    gameData.blackPlayer.id === currentUserId ? "black" : "white";

  const result =
    gameData.result === "white_win"
      ? "1-0"
      : gameData.result === "black_win"
        ? "0-1"
        : gameData.result === "draw"
          ? "1/2-1/2"
          : "*";
  const headers = {
    Event: "Gambitio game",
    Date: new Date(gameData.createdAt).toISOString().slice(0, 10).replace(/-/g, "."),
    White: gameData.whitePlayer.username,
    Black: gameData.blackPlayer.username,
    WhiteElo: String(gameData.whitePlayer.rating),
    BlackElo: String(gameData.blackPlayer.rating),
    Result: result,
  };

  const page = (
    <ShareGifProvider game={gameData} viewerId={currentUserId}>
      <GameModeProvider mode={GAME_MODES.ARCHIVE}>
        <h1 className="sr-only">
          {`Game review: ${gameData.whitePlayer.username} vs ${gameData.blackPlayer.username}`}
        </h1>
        <GameLayout
          board={<BoardSection gameData={gameData} />}
          fitPanel
          sidebar={<ArchiveGameSidebar />}
        />
      </GameModeProvider>
    </ShareGifProvider>
  );

  return (
    <ChessBoardProvider color={playerColor} isArchiveMode={true} key={gameId}>
      <ArchiveGameProvider
        pgn={gameData.pgn || ""}
        storageKey={`game:${gameData.id}`}
        headers={headers}
      >
        <EngineAnalysisProvider>
          {/* Computer review is offered once the game is over */}
          {gameData.status === "finished" ? (
            <GameReviewProvider
              storageId={`game:${gameData.id}`}
              autoStart={autoStartReview}
              players={{
                white: gameData.whitePlayer.username,
                black: gameData.blackPlayer.username,
              }}
            >
              {page}
            </GameReviewProvider>
          ) : (
            page
          )}
        </EngineAnalysisProvider>
      </ArchiveGameProvider>
    </ChessBoardProvider>
  );
};

export default ArchiveGame;
