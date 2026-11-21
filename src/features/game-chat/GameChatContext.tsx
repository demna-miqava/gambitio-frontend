import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLiveGame } from "@/features/current-game/contexts/LiveGameContext";
import { useSettings } from "@/features/settings/SettingsContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import type {
  ChatEventMessage,
  ChatStatusMessage,
  GameErrorMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import type { ChatMessage, ChatOffReason, ChatState } from "./types";
import { appendMessage, countUnread, isChatShown } from "./utils/chat";

interface GameChatValue {
  /**
   * The page shows a chat (see isChatShown): not for spectators, and not for
   * a player whose own setting turned chat off. When the opponent turned it
   * off it is shown, saying so.
   */
  available: boolean;
  /** A message could be sent right now */
  canSend: boolean;
  /** Why nothing can be written, when it isn't just the connection */
  offReason: ChatOffReason | null;
  messages: ChatMessage[];
  /** The opponent's messages the player hasn't seen */
  unread: number;
  /** The opponent's messages are hidden on this device for this game */
  muted: boolean;
  setMuted: (muted: boolean) => void;
  /** Sends a message. False if it couldn't be sent (not connected). */
  send: (text: string) => boolean;
  /** The server's answer to the last message it refused */
  error: string | null;
  clearError: () => void;
  /** The text of a refused message, to put back in the box (a new object each time) */
  rejected: { text: string } | null;
  /** Call with true while the conversation is on screen; returns the undo */
  showing: () => () => void;
}

const GameChatContext = createContext<GameChatValue | null>(null);

const storageKey = (kind: "read" | "muted", gameId: number) => `gambitio:chat:${kind}:${gameId}`;
const readStored = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStored = (key: string, value: string | null) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Private mode or storage full: the state just won't survive a reload
  }
};

/**
 * Chat between the two players of the live game on this page. Lives inside
 * LiveGameProvider and uses its socket; one instance per game page, so the
 * unread count in the toolbar and the conversation itself agree.
 */
