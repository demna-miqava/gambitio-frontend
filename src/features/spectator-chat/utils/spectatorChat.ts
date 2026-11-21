import type { SpectatorChatMessage } from "../types";

/** Messages kept on screen; older ones drop off the top */
export const MAX_SHOWN_MESSAGES = 200;
/** How long after the game spectators can still write (the server's CHAT_OPEN_AFTER_END_MS) */
export const OPEN_AFTER_END_MS = 10 * 60_000;

/** Adds a message unless it's already there (a repeat after a reconnect), keeping the latest MAX_SHOWN_MESSAGES */
export const addMessage = (
  messages: SpectatorChatMessage[],
  message: SpectatorChatMessage
): SpectatorChatMessage[] => {
  if (messages.some((m) => m.id === message.id)) return messages;
  const next = [...messages, message];
  return next.length > MAX_SHOWN_MESSAGES ? next.slice(next.length - MAX_SHOWN_MESSAGES) : next;
};

/**
 * The messages on screen after a sync (on connect, and on every reconnect):
 * the server's latest ones, with what was already here from before them
 * kept above, and anything that arrived after them below. A sync alone
 * would cut a busy chat back to the server's last page.
 */
export const mergeHistory = (
  messages: SpectatorChatMessage[],
  history: SpectatorChatMessage[]
): SpectatorChatMessage[] => {
  const first = history[0];
  const last = history.at(-1);
  if (!first || !last) return messages;
  if (messages.length === 0) return history;
  const known = new Set(history.map((m) => m.id));
  const rest = messages.filter((m) => !known.has(m.id));
  const next = [...rest.filter((m) => m.at < first.at), ...history, ...rest.filter((m) => m.at > last.at)];
  return next.length > MAX_SHOWN_MESSAGES ? next.slice(next.length - MAX_SHOWN_MESSAGES) : next;
};

/** Without the messages of players the viewer has blocked (the server stops sending new ones) */
export const withoutBlocked = (messages: SpectatorChatMessage[], blocked: ReadonlySet<number>) =>
  blocked.size === 0 ? messages : messages.filter((m) => !blocked.has(m.userId));

/** The message the server sent back for a refused message, in the page's words */
export const refusalText = (code: string | undefined, fallback: string): string => {
  switch (code) {
    case "CHAT_RATE_LIMITED":
    case "RATE_LIMITED":
      return "You're sending messages too fast. Wait a moment.";
    case "CHAT_CLOSED":
      return "This chat has closed.";
    case "CHAT_LIMIT_REACHED":
      return "You've written as many messages as one game allows.";
    default:
      return fallback;
  }
};
