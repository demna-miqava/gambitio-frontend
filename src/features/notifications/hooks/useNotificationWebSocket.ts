import useWebSocket from "react-use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import {
  QKEY_ACTIVE_GAME,
  QKEY_CHALLENGES,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_USER_FRIENDS,
} from "@/constants/queryKeys";
import { WS_BASE_URL } from "@/constants/apiConfig";
import { useUser } from "@/hooks/useUser";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { RECONNECT_OPTIONS } from "@/constants/websocket";
import type { NotificationWebSocketMessage } from "../types/websocket-messages";

/**
 * Hook for managing the notifications WebSocket connection.
 * Only connects when user is authenticated and has a chess profile.
 * Dispatches every incoming message to notificationMessages subscribers.
 *
 * @returns WebSocket connection state and methods
 */
export const useNotificationWebSocket = () => {
  const { id, isAuthenticated, hasProfile } = useUser();
  const queryClient = useQueryClient();

  const baseUrl = isAuthenticated && id && hasProfile ? `${WS_BASE_URL}/notifications` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, true);

  const { sendMessage, readyState } = useWebSocket(getUrl, {
    ...RECONNECT_OPTIONS,
    protocols,
    // Challenges, games and friend requests may have changed while we were offline
    onOpen: () => {
      queryClient.invalidateQueries({ queryKey: [QKEY_CHALLENGES] });
      queryClient.invalidateQueries({ queryKey: [QKEY_ACTIVE_GAME] });
      queryClient.invalidateQueries({ queryKey: [QKEY_PENDING_FRIEND_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QKEY_USER_FRIENDS] });
    },
    onMessage: (event) => {
      const message = parseWebSocketMessage<NotificationWebSocketMessage>(event);
      if (message) notificationMessages.dispatch(message);
    },
  });

  useSocketReauth(sendMessage, readyState);

  return {
    sendMessage,
    readyState,
  };
};
