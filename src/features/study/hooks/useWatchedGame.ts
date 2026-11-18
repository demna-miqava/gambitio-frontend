import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WS_BASE_URL } from "@/constants/apiConfig";
import { RECONNECT_OPTIONS } from "@/constants/websocket";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import type { GameWebSocketMessage } from "@/features/game/types/websocket-messages";
import {
  applyWatchedGameMessage,
  shouldReconnectToGame,
  watchedGameStatus,
  type WatchedGame,
  type WatchedGameStatus,
} from "../utils/watchedGame";

export type { WatchedGameStatus };

/**
 * The game a study room watches, from its game socket, as a spectator (the
 * same view anyone watching it gets). `onChange` runs whenever the game's
 * moves or result change, including the state sent on every (re)connect:
 * the room then asks the server to bring its line up to the game.
 * `gameId` null: no socket (an ordinary room).
 *
 * When the reconnect attempts run out, or the server refuses the game,
 * the socket stays closed until `retry` (see watchedGameStatus).
 */
export const useWatchedGame = (gameId: number | null, onChange: () => void) => {
  const [game, setGame] = useState<WatchedGame | null>(null);
  const gameRef = useRef<WatchedGame | null>(null);
  // The server sent an error before the game: it won't open it for us
  const [refused, setRefused] = useState(false);
  const refusedRef = useRef(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  // Bumped by retry: a new url function makes the library connect afresh
  const [attempt, setAttempt] = useState(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const baseUrl = gameId != null ? `${WS_BASE_URL}/game/${gameId}` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, gameId != null);
  const connectUrl = useCallback(
    () => getUrl!(),
    // `attempt` is what makes a Retry connect again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getUrl, attempt]
  );

  const { sendMessage, readyState } = useWebSocket(getUrl ? connectUrl : null, {
    ...RECONNECT_OPTIONS,
    protocols,
    shouldReconnect: () => shouldReconnectToGame(gameRef.current, refusedRef.current),
    onOpen: () => {
      setHasOpened(true);
      setGaveUp(false);
    },
    onReconnectStop: () => setGaveUp(true),
    onMessage: (event) => {
      const message = parseWebSocketMessage<GameWebSocketMessage>(event);
      if (!message) return;
      if (message.type === "error" && !gameRef.current) {
        refusedRef.current = true;
        setRefused(true);
        return;
      }
      const { game: next, changed } = applyWatchedGameMessage(gameRef.current, message);
      if (next !== gameRef.current) {
        gameRef.current = next;
        setGame(next);
      }
      if (changed) onChangeRef.current();
    },
  });

  useSocketReauth(sendMessage, readyState);

  const status = watchedGameStatus({
    game,
    open: readyState === ReadyState.OPEN,
    hasOpened,
    refused,
    gaveUp,
  });

  /** Connects again after the attempts ran out or the server refused the game */
  const retry = useCallback(() => {
    refusedRef.current = false;
    setRefused(false);
    setGaveUp(false);
    setAttempt((n) => n + 1);
  }, []);

  return { game, status, retry };
};
