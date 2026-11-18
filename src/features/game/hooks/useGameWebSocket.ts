import { useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { BOARD_CONFIG } from "../constants/board-config";
import { useParams } from "react-router-dom";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "../utils/websocket-helpers";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { RECONNECT_OPTIONS } from "@/constants/websocket";
import { parsePositiveId } from "@/utils/ids";
import type { GameWebSocketMessage } from "../types/websocket-messages";

/**
 * connecting: first connection not open yet
 * open: connected
 * reconnecting: was open, dropped, retrying
 * lost: gave up retrying; only a reload helps
 */
export type GameConnectionStatus = "connecting" | "open" | "reconnecting" | "lost";

/**
 * Hook to manage WebSocket connection for a live chess game.
 * Every message is dispatched as it arrives (onMessage), so two messages that
 * land in the same render, like a move followed by game_ended, are both handled.
 * On reconnect the server sends initial_game_state again, which resyncs the board.
 *
 * IMPORTANT: This hook should only be called ONCE per game (in LiveGameContext)
 * to avoid duplicate connections. Other components should get sendMessage
 * from useLiveGame() context instead of calling this hook directly.
 */
export const useGameWebSocket = () => {
  const { gameId } = useParams();
  const [hasConnected, setHasConnected] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  // Only a plain numeric id goes in the socket path (params are decoded)
  const validId = parsePositiveId(gameId);
  const baseUrl = validId !== null ? `${BOARD_CONFIG.WEBSOCKET_BASE_URL}/game/${validId}` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, true);

  const { sendMessage, readyState, getWebSocket } = useWebSocket(getUrl, {
    ...RECONNECT_OPTIONS,
    protocols,
    onOpen: () => {
      setHasConnected(true);
      setGaveUp(false);
    },
    onReconnectStop: () => setGaveUp(true),
    onMessage: (event) => {
      const data = parseWebSocketMessage<GameWebSocketMessage>(event);
      if (data) gameMessages.dispatch(data);
    },
  });

  useSocketReauth(sendMessage, readyState);

  const status: GameConnectionStatus =
    readyState === ReadyState.OPEN
      ? "open"
      : gaveUp
        ? "lost"
        : hasConnected
          ? "reconnecting"
          : "connecting";

  return { sendMessage, readyState, status, getWebSocket };
};
