import { useCallback, useState } from "react";
import type {
  GameEndedMessage,
  InitialGameStateMessage,
  SpectatorsMessage,
} from "@/features/game/types/websocket-messages";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { getSpectatorEndMessage } from "../constants/gameEndMessages";
import { useLiveGame } from "../contexts/LiveGameContext";

export interface SpectatorFinish {
  title: string;
  description: string;
}

/**
 * What a spectator sees besides the board: how many people are watching and,
 * once the game is over, the result told by name. The result is announced to
 * screen readers when it happens while watching.
 */
export const useSpectatorState = () => {
  const { game, announce } = useLiveGame();
  const { playGenericSound } = useChessSound();
  const [spectatorCount, setSpectatorCount] = useState<number | null>(null);
  const [finish, setFinish] = useState<SpectatorFinish | null>(null);
  const white = game.whitePlayer.username;
  const black = game.blackPlayer.username;

  const handleSpectators = useCallback(({ count }: SpectatorsMessage) => {
    setSpectatorCount(count);
  }, []);

  // Sent on connect and every reconnect
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      if (data.spectators !== undefined) setSpectatorCount(data.spectators);
      if (data.isFinished) {
        setFinish(getSpectatorEndMessage(data.result, data.reason, white, black));
      }
    },
    [white, black]
  );

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      const message = getSpectatorEndMessage(data.result, data.reason, white, black);
      setFinish(message);
      announce(`Game over. ${message.title}. ${message.description}`);
      playGenericSound();
    },
    [white, black, announce, playGenericSound]
  );

  useMessageDispatcher<SpectatorsMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.SPECTATORS,
    handleSpectators
  );
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );
  useMessageDispatcher<GameEndedMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.GAME_ENDED,
    handleGameEnded
  );

  return { spectatorCount, finish };
};
