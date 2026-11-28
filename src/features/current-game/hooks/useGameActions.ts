import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  GameEndedMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { getGameEndMessage, type PlayerEndMessage } from "../constants/gameEndMessages";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";

export type FinishState = PlayerEndMessage;

const NOT_CONNECTED = "Not connected. Try again when you're back online.";

/**
 * Resign/abort, and the game result: `finish` is set when the game ends here
 * or when a finished game is opened. The side rail shows it (GameOutcome).
 */
export const useGameActions = () => {
  const { game, sendMessage, opponent, announce } = useLiveGame();
  const { ply } = useChessBoardContext();
  const { playGameEndSound } = useChessSound();
  const { id: currentUserId } = useUser();

  const [finish, setFinish] = useState<FinishState | null>(null);

  // The server allows aborting until both players have made a move of their
  // own: an opening's moves (startPly) don't count
  const hasMoves = ply - (game.startPly ?? 0) >= 2;

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      const { reason, winnerId } = data;

      const isWinner = winnerId === currentUserId;
      const message = getGameEndMessage(reason, isWinner, winnerId === null, opponent.username);

      if (message) {
        setFinish(message);
        // The result appears beside the board, where nothing takes focus
        announce(`${message.title}, ${message.description}`);
        playGameEndSound();
      }
    },
    [playGameEndSound, currentUserId, opponent.username, announce]
  );

  // Opening an already finished game: show the result, with nothing read out
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      if (!data.isFinished || !data.reason) return;
      const winnerId = data.winnerId ?? null;
      const message = getGameEndMessage(
        data.reason,
        winnerId === currentUserId,
        winnerId === null,
        opponent.username
      );
      if (message) setFinish((current) => current ?? message);
    },
    [currentUserId, opponent.username]
  );

  useMessageDispatcher<GameEndedMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.GAME_ENDED,
    handleGameEnded
  );
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );

  const send = useCallback(
    (type: GAME_MESSAGE_TYPES) => {
      if (!sendMessage(JSON.stringify({ type }))) toast.error(NOT_CONNECTED);
    },
    [sendMessage]
  );

  const onResign = useCallback(() => send(GAME_MESSAGE_TYPES.RESIGN), [send]);
  const onAbort = useCallback(() => send(GAME_MESSAGE_TYPES.ABORT), [send]);

  return {
    finish,
    onResign,
    onAbort,
    hasMoves,
  };
};
