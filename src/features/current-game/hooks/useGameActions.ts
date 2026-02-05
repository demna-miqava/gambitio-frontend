import { useState, useCallback } from "react";
import type { GameEndedMessage } from "@/features/game/types/websocket-messages";
import { useChessSound } from "@/features/game/hooks/useChessSound";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { getGameEndMessage } from "../constants/gameEndMessages";
import { useSettings } from "@/features/settings/SettingsContext";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";

type FinishState = {
  title: string;
  description?: string;
  ratingChange?: number;
  newRating?: number;
  opponentRatingChange?: number;
  opponentNewRating?: number;
};

export const useGameActions = () => {
  const { sendMessage } = useLiveGame();
  const { chessRef } = useChessBoardContext();
  const { settings } = useSettings();
  const { playGenericSound } = useChessSound(settings?.soundsEnabled);
  const { id: currentUserId } = useUser();

  const [openGameResultDialog, setOpenGameResultDialog] = useState(false);
  const [finish, setFinish] = useState<FinishState | null>(null);

  const hasMoves = (chessRef.current?.history().length || 0) > 0;

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      const { reason, winnerId } = data;

      const isWinner = winnerId === currentUserId;
      const message = getGameEndMessage(reason, isWinner);

      if (message) {
        setFinish(message);
        setOpenGameResultDialog(true);
        playGenericSound();
      }
    },
    [playGenericSound, currentUserId]
  );

  useMessageDispatcher<GameEndedMessage>(
    GAME_MESSAGE_TYPES.GAME_ENDED,
    handleGameEnded
  );

  const onResign = useCallback(() => {
    sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.RESIGN }));
  }, [sendMessage]);

  const onOfferDraw = useCallback(() => {
    sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.DRAW_OFFER }));
  }, [sendMessage]);

  const onAbort = useCallback(() => {
    sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.ABORT }));
  }, [sendMessage]);

  return {
    openGameResultDialog,
    setOpenGameResultDialog,
    finish,
    onResign,
    onOfferDraw,
    onAbort,
    hasMoves,
  };
};
