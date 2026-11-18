import { useState, useCallback, useEffect } from "react";
import type {
  DrawOfferMessage,
  DrawResponseMessage,
  GameErrorMessage,
  InitialGameStateMessage,
  MoveMessage,
  TakebackMessage,
} from "@/features/game/types/websocket-messages";
import { useUser } from "@/hooks/useUser";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { toast } from "sonner";
import { useLiveGame } from "../contexts/LiveGameContext";

const DRAW_TOAST_ID = "draw_offer";
const NOT_CONNECTED = "Not connected. Try again when you're back online.";

/**
 * Draw offers both ways. An incoming offer shows as a toast with
 * Accept/Decline (the panel prompt can be below the fold on phones) and in
 * the side panel. An outgoing offer stays "offered" until the opponent
 * answers or moves (moving declines it on the server).
 */
export const useDrawOffer = () => {
  const { id } = useUser();
  const { gameEnded, sendMessage } = useLiveGame();
  const [incomingOffer, setIncomingOffer] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [opponentDeclined, setOpponentDeclined] = useState(false);
  // After a declined offer the server refuses another until we move again
  // (DRAW_DECLINED), so the button waits for our next move
  const [declinedSinceMyMove, setDeclinedSinceMyMove] = useState(false);

  const respond = useCallback(
    (accepted: boolean) => {
      toast.dismiss(DRAW_TOAST_ID);
      const sent = sendMessage(
        JSON.stringify({ type: GAME_MESSAGE_TYPES.DRAW_RESPONSE, accepted })
      );
      if (!sent) {
        toast.error(NOT_CONNECTED);
        return;
      }
      setIncomingOffer(false);
    },
    [sendMessage]
  );

  const showOfferToast = useCallback(() => {
    toast("Your opponent offered a draw", {
      id: DRAW_TOAST_ID,
      duration: Infinity,
      action: { label: "Accept", onClick: () => respond(true) },
      cancel: { label: "Decline", onClick: () => respond(false) },
    });
  }, [respond]);

  const offerDraw = useCallback(() => {
    if (!sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.DRAW_OFFER }))) {
      toast.error(NOT_CONNECTED);
      return;
    }
    setOfferSent(true);
    setOpponentDeclined(false);
  }, [sendMessage]);

  const handleDrawOffer = useCallback(() => {
    setIncomingOffer(true);
    setOpponentDeclined(false);
    showOfferToast();
  }, [showOfferToast]);

  // Only the player who offered receives a decline
  const handleDrawResponse = useCallback((data: DrawResponseMessage) => {
    setOfferSent(false);
    setOpponentDeclined(!data.accepted);
    if (!data.accepted) setDeclinedSinceMyMove(true);
  }, []);

  // The server refused our offer: the opponent declined one since our last move
  const handleError = useCallback(({ data }: GameErrorMessage) => {
    if (data.code !== "DRAW_DECLINED") return;
    setOfferSent(false);
    setDeclinedSinceMyMove(true);
  }, []);

  // My move declines the opponent's offer; the opponent's move declines mine
  const handleMove = useCallback(
    (data: MoveMessage) => {
      if (data.userId === id) {
        setIncomingOffer(false);
        setDeclinedSinceMyMove(false);
        toast.dismiss(DRAW_TOAST_ID);
      } else {
        setOfferSent(false);
        setOpponentDeclined(false);
      }
    },
    [id]
  );

  // The server drops a pending draw offer when moves are taken back
  const handleTakeback = useCallback(() => {
    setIncomingOffer(false);
    setOfferSent(false);
    setOpponentDeclined(false);
    toast.dismiss(DRAW_TOAST_ID);
  }, []);

  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      const incoming =
        !data.isFinished && data.drawOfferedBy !== null && data.drawOfferedBy !== id;
      setIncomingOffer(incoming);
      setOfferSent(!data.isFinished && data.drawOfferedBy === id);
      if (incoming) showOfferToast();
      else toast.dismiss(DRAW_TOAST_ID);
    },
    [id, showOfferToast]
  );

  useMessageDispatcher<DrawOfferMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.DRAW_OFFER,
    handleDrawOffer
  );
  useMessageDispatcher<DrawResponseMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.DRAW_RESPONSE,
    handleDrawResponse
  );
  useMessageDispatcher<GameErrorMessage>(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);
  useMessageDispatcher<MoveMessage>(gameMessages, GAME_MESSAGE_TYPES.MOVE, handleMove);
  useMessageDispatcher<TakebackMessage>(gameMessages, GAME_MESSAGE_TYPES.TAKEBACK, handleTakeback);
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );

  // The offer dies with the game, and with the page
  useEffect(() => {
    if (gameEnded) toast.dismiss(DRAW_TOAST_ID);
  }, [gameEnded]);
  useEffect(() => () => void toast.dismiss(DRAW_TOAST_ID), []);

  return {
    showDrawOffer: !gameEnded && incomingOffer,
    drawOfferSent: !gameEnded && offerSent,
    canOfferDraw: !declinedSinceMyMove,
    showOpponentDeclined: !gameEnded && opponentDeclined,
    offerDraw,
    acceptDraw: () => respond(true),
    declineDraw: () => respond(false),
  };
};
