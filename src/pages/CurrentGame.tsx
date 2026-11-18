import CurrentGameBoard from "@/features/current-game/components/CurrentGameBoard";
import { MovesContainer } from "@/features/current-game/components/MovesContainer";
import { LiveGameChrome } from "@/features/current-game/components/LiveGameChrome";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { GameNavigationProvider } from "@/features/game/contexts/GameNavigationContext";
import { LiveGameProvider } from "@/features/current-game/contexts/LiveGameContext";
import { Navigate, useParams } from "react-router-dom";
import { useState } from "react";
import { SpectatorView } from "@/features/current-game/components/SpectatorView";
import { GameLayout } from "@/features/game/components/GameLayout";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { useGameData } from "@/features/archive-game/hooks/useGameData";
import { GameLoadError } from "@/features/archive-game/components/GameLoadError";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { useUser } from "@/hooks/useUser";
import { getArchiveGameRoute } from "@/constants/routes";
import { isPlayerGame } from "@/utils/storedGame";
import { GameChatProvider } from "@/features/game-chat/GameChatContext";
import { parsePositiveId } from "@/utils/ids";

/**
 * Live game page. Players, colors and time control come from the server, so
 * the page works when opened from a link or after a reload. People who
 * aren't playing watch a game in progress here (read-only, live); a game
 * that was already over when they opened it goes to the archive view.
 */
const CurrentGame = () => {
  const { gameId } = useParams();
  // Only a plain numeric id reaches the API (React Router decodes "%2F")
  const validId = parsePositiveId(gameId);
  const { data: game, isPending, error, refetch } = useGameData(validId);
  const { id: currentUserId } = useUser();
  // The game id last seen in progress. A spectator stays on the page when
  // the game ends (even if a refetch now says "finished") to see the result.
  const [seenLive, setSeenLive] = useState<string | null>(null);
  if (game?.status === "in_progress" && gameId && seenLive !== gameId) {
    setSeenLive(gameId);
  }

  if (validId === null) return <GameLoadError error={null} onRetry={() => refetch()} />;
  // Without the user's id a player would look like a spectator
  if (isPending || currentUserId === undefined) {
    return <FullScreenLoader height="h-[60vh] w-full" />;
  }
  // A failed background refetch keeps the cached game: don't tear down a
  // game in progress over it
  if (!game) return <GameLoadError error={error} onRetry={() => refetch()} />;
  // Bot games are only ever stored finished: there's nothing live to show
  if (!isPlayerGame(game)) return <Navigate to={getArchiveGameRoute(game.id)} replace />;

  const color =
    game.whitePlayer.id === currentUserId
      ? "white"
      : game.blackPlayer.id === currentUserId
        ? "black"
        : null;
  if (!color) {
    const watchable = game.status === "in_progress" || seenLive === gameId;
    if (!watchable) return <Navigate to={getArchiveGameRoute(game.id)} replace />;
    // White at the bottom; the view can flip it. viewOnly: nothing to move.
    return (
      <ChessBoardProvider color="white" viewOnly key={gameId}>
        <GameNavigationProvider>
          <LiveGameProvider game={game} spectating>
            <GameModeProvider mode={GAME_MODES.LIVE}>
              <LiveGameChrome />
              <SpectatorView />
            </GameModeProvider>
          </LiveGameProvider>
        </GameNavigationProvider>
      </ChessBoardProvider>
    );
  }

  return (
    <ChessBoardProvider color={color} key={gameId}>
      <GameNavigationProvider>
        <LiveGameProvider game={game}>
          <GameChatProvider>
            <GameModeProvider mode={GAME_MODES.LIVE}>
              <LiveGameChrome />
              <GameLayout
                board={<CurrentGameBoard />}
                sidebar={<MovesContainer />}
              />
            </GameModeProvider>
          </GameChatProvider>
        </LiveGameProvider>
      </GameNavigationProvider>
    </ChessBoardProvider>
  );
};

export default CurrentGame;
