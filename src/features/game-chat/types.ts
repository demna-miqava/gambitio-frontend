/** One chat message, as the server sends it */
export interface ChatMessage {
  /** Opaque, and growing: a later message has a greater id */
  id: string;
  userId: number;
  text: string;
  /** When it was written, in ms since the epoch */
  at: number;
}

/**
 * Why a game has no chat for this player:
 * - off_by_you / off_by_opponent: one of the two turned chat off in settings
 * - blocked: the player blocked this opponent (being blocked reads as off_by_opponent)
 * - closed: the game ended a while ago
 */
export type ChatOffReason = "off_by_you" | "off_by_opponent" | "blocked" | "closed";

/** Sent with the game state to the two players (never to spectators) */
export interface ChatState {
  enabled: boolean;
  reason: ChatOffReason | null;
  messages: ChatMessage[];
}
