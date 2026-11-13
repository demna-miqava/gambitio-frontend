import { useState, useCallback } from "react";
import { toast } from "sonner";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import type {
  RematchRequestMessage,
  RematchResponseMessage,
  CancelRematchMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import type { MatchFoundMessage } from "@/features/matchmaking/types/websocket-messages";
import { useStartGame } from "@/features/matchmaking/hooks/useStartGame";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";

const NOT_CONNECTED = "Not connected. Try again when you're back online.";

export type RematchState = ReturnType<typeof useRematch>;

/**
 * Rematch offers both ways. Call once per game page and pass the result to
 * every place that shows rematch UI (result dialog, side panel), so they
 * agree.
 */
export const useRematch = ({
  setOpenGameResultDialog,
}: {
  setOpenGameResultDialog: (open: boolean) => void;
}) => {
  const { sendMessage, announce, opponent } = useLiveGame();
  const { startGame } = useStartGame();
  const { id: currentUserId } = useUser();

  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchOffered, setRematchOffered] = useState(false);
  const [rematchDeclined, setRematchDeclined] = useState(false);

  // Restore a pending rematch offer after a reload or reconnect
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      setRematchRequested(data.rematchRequestedBy === currentUserId);
      setRematchOffered(
        data.rematchRequestedBy !== null && data.rematchRequestedBy !== currentUserId
      );
    },
    [currentUserId]
  );

  const handleRematchCanceled = useCallback(() => {
    setRematchOffered(false);
    announce(`${opponent.username} withdrew the rematch offer`);
  }, [announce, opponent.username]);

  const handleRematchRequested = useCallback(() => {
    setRematchOffered(true);
    announce(`${opponent.username} wants a rematch`);
  }, [announce, opponent.username]);

  const handleRematchResponse = useCallback(
    (data: RematchResponseMessage) => {
      if (!data.accepted) {
        setRematchDeclined(true);
        setRematchRequested(false);
        announce(`${opponent.username} declined the rematch`);
      }
    },
    [announce, opponent.username]
  );

  const handleMatchFound = useCallback(
    (data: MatchFoundMessage) => {
      startGame(data);
      setOpenGameResultDialog(false);
    },
    [startGame, setOpenGameResultDialog]
  );

  useMessageDispatcher<CancelRematchMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.REMATCH_CANCELED,
    handleRematchCanceled
  );
  useMessageDispatcher<RematchRequestMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.REMATCH_REQUEST,
    handleRematchRequested
  );
  useMessageDispatcher<RematchResponseMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.REMATCH_RESPONSE,
    handleRematchResponse
  );
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );
  useMessageDispatcher<MatchFoundMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.MATCH_FOUND,
    handleMatchFound
  );

  /** Sends a message, or explains why it couldn't. */
  const send = useCallback(
    (message: object) => {
      const sent = sendMessage(JSON.stringify(message));
      if (!sent) toast.error(NOT_CONNECTED);
      return sent;
    },
    [sendMessage]
  );

  const requestRematch = useCallback(() => {
    if (!send({ type: GAME_MESSAGE_TYPES.REMATCH_REQUEST })) return;
    setRematchRequested(true);
    setRematchDeclined(false);
  }, [send]);

  const acceptRematch = useCallback(() => {
    send({ type: GAME_MESSAGE_TYPES.REMATCH_RESPONSE, data: { accepted: true } });
  }, [send]);

  const declineRematch = useCallback(() => {
    if (!send({ type: GAME_MESSAGE_TYPES.REMATCH_RESPONSE, data: { accepted: false } })) {
      return;
    }
    setRematchOffered(false);
  }, [send]);

  const cancelRematch = useCallback(() => {
    if (!send({ type: GAME_MESSAGE_TYPES.CANCEL_REMATCH })) return;
    setRematchRequested(false);
  }, [send]);

  return {
    rematchRequested,
    rematchOffered,
    rematchDeclined,
    requestRematch,
    acceptRematch,
    declineRematch,
    cancelRematch,
  };
};
