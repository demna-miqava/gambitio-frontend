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
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import type {
  GameErrorMessage,
  InitialGameStateMessage,
  SpectatorChatEventMessage,
} from "@/features/game/types/websocket-messages";
import { useBlockedUsers } from "@/features/moderation/hooks/useBlocks";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { userStore } from "@/utils/userStorage";
import type { SpectatorChatMessage } from "./types";
import { OPEN_AFTER_END_MS, addMessage, mergeHistory, refusalText, withoutBlocked } from "./utils/spectatorChat";

interface SpectatorChatValue {
  /** The server sent a spectator chat for this game (never to its players) */
  available: boolean;
  /** Hidden by the viewer (remembered for every game, on this device) */
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  /** Writing is open (closes a while after the game) */
  open: boolean;
  canSend: boolean;
  messages: SpectatorChatMessage[];
  /** Others' messages that arrived while the chat wasn't on screen */
  unread: number;
  send: (text: string) => boolean;
  error: string | null;
  clearError: () => void;
  /** The text of a refused message, to put back in the box (a new object each time) */
  rejected: { text: string } | null;
  /** Call while the conversation is on screen; returns the undo */
  showing: () => () => void;
}

const SpectatorChatContext = createContext<SpectatorChatValue | null>(null);

const prefs = userStore("spectator-chat", { maxEntries: 1 });
const HIDDEN_KEY = "hidden";

/**
 * The spectators' chat of the game on this page. Lives inside
 * LiveGameProvider (spectating) and uses its socket. The server decides who
 * gets it: the state carries it only for people who aren't playing, and new
 * messages arrive only on their sockets.
 */
export const SpectatorChatProvider = ({ children }: { children: ReactNode }) => {
  const { sendMessage, isConnected, gameEnded, announce } = useLiveGame();
  const { data: blockedUsers } = useBlockedUsers();
  const [received, setReceived] = useState<SpectatorChatMessage[]>([]);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [closesAt, setClosesAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<{ text: string } | null>(null);
  const [hidden, setHiddenState] = useState(() => prefs.get(HIDDEN_KEY) === "1");
  const [viewers, setViewers] = useState(0);
  const [seenId, setSeenId] = useState<string | null>(null);
  const lastSentRef = useRef("");

  const handleInitialState = useCallback(({ data }: InitialGameStateMessage) => {
    const chat = data.spectatorChat;
    // Never taken away again: who is a spectator doesn't change, and a sync
    // whose chat couldn't be read shouldn't close the panel
    if (!chat) return;
    setAvailable(true);
    // Added to what is here: a reconnect brings only the latest messages
    setReceived((current) => mergeHistory(current, chat.messages));
    setEnabled(chat.enabled);
    setClosesAt(chat.closesAt);
    // The history isn't news
    setSeenId(chat.messages.at(-1)?.id ?? null);
  }, []);
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.INITIAL_GAME_STATE, handleInitialState);

  const handleMessage = useCallback(({ data }: SpectatorChatEventMessage) => {
    setReceived((current) => addMessage(current, data));
    setError(null);
  }, []);
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.SPECTATOR_CHAT, handleMessage);

  const handleError = useCallback(({ data }: GameErrorMessage) => {
    if (data.request?.type !== GAME_MESSAGE_TYPES.SPECTATOR_CHAT) return;
    setError(refusalText(data.code, data.message));
    setRejected({ text: data.request.text ?? lastSentRef.current });
    if (data.code === "CHAT_CLOSED") setEnabled(false);
  }, []);
  useMessageDispatcher(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);

  // Writing closes OPEN_AFTER_END_MS after the game ends (the server checks
  // too; this only greys the box out on time)
  useEffect(() => {
    if (gameEnded && closesAt === null) setClosesAt(Date.now() + OPEN_AFTER_END_MS);
  }, [gameEnded, closesAt]);
  useEffect(() => {
    if (closesAt === null || !enabled) return;
    const timer = setTimeout(() => setEnabled(false), Math.max(0, closesAt - Date.now()));
    return () => clearTimeout(timer);
  }, [closesAt, enabled]);

  const blocked = useMemo(() => new Set((blockedUsers ?? []).map((u) => u.id)), [blockedUsers]);
  const messages = useMemo(() => withoutBlocked(received, blocked), [received, blocked]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      lastSentRef.current = trimmed;
      const sent = sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.SPECTATOR_CHAT, text: trimmed }));
      setError(sent ? null : "Not connected. Your message wasn't sent.");
      if (sent) setRejected(null);
      return sent;
    },
    [sendMessage]
  );

  const setHidden = useCallback((next: boolean) => {
    setHiddenState(next);
    if (next) prefs.set(HIDDEN_KEY, "1");
    else prefs.remove(HIDDEN_KEY);
  }, []);

  const showing = useCallback(() => {
    setViewers((n) => n + 1);
    return () => setViewers((n) => n - 1);
  }, []);

  const latestId = messages.at(-1)?.id ?? null;
  useEffect(() => {
    if (viewers > 0 && latestId !== null && latestId !== seenId) setSeenId(latestId);
  }, [viewers, latestId, seenId]);
  const seenIndex = seenId === null ? -1 : messages.findIndex((m) => m.id === seenId);
  const unread = viewers > 0 || hidden ? 0 : messages.length - 1 - seenIndex;

  // Screen readers hear once that messages started coming while the chat is
  // out of sight (not every one: a busy chat would drown out the game)
  const announcedRef = useRef<string | null>(null);
  useEffect(() => {
    if (unread === 1 && latestId !== null && announcedRef.current !== latestId) {
      announcedRef.current = latestId;
      announce("New message in the spectator chat");
    }
  }, [unread, latestId, announce]);

  const value = useMemo<SpectatorChatValue>(
    () => ({
      available,
      hidden,
      setHidden,
      open: enabled,
      canSend: enabled && isConnected,
      messages,
      unread: Math.max(0, unread),
      send,
      error,
      clearError: () => setError(null),
      rejected,
      showing,
    }),
    [available, hidden, setHidden, enabled, isConnected, messages, unread, send, error, rejected, showing]
  );

  return <SpectatorChatContext.Provider value={value}>{children}</SpectatorChatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSpectatorChat = () => {
  const context = useContext(SpectatorChatContext);
  if (!context) throw new Error("useSpectatorChat must be used within SpectatorChatProvider");
  return context;
};
