import { useCallback, useEffect, useReducer, useRef } from "react";
import { toast } from "sonner";
import type {
  GameErrorMessage,
  InitialGameStateMessage,
  MoveMessage,
  TakebackMessage,
  TakebackRequestMessage,
  TakebackResponseMessage,
} from "@/features/game/types/websocket-messages";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import { useLiveGame } from "../contexts/LiveGameContext";
import {
  INITIAL_TAKEBACK_STATE,
  canRequestTakeback,
  takebackReducer,
  takebackRequestText,
} from "../utils/takeback";

const TAKEBACK_TOAST_ID = "takeback_request";
const NOT_CONNECTED = "Not connected. Try again when you're back online.";

/**
 * Takeback requests both ways, like draw offers (useDrawOffer). An incoming
 * request shows as a toast with Accept/Decline and in the side panel. An
 * outgoing one stays "requested" until the opponent answers or anyone moves
 * (a move drops it on the server). After a decline this player can't ask
 * again until a move is made. The board itself is rolled back by
 * useLiveGameMessages when a takeback message arrives.
 */
export const useTakeback = () => {
  const { id } = useUser();
  const { game, gameEnded, sendMessage } = useLiveGame();
  const { getMoves, color, ply } = useChessBoardContext();
  const [state, dispatch] = useReducer(takebackReducer, INITIAL_TAKEBACK_STATE);
  // For the takeback handler: whether this player was the one who asked
  const sentRef = useRef(false);
  const sent = state.sentAtPly !== null;
  useEffect(() => {
    sentRef.current = sent;
  }, [sent]);

  const currentPly = useCallback(() => getMoves().length, [getMoves]);

  const respond = useCallback(
    (accepted: boolean) => {
      toast.dismiss(TAKEBACK_TOAST_ID);
      const delivered = sendMessage(
        JSON.stringify({ type: GAME_MESSAGE_TYPES.TAKEBACK_RESPONSE, accepted })
      );
      if (!delivered) {
        toast.error(NOT_CONNECTED);
        return;
      }
      dispatch({ type: "answered" });
    },
    [sendMessage]
  );

  // `ply`: the position the request is for (the board may still be catching up)
  const showRequestToast = useCallback((ply: number) => {
    toast(takebackRequestText(ply, color), {
      id: TAKEBACK_TOAST_ID,
      duration: Infinity,
      action: { label: "Accept", onClick: () => respond(true) },
      cancel: { label: "Decline", onClick: () => respond(false) },
    });
  }, [respond, color]);

  const requestTakeback = useCallback(() => {
    if (!sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.TAKEBACK_REQUEST }))) {
      toast.error(NOT_CONNECTED);
      return;
    }
    dispatch({ type: "sent", ply: currentPly() });
  }, [sendMessage, currentPly]);

  const handleRequest = useCallback(() => {
    dispatch({ type: "incoming" });
    showRequestToast(currentPly());
  }, [showRequestToast, currentPly]);

  // Only the player who asked receives a decline (an accept is a takeback)
  const handleResponse = useCallback(
    (data: TakebackResponseMessage) => {
      if (!data.accepted) dispatch({ type: "declined", ply: currentPly() });
    },
    [currentPly]
  );

  const handleTakeback = useCallback(() => {
    toast.dismiss(TAKEBACK_TOAST_ID);
    if (sentRef.current) toast.success("The takeback was accepted", { id: "takeback_done" });
    dispatch({ type: "takeback" });
  }, []);

  // Any move drops a pending request, whoever made it
  const handleMove = useCallback(
    (data: MoveMessage) => {
      toast.dismiss(TAKEBACK_TOAST_ID);
      dispatch({ type: "move", own: data.userId === id, moveNumber: data.moveNumber });
    },
    [id]
  );

  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      const requestedBy = data.takebackRequestedBy ?? null;
      const incoming = !data.isFinished && requestedBy !== null && requestedBy !== id;
      dispatch({
        type: "state",
        requestedBy,
        me: id,
        finished: data.isFinished,
        ply: data.numMoves,
      });
      if (incoming) showRequestToast(data.numMoves);
      else toast.dismiss(TAKEBACK_TOAST_ID);
    },
    [id, showRequestToast]
  );

  // useLiveGameMessages shows the error itself; this only resets the buttons
  const handleError = useCallback(
    ({ data }: GameErrorMessage) => {
      const type = data.request?.type;
      if (type === GAME_MESSAGE_TYPES.TAKEBACK_REQUEST) {
        dispatch({ type: "request_failed", code: data.code, ply: currentPly() });
      } else if (type === GAME_MESSAGE_TYPES.TAKEBACK_RESPONSE) {
        toast.dismiss(TAKEBACK_TOAST_ID);
        dispatch({ type: "answer_failed" });
      }
    },
    [currentPly]
  );

  useMessageDispatcher<TakebackRequestMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.TAKEBACK_REQUEST,
    handleRequest
  );
  useMessageDispatcher<TakebackResponseMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.TAKEBACK_RESPONSE,
    handleResponse
  );
  useMessageDispatcher<TakebackMessage>(gameMessages, GAME_MESSAGE_TYPES.TAKEBACK, handleTakeback);
  useMessageDispatcher<MoveMessage>(gameMessages, GAME_MESSAGE_TYPES.MOVE, handleMove);
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );
  useMessageDispatcher<GameErrorMessage>(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);

  // The request dies with the game, and with the page
  useEffect(() => {
    if (gameEnded) toast.dismiss(TAKEBACK_TOAST_ID);
  }, [gameEnded]);
  useEffect(() => () => void toast.dismiss(TAKEBACK_TOAST_ID), []);

  const declined = state.declinedAtPly === ply;
  return {
    showTakebackRequest: !gameEnded && state.incoming,
    /** The side panel's prompt for the opponent's request (the toast says the same) */
    takebackRequestMessage: takebackRequestText(ply, color),
    takebackRequested: !gameEnded && sent,
    showTakebackDeclined: !gameEnded && declined,
    /**
     * The server would take the request: this player has a move to take
     * back, no request is pending either way, and none was just declined
     */
    canRequestTakeback:
      !gameEnded && !sent && !state.incoming && !declined && canRequestTakeback(ply, color, game.startPly ?? 0),
    requestTakeback,
    acceptTakeback: () => respond(true),
    declineTakeback: () => respond(false),
  };
};
