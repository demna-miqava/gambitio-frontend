import { useUser } from "@/hooks/useUser";
import Clock from "@/features/game/components/Clock";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useRef, useMemo } from "react";
import { useSettings } from "@/features/settings/SettingsContext";
import { calculatePlayerRating } from "../utils/rating-helpers";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { ConnectionBanner } from "./ConnectionBanner";

const CurrentGameBoard = () => {
  const { image } = useUser();
  const { boardRef, turn, color } = useChessBoardContext();
  const {
    game,
    player,
    opponent,
    clockRunning,
    gameEnded,
    ratingChanges,
    sendMessage,
    whiteTimeLeft,
    blackTimeLeft,
    pendingPromotion,
    handlePromotionSelect,
    cancelPromotion,
    connectionStatus,
  } = useLiveGame();
  const timeoutSentRef = useRef(false);
  const { settings } = useSettings();

  const { time } = game;
  const username = player.username;
  const rating = player.rating;
  const opponentUsername = opponent.username;
  const opponentRating = opponent.rating;

  const playerRatings = useMemo(
    () =>
      calculatePlayerRating(
        rating,
        color,
        ratingChanges,
        settings?.showRatingsDuringGameEnabled ?? false,
        true
      ),
    [rating, color, ratingChanges, settings?.showRatingsDuringGameEnabled]
  );

  const opponentRatings = useMemo(
    () =>
      calculatePlayerRating(
        opponentRating,
        color,
        ratingChanges,
        settings?.showRatingsDuringGameEnabled ?? false,
        false
      ),
    [
      opponentRating,
      color,
      ratingChanges,
      settings?.showRatingsDuringGameEnabled,
    ]
  );

  // Tells the server a clock reached zero. The server checks its own clock
  // and decides the result, so it doesn't matter which side reports it.
  const handleTimeout = () => {
    if (!timeoutSentRef.current) {
      timeoutSentRef.current = sendMessage(
        JSON.stringify({ type: GAME_MESSAGE_TYPES.TIMEOUT })
      );
    }
  };

  // Clocks keep running while disconnected, like the server's do. The server
  // flags a timeout on its own and resyncs both clocks on reconnect.
  const opponentClockActive = clockRunning && turn !== color;
  const playerClockActive = clockRunning && turn === color;

  return (
    <BoardLayout
      boardRef={boardRef}
      topPlayer={{
        name: opponentUsername,
        startingRating: opponentRatings.startingRating,
        newRating: opponentRatings.newRating,
        ratingChange: gameEnded ? opponentRatings.ratingChange : undefined,
        avatar: (
          <PlayerAvatar
            username={opponentUsername}
            avatarUrl={opponent.avatarUrl}
            isOpponent
            size="sm"
          />
        ),
      }}
      bottomPlayer={{
        name: username,
        startingRating: playerRatings.startingRating,
        newRating: playerRatings.newRating,
        ratingChange: gameEnded ? playerRatings.ratingChange : undefined,
        avatar: (
          <PlayerAvatar username={username} avatarUrl={image} size="sm" />
        ),
      }}
      topPlayerClock={
        <Clock
          startingTime={time}
          isActive={opponentClockActive}
          onTimeout={opponentClockActive ? handleTimeout : undefined}
          gameEnded={gameEnded}
          serverTimeLeft={color === "white" ? blackTimeLeft : whiteTimeLeft}
        />
      }
      bottomPlayerClock={
        <Clock
          startingTime={time}
          isActive={playerClockActive}
          onTimeout={playerClockActive ? handleTimeout : undefined}
          gameEnded={gameEnded}
          serverTimeLeft={color === "white" ? whiteTimeLeft : blackTimeLeft}
        />
      }
    >
      <ConnectionBanner status={connectionStatus} />
      {pendingPromotion && (
        <PromotionSelector
          color={color}
          square={pendingPromotion.to}
          onSelect={handlePromotionSelect}
          onCancel={cancelPromotion}
          boardOrientation={color}
        />
      )}
    </BoardLayout>
  );
};

export default CurrentGameBoard;