export const GameChatProvider = ({ children }: { children: ReactNode }) => {
  const { game, sendMessage, isConnected, opponent, announce, spectating } = useLiveGame();
  const { settings } = useSettings();
  const { id: viewerId } = useUser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // null until the server says whether this game has chat for us
  const [status, setStatus] = useState<{ enabled: boolean; reason: ChatOffReason | null } | null>(null);
  // The chat could be written in at some point of this visit
  const [wasOpen, setWasOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<{ text: string } | null>(null);
  const [muted, setMutedState] = useState(() => readStored(storageKey("muted", game.id)) === "1");
  const [lastReadId, setLastReadId] = useState(() => readStored(storageKey("read", game.id)));
  // How many places show the conversation right now (the panel, the sheet)
  const [viewers, setViewers] = useState(0);
  const lastSentRef = useRef("");
  // The last message screen readers were told about, or the last one of the
  // history that came with the state ("" when there was none). Null until
  // the state arrives.
  const announcedRef = useRef<string | null>(null);

  const applyState = useCallback((chat: ChatState) => {
    setStatus({ enabled: chat.enabled, reason: chat.reason });
    setMessages(chat.messages);
    announcedRef.current = chat.messages[chat.messages.length - 1]?.id ?? "";
    if (chat.enabled) setWasOpen(true);
  }, []);

  const handleInitialState = useCallback(
    (message: InitialGameStateMessage) => {
      const chat = message.data.chat;
      if (chat) applyState(chat);
      else setStatus(null);
    },
    [applyState]
  );
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.INITIAL_GAME_STATE, handleInitialState);

  // A player changed who they chat with while the game is on. The one who
  // didn't is told: it is their chat that just went away (or came back).
  const reasonRef = useRef<ChatOffReason | null>(null);
  reasonRef.current = status?.enabled ? null : (status?.reason ?? null);
  const handleStatus = useCallback(
    (message: ChatStatusMessage) => {
      const before = reasonRef.current;
      const { enabled, reason } = message.data;
      applyState(message.data);
      setError(null);
      if (!enabled && reason === "off_by_opponent" && before !== "off_by_opponent") {
        toast.info(`${opponent.username} turned chat off`, { id: "chat_status" });
        announce(`${opponent.username} turned chat off`);
      } else if (enabled && before === "off_by_opponent") {
        toast.info(`${opponent.username} turned chat on`, { id: "chat_status" });
        announce(`${opponent.username} turned chat on`);
      }
    },
    [applyState, announce, opponent.username]
  );
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.CHAT_STATUS, handleStatus);

  const handleChat = useCallback(
    (message: ChatEventMessage) => {
      setMessages((current) => appendMessage(current, message.data));
      if (message.data.userId === viewerId) {
        // Our message went through
        setError(null);
        setRejected(null);
      }
    },
    [viewerId]
  );
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.CHAT, handleChat);

  const ownSetting = settings?.gameChatAllowedFrom;
  const handleError = useCallback(
    (message: GameErrorMessage) => {
      const { code, request, message: text } = message.data;
      if (request?.type !== GAME_MESSAGE_TYPES.CHAT) return;
      setError(code === "RATE_LIMITED" ? "You're sending messages too fast. Wait a moment." : text);
      setRejected({ text: request.text ?? lastSentRef.current });
      if (code === "CHAT_CLOSED") setStatus({ enabled: false, reason: "closed" });
      if (code === "CHAT_DISABLED") {
        setStatus({ enabled: false, reason: ownSetting === "nobody" ? "off_by_you" : "off_by_opponent" });
      }
    },
    [ownSetting]
  );
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      lastSentRef.current = trimmed;
      const sent = sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.CHAT, text: trimmed }));
      setError(sent ? null : "Not connected. Your message wasn't sent.");
      // A refused message was put back in the box once; a box opened later
      // mustn't fill with it again
      if (sent) setRejected(null);
      return sent;
    },
    [sendMessage]
  );

  const setMuted = useCallback(
    (next: boolean) => {
      setMutedState(next);
      writeStored(storageKey("muted", game.id), next ? "1" : null);
    },
    [game.id]
  );

  const showing = useCallback(() => {
    setViewers((n) => n + 1);
    return () => setViewers((n) => n - 1);
  }, []);

  // While the conversation is on screen, everything in it has been seen
  const latestId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (viewers === 0 || latestId === null || latestId === lastReadId) return;
    setLastReadId(latestId);
    writeStored(storageKey("read", game.id), latestId);
  }, [viewers, latestId, lastReadId, game.id]);

  const unread = muted || viewers > 0 ? 0 : countUnread(messages, viewerId, lastReadId);

  // Tell screen reader users about a message they can't see arrive. Not
  // for the history that came with the state (see applyState), our own, or
  // what's on screen.
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || latest.id === announcedRef.current) return;
    announcedRef.current = latest.id;
    if (latest.userId === viewerId || muted || viewers > 0) return;
    announce(`${opponent.username} sent a chat message`);
  }, [messages, viewerId, muted, viewers, announce, opponent.username]);

  const value = useMemo<GameChatValue>(
    () => ({
      available: !spectating && isChatShown(status, messages.length, wasOpen),
      canSend: Boolean(status?.enabled) && isConnected,
      offReason: status?.enabled ? null : (status?.reason ?? null),
      messages,
      unread,
      muted,
      setMuted,
      send,
      error,
      clearError: () => setError(null),
      rejected,
      showing,
    }),
    [wasOpen, spectating, status, isConnected, messages, unread, muted, setMuted, send, error, rejected, showing]
  );

  return <GameChatContext.Provider value={value}>{children}</GameChatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGameChat = () => {
  const context = useContext(GameChatContext);
  if (!context) throw new Error("useGameChat must be used within GameChatProvider");
  return context;
};
