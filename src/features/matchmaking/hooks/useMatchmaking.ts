import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import { toast } from "sonner";
import { BOARD_CONFIG } from "@/features/game/constants/board-config";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import type { MatchmakingMessage } from "../types/websocket-messages";
import { MATCHMAKING_MESSAGE_TYPES } from "../constants/websocket-types";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import { useStartGame } from "./useStartGame";
import { isCurrentSearchSocket } from "../utils/staleSocket";

interface UseMatchmakingProps {
  time: number;
  increment: number;
  /**
   * False looks for a casual game: no rating changes, and only paired with
   * others looking for one. Default: rated
   */
  rated?: boolean;
  /**
   * A failed search is shown by the caller, in place (see `error`), instead
   * of as a toast
   */
  quietErrors?: boolean;
}

/** Give up if the server hasn't confirmed the search by then. */
const CONNECT_TIMEOUT_MS = 15_000;
const MATCHMAKING_TOAST_ID = "matchmaking";

/** Why a search ended by itself */
export type MatchmakingError = {
  message: string;
  /**
   * "refused": the server's own reason (its message says it). Otherwise the
   * connection: it never opened ("connect") or dropped while in the queue ("lost").
   */
  kind: "connect" | "lost" | "refused";
};

type Session = {
  /** The socket that was current when this search started (it belongs to an earlier search) */
  previousSocket: WebSocket | null;
  /** The server sent SEARCHING, i.e. we are in the queue */
  inQueue: boolean;
};

/**
 * Hook to manage the matchmaking WebSocket connection.
 * Handles finding opponents and navigating to the game when a match is found.
 *
 * - isSearching: true from the moment setShouldConnect(true) is called until
 *   the search is cancelled, fails, or a match is found.
 * - isConnecting: true while searching but before the server confirmed the
 *   search (SEARCHING message).
 * - error: why the last search ended by itself (couldn't connect, lost the
 *   connection, refused by the server); null once another one starts or
 *   clearError is called.
 *
 * Messages are handled by this hook instance only (onMessage), so mounting
 * the hook in several components never starts the same game twice; only the
 * instance whose button was clicked is connected.
 *
 * Stale sockets: see isCurrentSearchSocket. Without that check, the close
 * of a cancelled search's socket could end the next search, and a message
 * still on its way from it would be taken for the next search's.
 */
export const useMatchmaking = ({
  time,
  increment,
  rated = true,
  quietErrors = false,
}: UseMatchmakingProps) => {
  const [shouldConnect, setShouldConnectState] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [error, setError] = useState<MatchmakingError | null>(null);
  // Counts the searches started, so each gets its own time to connect
  const [searchNumber, setSearchNumber] = useState(0);
  const sessionRef = useRef<Session | null>(null);
  const { startGame } = useStartGame();

  const baseUrl = useMemo(
    () =>
      shouldConnect
        ? `${BOARD_CONFIG.WEBSOCKET_BASE_URL}/matchmaking?time=${time}&increment=${increment ?? 0}${
            // Left out for a rated search, which every server version understands
            rated ? "" : "&rated=false"
          }`
        : null,
    [shouldConnect, time, increment, rated]
  );

  const { getUrl: authenticatedUrl, protocols } = useAuthenticatedWebSocket(baseUrl, shouldConnect);

  const endSession = useCallback(() => {
    sessionRef.current = null;
    setInQueue(false);
    setShouldConnectState(false);
  }, []);

  const fail = useCallback(
    (message: string, kind: MatchmakingError["kind"] = "connect") => {
      endSession();
      setError({ message, kind });
      if (!quietErrors) toast.error(message, { id: MATCHMAKING_TOAST_ID });
    },
    [endSession, quietErrors]
  );

  // Getting a token can fail; the library then gives up without a close
  // event, so report it here.
  const getUrl = useMemo(() => {
    if (!authenticatedUrl) return null;
    return async () => {
      const session = sessionRef.current;
      try {
        return await authenticatedUrl();
      } catch (error) {
        if (session && sessionRef.current === session) {
          fail("Couldn't connect to matchmaking. Try again.");
        }
        throw error;
      }
    };
  }, [authenticatedUrl, fail]);

  const { getWebSocket, sendMessage, readyState } = useWebSocket(getUrl, {
    protocols,
    shouldReconnect: () => false,
    onMessage: (event) => {
      const session = sessionRef.current;
      // Only the running search's own socket is listened to. The library
      // closes a replaced socket without taking its handlers off, so the
      // search just cancelled or moved (another time control, rated to
      // casual) can still deliver: its "searching" or error isn't this
      // search's, and its "match found" is a game the player turned down
      if (
        !session ||
        !isCurrentSearchSocket(session, event.target as WebSocket | null, getWebSocket() as WebSocket | null)
      ) {
        return;
      }
      const message = parseWebSocketMessage<MatchmakingMessage>(event);
      if (!message) return;

      switch (message.type) {
        case MATCHMAKING_MESSAGE_TYPES.SEARCHING:
          session.inQueue = true;
          setInQueue(true);
          break;
        case MATCHMAKING_MESSAGE_TYPES.MATCH_FOUND:
          endSession();
          startGame(message);
          break;
        case MATCHMAKING_MESSAGE_TYPES.ERROR:
          fail(message.data.message, "refused");
          break;
      }
    },
    onClose: (event) => {
      const session = sessionRef.current;
      // Ignore: cancelled, finished or already reported; or a socket from an
      // earlier search; or one replaced by a newer socket
      if (
        !session ||
        !isCurrentSearchSocket(
          session,
          event.target as WebSocket | null,
          getWebSocket() as WebSocket | null
        )
      ) {
        return;
      }

      if (session.inQueue) fail("Lost connection to matchmaking. Try again.", "lost");
      else fail("Couldn't connect to matchmaking. Try again.");
    },
  });
  // A search can run for several minutes
  useSocketReauth(sendMessage, readyState);

  const setShouldConnect = useCallback(
    (connect: boolean) => {
      if (!connect) {
        endSession();
        return;
      }
      if (sessionRef.current) return;
      setError(null);
      toast.dismiss(MATCHMAKING_TOAST_ID);
      sessionRef.current = {
        previousSocket: (getWebSocket() as WebSocket | null) ?? null,
        inQueue: false,
      };
      setInQueue(false);
      setSearchNumber((n) => n + 1);
      setShouldConnectState(true);
    },
    [endSession, getWebSocket]
  );

  const isConnecting = shouldConnect && !inQueue;

  useEffect(() => {
    if (!isConnecting) return;
    const timeout = window.setTimeout(
      () => fail("Couldn't connect to matchmaking. Try again."),
      CONNECT_TIMEOUT_MS
    );
    return () => window.clearTimeout(timeout);
    // searchNumber: a search that replaces one still connecting starts the wait again
  }, [isConnecting, fail, searchNumber]);

  const clearError = useCallback(() => setError(null), []);

  return {
    setShouldConnect,
    isSearching: shouldConnect,
    isConnecting,
    error,
    clearError,
  };
};
