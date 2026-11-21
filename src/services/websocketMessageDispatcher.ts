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

  /**
   * Every subscriber gets the message, even when one of them throws: its
   * error is rethrown afterwards, on its own, so it still shows up as an
   * uncaught error.
   */
  dispatch(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    }
  }
}

/** Messages from the live game socket */
export const gameMessages = new WebSocketMessageDispatcher();

/** Messages from the notifications socket */
export const notificationMessages = new WebSocketMessageDispatcher();
