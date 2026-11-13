import { useEffect } from "react";
import type {
  WebSocketMessage,
  WebSocketMessageDispatcher,
} from "@/services/websocketMessageDispatcher";

/**
 * Subscribes to one message type on a socket's dispatcher.
 * Automatically handles cleanup on unmount and re-subscribes when handler changes.
 *
 * @param dispatcher - The socket's dispatcher (gameMessages, notificationMessages)
 * @param messageType - The type of message to subscribe to
 * @param handler - Callback function to handle the message (should be memoized with useCallback)
 *
 * @example
 * ```tsx
 * const handleMove = useCallback((message: MoveMessage) => {
 *   console.log('Move received:', message.move);
 * }, [dependencies]);
 *
 * useMessageDispatcher(gameMessages, 'move', handleMove);
 * ```
 */
export const useMessageDispatcher = <T extends WebSocketMessage>(
  dispatcher: WebSocketMessageDispatcher,
  messageType: string,
  handler: (message: T) => void
) => {
  useEffect(() => {
    const unsubscribe = dispatcher.subscribe<T>(messageType, handler);
    return unsubscribe;
  }, [dispatcher, messageType, handler]);
};
