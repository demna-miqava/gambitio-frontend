import type { ChatMessage, ChatOffReason } from "../types";

/** Longest message, in characters. The server enforces it; see chatText.ts in the backend. */
export const CHAT_MAX_LENGTH = 200;
/** The counter appears once this few characters are left */
export const CHAT_COUNTER_FROM = 30;

/** Characters as the server counts them: an emoji is one, not two */
export const chatLength = (text: string): number => [...text].length;

/** Whether message id `a` was written after `b` (ids are growing whole numbers, as strings) */
export const isLaterId = (a: string, b: string): boolean =>
  a.length !== b.length ? a.length > b.length : a > b;

/** Adds a message unless it's already there (the server may repeat one on reconnect). */
export const appendMessage = (messages: ChatMessage[], message: ChatMessage): ChatMessage[] =>
  messages.some((m) => m.id === message.id) ? messages : [...messages, message];

/** The opponent's messages written after the last one the player has seen */
export const countUnread = (
  messages: ChatMessage[],
  viewerId: number | undefined,
  lastReadId: string | null
): number =>
  messages.filter(
    (m) => m.userId !== viewerId && (lastReadId === null || isLaterId(m.id, lastReadId))
  ).length;

/**
 * Whether the page shows a chat at all.
 * - Turned off by the player's own setting: no. They asked not to have one.
 * - Turned off by the opponent, or by the player blocking them: yes, so the
 *   player can see that it is off, and why.
 * - Closed after the game: only if there is something to read, or the chat
 *   was open during this visit (it shouldn't vanish while being looked at).
 */
export const isChatShown = (
  status: { enabled: boolean; reason: ChatOffReason | null } | null,
  messageCount: number,
  wasOpen: boolean
): boolean => {
  if (!status) return false;
  if (status.enabled) return true;
  if (status.reason === "off_by_you") return false;
  if (status.reason === "off_by_opponent" || status.reason === "blocked") return true;
  return messageCount > 0 || wasOpen;
};

export const OFF_REASON_TEXT: Record<ChatOffReason, string> = {
  off_by_you: "Chat is turned off in your settings.",
  off_by_opponent: "Your opponent has chat turned off.",
  blocked: "You've blocked this player, so there's no chat.",
  closed: "This chat has closed.",
};

/** One-tap messages offered while the conversation is empty */
export const quickReplies = (gameEnded: boolean): string[] =>
  gameEnded ? ["Good game!", "Thanks!", "Well played!"] : ["Hello!", "Good luck!", "Have fun!"];

/** "14:05", in the reader's own time format */
export const formatMessageTime = (at: number): string =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
