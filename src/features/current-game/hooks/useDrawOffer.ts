import { useState, useCallback, useMemo } from "react";
import type {
  DrawOfferMessage,
  DrawResponseMessage,
  GameEndedMessage,
} from "@/features/game/types/websocket-messages";
import { useUser } from "@/hooks/useUser";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";

export const useDrawOffer = (gameEnded: boolean) => {
  const { id } = useUser();
  const [hasDrawOffer, setHasDrawOffer] = useState(false);
  const [opponentDeclinedDraw, setOpponentDeclinedDraw] = useState(false);

  const handleDrawOffer = useCallback(() => {
    setHasDrawOffer(true);
  }, []);

  const handleDrawResponse = useCallback(
    (data: DrawResponseMessage) => {
      if (data.userId === id) {
        setHasDrawOffer(false);
      } else {
        setOpponentDeclinedDraw(!data.accepted);
      }
    },
    [id]
  );

  const handleGameEnded = useCallback(() => {
    setHasDrawOffer(false);
  }, []);

  useMessageDispatcher<DrawOfferMessage>(
    GAME_MESSAGE_TYPES.DRAW_OFFER,
    handleDrawOffer
  );
  useMessageDispatcher<DrawResponseMessage>(
    GAME_MESSAGE_TYPES.DRAW_RESPONSE,
    handleDrawResponse
  );
  useMessageDispatcher<GameEndedMessage>(
    GAME_MESSAGE_TYPES.GAME_ENDED,
    handleGameEnded
  );

  const showDrawOffer = useMemo(
    () => !gameEnded && hasDrawOffer,
    [gameEnded, hasDrawOffer]
  );

  const showOpponentDeclined = useMemo(
    () => opponentDeclinedDraw,
    [opponentDeclinedDraw]
  );

  return {
    showDrawOffer,
    showOpponentDeclined,
    setHasDrawOffer,
  };
};
