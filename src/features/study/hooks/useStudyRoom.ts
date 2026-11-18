import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WS_BASE_URL } from "@/constants/apiConfig";
import { ROUTES } from "@/constants/routes";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { RECONNECT_OPTIONS } from "@/constants/websocket";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { useUser } from "@/hooks/useUser";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import type { StudyClientMessage, StudyRoomSnapshot, StudyServerMessage } from "../types";
import { applyStudyMessage, nodeOf } from "../utils/studyState";
import { activityMessage } from "../utils/activity";

export type StudyRoomStatus = "connecting" | "ready" | "not_found";

/** The server's token bucket refills 10 messages a second */
const RATE_LIMIT_SYNC_DELAY_MS = 1_000;

/**
 * A study room's live state. The server sends the whole room on connect
 * (and on "sync"), then small versioned changes; see applyStudyMessage.
 * Moving around the tree is shown at once (the server's echo confirms it);
 * moves, comments and arrows appear when the server has stored them.
 */
export const useStudyRoom = (roomId: number) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: myId } = useUser();
  const [snapshot, setSnapshot] = useState<StudyRoomSnapshot | null>(null);
  const snapshotRef = useRef<StudyRoomSnapshot | null>(null);
  const [notFound, setNotFound] = useState(false);
  const notFoundRef = useRef(false);
  // Bumped when the board must be put back to the shared position (a move
  // the server refused)
  const [boardResetKey, setBoardResetKey] = useState(0);
  // Latest change made by someone else, read out politely
  const [activity, setActivity] = useState("");
  const syncPending = useRef(false);
  // A room watching a game asks for the game's moves once per connection
  // (then whenever the game socket delivers a move: syncGame)
  const gameSyncedThisConnection = useRef(false);
  /** Why the last chat message was refused, shown in the chat panel */
  const [chatError, setChatError] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(syncTimer.current), []);
  const leaving = useRef(false);

  const update = useCallback((next: StudyRoomSnapshot | null) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const baseUrl = Number.isSafeInteger(roomId) && roomId > 0 ? `${WS_BASE_URL}/study/${roomId}` : null;
  const { getUrl, protocols } = useAuthenticatedWebSocket(baseUrl, !notFound);

  const leave = useCallback(
    (message: string) => {
      if (leaving.current) return;
      leaving.current = true;
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
      toast.info(message);
      navigate(ROUTES.STUDY, { replace: true });
    },
    [navigate, queryClient]
  );

  const { sendMessage, readyState } = useWebSocket(getUrl, {
    ...RECONNECT_OPTIONS,
    // A room we can't open stays closed (not a member, or it's gone)
    shouldReconnect: () => !notFoundRef.current && !leaving.current,
    protocols,
    // The server sends the whole room on every connect
    onOpen: () => {
      syncPending.current = false;
      gameSyncedThisConnection.current = false;
    },
    onMessage: (event) => {
      const message = parseWebSocketMessage<StudyServerMessage>(event);
      if (!message) return;
      switch (message.type) {
        case "removed":
          return leave("You were removed from this study room");
        case "room_deleted":
          return leave("This study room was deleted");
        case "error": {
          const { code, message: text } = message.data ?? {};
          if (code === "STUDY_NOT_FOUND" && !snapshotRef.current) {
            notFoundRef.current = true;
            setNotFound(true);
            return;
          }
          if (code === "STUDY_NOT_FOUND") return leave("You're no longer in this study room");
          // Chat problems belong to the chat panel; the board is fine
          if (code?.startsWith("CHAT_")) return setChatError(text || "Couldn't send that message");
          // The game's line will come with the next sync; nothing to show
          if (code === "STUDY_NOT_LINKED") return;
          toast.error(text || "Something went wrong", { id: "study-error" });
          // A refused move or a change to a deleted position: back to what the room shows
          setBoardResetKey((k) => k + 1);
          if (code === "INVALID_STUDY_ACTION") requestSync();
          // A dropped message (e.g. a goto while holding an arrow key) left us
          // out of step with the room: catch up once the server takes messages again
          if (code === "RATE_LIMITED" && !syncTimer.current) {
            syncTimer.current = setTimeout(() => {
              syncTimer.current = undefined;
              // The limit may have dropped an earlier "sync" too
              syncPending.current = false;
              requestSync();
            }, RATE_LIMIT_SYNC_DELAY_MS);
          }
          return;
        }
      }

      const before = snapshotRef.current;
      const { snapshot: next, needsSync } = applyStudyMessage(before, message);
      if (message.type === "study_state") {
        syncPending.current = false;
        if (message.room.gameId !== null && !gameSyncedThisConnection.current) {
          gameSyncedThisConnection.current = true;
          send({ type: "sync_game" });
        }
      }
      if (next !== before) {
        update(next);
        if (next && before && "by" in message && message.by !== myId) {
          const text = activityMessage(before, next, message);
          if (text) setActivity(text);
        }
      }
      if (needsSync) requestSync();
    },
  });

  useSocketReauth(sendMessage, readyState);

  const send = useCallback(
    (message: StudyClientMessage) => sendMessage(JSON.stringify(message)),
    [sendMessage]
  );

  // One "sync" at a time; the room's study_state answers it
  const requestSync = () => {
    if (syncPending.current) return;
    syncPending.current = true;
    send({ type: "sync" });
  };

  /** Moves the shared view to a node (shown here at once). */
  const goTo = useCallback(
    (nodeId: string) => {
      const current = snapshotRef.current;
      if (!current || current.state.cursor === nodeId || !nodeOf(current.state, nodeId)) return;
      update({ ...current, state: { ...current.state, cursor: nodeId } });
      send({ type: "goto", nodeId });
    },
    [send, update]
  );

  /** A room watching a game: the game socket delivered a move (or the game ended). */
  const syncGame = useCallback(() => {
    if (snapshotRef.current?.room.gameId != null) send({ type: "sync_game" });
  }, [send]);

  const sendChat = useCallback(
    (text: string) => {
      setChatError(null);
      send({ type: "chat", text });
    },
    [send]
  );

  /**
   * We're leaving or deleting the room ourselves: the server's notice needs
   * no toast. Called with false when that failed, so the room works again
   * (reconnects, and later notices are acted on).
   */
  const expectExit = useCallback((expected: boolean = true) => {
    leaving.current = expected;
  }, []);

  return {
    snapshot,
    expectExit,
    status: (notFound ? "not_found" : snapshot ? "ready" : "connecting") as StudyRoomStatus,
    connected: readyState === ReadyState.OPEN,
    send,
    goTo,
    boardResetKey,
    activity,
    syncGame,
    sendChat,
    chatError,
  };
};
