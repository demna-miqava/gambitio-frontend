import type { ChatMessage } from "@/features/game-chat/types";

/** One spectator chat message, as the server sends it: who wrote it is named */
export interface SpectatorChatMessage extends ChatMessage {
  /** The writer's name when they wrote it */
  username: string;
}

/** Sent with the game state to everyone but the two players */
export interface SpectatorChatState {
  /** False once writing has closed (a while after the game) */
  enabled: boolean;
  reason: "closed" | null;
  messages: SpectatorChatMessage[];
  /** When writing closes, once the game has ended (ms since the epoch) */
  closesAt: number | null;
}
