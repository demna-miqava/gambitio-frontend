import { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import { WS_BASE_URL } from "@/constants/apiConfig";
import { useUser } from "@/hooks/useUser";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATIONS_RECONNECT_OPTIONS, ON_MESSAGE_ONLY } from "@/constants/websocket";
import type { NotificationWebSocketMessage } from "../types/websocket-messages";
import { mayBeStaleAfterReconnect, RECONNECT_REFRESH_SPREAD_MS } from "../utils/reconnectRefresh";

/**
 * Hook for managing the notifications WebSocket connection.
 * Only connects when user is authenticated and has a chess profile.
 * Dispatches every incoming message to notificationMessages subscribers.
 *
 * It never gives up (challenges, friend requests and game starts arrive
 * here): retries back off to ~30s, and coming back online or to the tab
 * reconnects at once with the backoff reset.
 *
 * @returns WebSocket connection state and methods
 */
export const useNotificationWebSocket = () => {
  const { id, isAuthenticated, hasProfile } = useUser();
  const queryClient = useQueryClient();

  const baseUrl = isAuthenticated && id && hasProfile ? `${WS_BASE_URL}/notifications` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, true);

  // Turned off for one render to reconnect now: react-use-websocket then
  // drops the pending retry and resets its attempt count (so the backoff)
  const [connect, setConnect] = useState(true);
  useEffect(() => {
    if (!connect) setConnect(true);
  }, [connect]);

  const hasOpened = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const { sendMessage, readyState } = useWebSocket(
    getUrl,
    {
      ...NOTIFICATIONS_RECONNECT_OPTIONS,
      ...ON_MESSAGE_ONLY,
      protocols,
      // Challenges, games and friend requests may have changed while we were
      // offline. Only those lists, only the ones on screen (inactive ones are
      // just marked stale), and without restarting a fetch already under way
      onOpen: () => {
        const reconnect = hasOpened.current;
        hasOpened.current = true;
        const refresh = () =>
          void queryClient.invalidateQueries(
            { predicate: ({ queryKey }) => mayBeStaleAfterReconnect(queryKey, id) },
            { cancelRefetch: false }
          );
        clearTimeout(refreshTimer.current);
        // After a redeploy every client reconnects within seconds of each
        // other: spread their refetches too. The first connect right after
        // the page loads has no such crowd behind it.
        if (reconnect) {
          refreshTimer.current = setTimeout(refresh, Math.random() * RECONNECT_REFRESH_SPREAD_MS);
        } else {
          refresh();
        }
      },
      onMessage: (event) => {
        const message = parseWebSocketMessage<NotificationWebSocketMessage>(event);
        if (message) notificationMessages.dispatch(message);
      },
    },
    connect
  );

  // Back online, or back to the tab, with the socket down (maybe waiting
  // out a long backoff): try again now
  const readyStateRef = useRef(readyState);
  readyStateRef.current = readyState;
  const enabled = getUrl !== null;
  useEffect(() => {
    if (!enabled) return;
    const reconnectNow = () => {
      if (readyStateRef.current === ReadyState.CLOSED) setConnect(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") reconnectNow();
    };
    window.addEventListener("online", reconnectNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("online", reconnectNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  useSocketReauth(sendMessage, readyState);

  return {
    sendMessage,
    readyState,
  };
};
