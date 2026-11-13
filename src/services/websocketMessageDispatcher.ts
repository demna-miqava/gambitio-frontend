export type WebSocketMessage = { type: string; [key: string]: unknown };

type MessageHandler<T extends WebSocketMessage = WebSocketMessage> = (
  message: T
) => void;

/**
 * Pub/sub for one WebSocket connection's messages. Each socket gets its own
 * instance so message types that exist on several sockets (e.g. "error",
 * "match_found") only reach the subscribers of the socket they came from.
 */
export class WebSocketMessageDispatcher {
  private handlers = new Map<string, Set<MessageHandler>>();

  subscribe<T extends WebSocketMessage>(
    messageType: string,
    handler: MessageHandler<T>
  ) {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set());
    }
    this.handlers.get(messageType)!.add(handler as MessageHandler);

    return () => {
      const handlers = this.handlers.get(messageType);
      if (handlers) {
        handlers.delete(handler as MessageHandler);
        if (handlers.size === 0) {
          this.handlers.delete(messageType);
        }
      }
    };
  }

  dispatch(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }
}

/** Messages from the live game socket */
export const gameMessages = new WebSocketMessageDispatcher();

/** Messages from the notifications socket */
export const notificationMessages = new WebSocketMessageDispatcher();
