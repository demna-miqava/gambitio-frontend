import { useUser } from "@/hooks/useUser";
import Clock from "@/features/game/components/Clock";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { useSettings } from "@/features/settings/SettingsContext";
import { calculatePlayerRating } from "../utils/rating-helpers";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { ConnectionBanner } from "./ConnectionBanner";
import { GiveTimeButton } from "./GiveTimeButton";
import { useShownLine } from "@/features/game/hooks/useShownLine";
import type { PlayerColor } from "@/features/game/types/game.types";

const CurrentGameBoard = () => {
  const { image } = useUser();
  const { boardRef, turn, color, orientation } = useChessBoardContext();
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
    receivedTime,
  } = useLiveGame();
  const timeoutSentRef = useRef(false);
  const shownLine = useShownLine();
  const { settings } = useSettings();

  // Each side's own starting clock: they differ in a game with time odds
  const startingTime = (side: PlayerColor) =>
    (side === "white" ? game.whiteTime : game.blackTime) ?? game.time;
  const opponentColor: PlayerColor = color === "white" ? "black" : "white";
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
  // Once per server clock update: a report the server didn't take (the
  // clock here ran a little ahead) is followed by new times, after which
  // the next zero is reported again.
  const handleTimeout = useCallback(() => {
    if (!timeoutSentRef.current) {
      timeoutSentRef.current = sendMessage(
        JSON.stringify({ type: GAME_MESSAGE_TYPES.TIMEOUT })
      );
    }
  }, [sendMessage]);
  useEffect(() => {
    timeoutSentRef.current = false;
  }, [whiteTimeLeft, blackTimeLeft]);

  // Clocks keep running while disconnected, like the server's do. The server
  // flags a timeout on its own and resyncs both clocks on reconnect.
  const opponentClockActive = clockRunning && turn !== color;
  const playerClockActive = clockRunning && turn === color;

  // The players' cards open from their avatars. They follow the "ratings
  // during a game" setting, and the profile opens in a new tab while the
  // game is on so it isn't left.
  const playerCard = {
    showRatings: settings?.showRatingsDuringGameEnabled ?? false,
    profileInNewTab: !gameEnded,
  };
  const opponentRow = {
    name: opponentUsername,
    startingRating: opponentRatings.startingRating,
    provisional: opponent.provisional,
    newRating: opponentRatings.newRating,
    ratingChange: gameEnded ? opponentRatings.ratingChange : undefined,
    avatar: (
      <PlayerPopover player={opponent} gameId={game.id} {...playerCard}>
        <PlayerAvatar
          username={opponentUsername}
          avatarUrl={opponent.avatarUrl}
          isOpponent
          size="sm"
        />
      </PlayerPopover>
    ),
  };
  const playerRow = {
    name: username,
    startingRating: playerRatings.startingRating,
    provisional: player.provisional,
    newRating: playerRatings.newRating,
    ratingChange: gameEnded ? playerRatings.ratingChange : undefined,
    avatar: (
      <PlayerPopover player={player} {...playerCard}>
        <PlayerAvatar username={username} avatarUrl={image} size="sm" />
      </PlayerPopover>
    ),
  };
  const opponentClock = (
    <div className="flex shrink-0 items-center gap-1">
      <GiveTimeButton />
      <Clock
        startingTime={startingTime(opponentColor)}
        isActive={opponentClockActive}
        onTimeout={opponentClockActive ? handleTimeout : undefined}
        gameEnded={gameEnded}
        serverTimeLeft={color === "white" ? blackTimeLeft : whiteTimeLeft}
      />
    </div>
  );
  const playerClock = (
    <div className="flex shrink-0 flex-col items-center">
      <Clock
        startingTime={startingTime(color)}
        isActive={playerClockActive}
        onTimeout={playerClockActive ? handleTimeout : undefined}
        gameEnded={gameEnded}
        serverTimeLeft={color === "white" ? whiteTimeLeft : blackTimeLeft}
      />
      <span
        className="h-4 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400"
        aria-hidden="true"
      >
        {receivedTime ? `+${receivedTime.seconds}s received` : ""}
      </span>
    </div>
  );
  // The player is at the bottom unless they flipped the board
  const flipped = orientation !== color;

  return (
    <BoardLayout
      boardRef={boardRef}
      material={{ fen: shownLine[shownLine.length - 1], bottom: orientation }}
      topPlayer={flipped ? playerRow : opponentRow}
      bottomPlayer={flipped ? opponentRow : playerRow}
      topPlayerClock={flipped ? playerClock : opponentClock}
      bottomPlayerClock={flipped ? opponentClock : playerClock}
    >
      <ConnectionBanner status={connectionStatus} />
      {pendingPromotion && (
        <PromotionSelector
          color={color}
          square={pendingPromotion.to}
          onSelect={handlePromotionSelect}
          onCancel={cancelPromotion}
          boardOrientation={orientation}
        />
      )}
    </BoardLayout>
  );
};

export default CurrentGameBoard;
