import { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WS_BASE_URL } from "@/constants/apiConfig";
import { RECONNECT_OPTIONS } from "@/constants/websocket";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import type { GameWebSocketMessage } from "@/features/game/types/websocket-messages";
import { applyWatchedGameMessage, type WatchedGame } from "../utils/watchedGame";

export type WatchedGameStatus = "connecting" | "open" | "reconnecting" | "error";

/**
 * The game a study room watches, from its game socket, as a spectator (the
 * same view anyone watching it gets). `onChange` runs whenever the game's
 * moves or result change, including the state sent on every (re)connect:
 * the room then asks the server to bring its line up to the game.
 * `gameId` null: no socket (an ordinary room).
 */
export const useWatchedGame = (gameId: number | null, onChange: () => void) => {
  const [game, setGame] = useState<WatchedGame | null>(null);
  const gameRef = useRef<WatchedGame | null>(null);
  const [failed, setFailed] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const baseUrl = gameId !== null ? `${WS_BASE_URL}/game/${gameId}` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, gameId !== null);

  const { sendMessage, readyState } = useWebSocket(getUrl, {
    ...RECONNECT_OPTIONS,
    protocols,
    // A finished game sends nothing more; no point reconnecting to it
    shouldReconnect: () => gameRef.current?.inProgress !== false,
    onOpen: () => {
      setHasOpened(true);
      setFailed(false);
    },
    onMessage: (event) => {
      const message = parseWebSocketMessage<GameWebSocketMessage>(event);
      if (!message) return;
      if (message.type === "error" && !gameRef.current) {
        setFailed(true);
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

  let status: WatchedGameStatus = "connecting";
  if (failed) status = "error";
  else if (readyState === ReadyState.OPEN) status = "open";
  else if (hasOpened) status = "reconnecting";

  return { game, status };
};
