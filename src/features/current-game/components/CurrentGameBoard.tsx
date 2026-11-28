import { useUser } from "@/hooks/useUser";
import Clock from "@/features/game/components/Clock";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { DisconnectedMark } from "./DisconnectedMark";
import { usePlayerConnections } from "../hooks/useOpponentConnection";
import { cn } from "@/lib/utils";
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
  // The opponent away from the board (their connection to the game closed
  // and stayed closed): said beside their name, with the avatar stepped back
  const opponentAway = usePlayerConnections().statusOf(opponent.id).away;
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

  // The players' cards open from their names and avatars. They follow the "ratings
  // during a game" setting, and the profile opens in a new tab while the
  // game is on so it isn't left.
  const playerCard = {
    showRatings: settings?.showRatingsDuringGameEnabled ?? false,
    profileInNewTab: !gameEnded,
    speed: game.type,
  };
  const opponentRow = {
    name: opponentUsername,
    nameSlot: (
      <PlayerPopover player={opponent} gameId={game.id} trigger="name" {...playerCard}>
        {opponentUsername}
      </PlayerPopover>
    ),
    startingRating: opponentRatings.startingRating,
    provisional: opponent.provisional,
    newRating: opponentRatings.newRating,
    ratingChange: gameEnded ? opponentRatings.ratingChange : undefined,
    status: opponentAway && <DisconnectedMark />,
    avatar: (
      <PlayerPopover player={opponent} gameId={game.id} {...playerCard}>
        <span className={cn("flex transition-opacity", opponentAway && "opacity-50")}>
          <PlayerAvatar
            username={opponentUsername}
            avatarUrl={opponent.avatarUrl}
            isOpponent
            size="sm"
          />
        </span>
      </PlayerPopover>
    ),
  };
  const playerRow = {
    name: username,
    nameSlot: (
      <PlayerPopover player={player} trigger="name" {...playerCard}>
        {username}
      </PlayerPopover>
    ),
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
    <div className="flex shrink-0 items-center gap-2">
      {/* Beside the clock, inside the strip: under it would stick out below
          the board column when the player's strip is the bottom one */}
      {receivedTime && (
        <span
          className="text-xs font-semibold whitespace-nowrap tabular-nums text-rating-up"
          aria-hidden="true"
        >
          +{receivedTime.seconds}s<span className="max-sm:hidden"> received</span>
        </span>
      )}
      <Clock
        startingTime={startingTime(color)}
        isActive={playerClockActive}
        onTimeout={playerClockActive ? handleTimeout : undefined}
        gameEnded={gameEnded}
        serverTimeLeft={color === "white" ? whiteTimeLeft : blackTimeLeft}
      />
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
