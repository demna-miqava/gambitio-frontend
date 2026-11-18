import { createContext, useContext } from "react";
import type { StudyChatState } from "../types";

export interface StudyChatContextValue {
  /** Null: this member has no chat in this room (no panel at all) */
  chat: StudyChatState | null;
  /** Why the last message was refused */
  error: string | null;
  send: (text: string) => void;
}

/**
 * The room chat, for the chat panel only: provided by the room page around
 * the (memoised) room view, so a new message re-renders the panel and not
 * the board, the engine or the moves.
 */
export const StudyChatContext = createContext<StudyChatContextValue | null>(null);

export const useStudyChat = (): StudyChatContextValue | null => useContext(StudyChatContext);
