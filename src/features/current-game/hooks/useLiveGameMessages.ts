import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type {
  RatingChanges,
  MoveMessage,
  MoveRejectedMessage,
  GameErrorMessage,
  GameEndedMessage,
  InitialGameStateMessage,
  TakebackMessage,
  TimeAddedMessage,
} from "@/features/game/types/websocket-messages";
import { getTurnColor, syncBoard } from "@/features/game/utils/board-utils";
import { lastMoveSquares } from "@/features/game/utils/moveHistory";
import { loadServerPgn } from "@/features/game/utils/loadServerPgn";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

/** Wait before resyncing after an error (see handleError) */
const ERROR_SYNC_DELAY_MS = 500;

/**
 * Whether an error may have left a refused move on the board: one about a
 * move, or one the server sends before reading the message (rate limit,
 * bad JSON), which carries no request. Not the error for a sync, which
 * would loop.
 */
export const errorMayHaveDroppedMove = (data: GameErrorMessage["data"]): boolean => {
  const request = data.request;
  return !request || request.type === GAME_MESSAGE_TYPES.MOVE;
};

/** What a dropped (rate-limited) message was, for the user: "your resignation wasn't sent" */
const DROPPED_LABELS: Record<string, string> = {
  [GAME_MESSAGE_TYPES.RESIGN]: "resignation",
  [GAME_MESSAGE_TYPES.ABORT]: "abort",
  [GAME_MESSAGE_TYPES.DRAW_OFFER]: "draw offer",
  [GAME_MESSAGE_TYPES.DRAW_RESPONSE]: "draw reply",
  [GAME_MESSAGE_TYPES.TAKEBACK_REQUEST]: "takeback request",
  [GAME_MESSAGE_TYPES.TAKEBACK_RESPONSE]: "takeback reply",
  [GAME_MESSAGE_TYPES.REMATCH_REQUEST]: "rematch request",
  [GAME_MESSAGE_TYPES.REMATCH_RESPONSE]: "rematch reply",
  [GAME_MESSAGE_TYPES.CANCEL_REMATCH]: "rematch cancel",
  [GAME_MESSAGE_TYPES.GIVE_TIME]: "extra time",
};

/** The error as shown: a dropped action names itself, so the user knows to send it again */
export const gameErrorText = (data: GameErrorMessage["data"]): string => {
  const dropped = data.code === "RATE_LIMITED" ? DROPPED_LABELS[data.request?.type ?? ""] : undefined;
  return dropped ? `Too many messages: your ${dropped} wasn't sent. Try again.` : data.message;
};

interface UseLiveGameMessagesOptions {
  setGameEnded: (ended: boolean) => void;
  setRatingChanges: (changes: RatingChanges | null) => void;
  /**
   * Called with the SAN of each move not played on this device: the
   * opponent's, or either player's when spectating
   */
  onOpponentMove?: (san: string, userId: number) => void;
  /** Called when either player gives the other time */
  onTimeAdded?: (data: TimeAddedMessage) => void;
  /** Called when a takeback was accepted, after the board went back */
  onTakeback?: (data: TakebackMessage) => void;
  /**
   * Asks the server for the full game state (answered with
   * initial_game_state). Move messages carry only the move and the FEN after
   * it, so a board that drifted (a missed message) resyncs this way.
   */
  requestSync: () => void;
  /**
   * Set to performance.now() whenever this player's clock starts locally
   * (the opponent's move or the server's position arrives); moves report the
   * time since, so network delay isn't charged to the player
   */
  turnStartedAtRef: RefObject<number | null>;
}

/**
 * Keeps the local board in sync with the server, which is the source of truth
 * for the position, the clocks and the result.
 */
export const useLiveGameMessages = ({
  setGameEnded,
  setRatingChanges,
  onOpponentMove,
  onTimeAdded,
  onTakeback,
  requestSync,
  turnStartedAtRef,
}: UseLiveGameMessagesOptions) => {
  const { chessRef, cgRef, color, setTurn, inputLockedRef, setInputLocked } =
    useChessBoardContext();
  const { goToLastMove } = useGameNavigation();
  const { playSound, playSoundForMove } = useChessSound();
  const { id: currentUserId } = useUser();

  const [whiteTimeLeft, setWhiteTimeLeft] = useState<number | undefined>(
    undefined
  );
  const [blackTimeLeft, setBlackTimeLeft] = useState<number | undefined>(
    undefined
  );
  const [clockRunning, setClockRunning] = useState(false);
  // The position the server last confirmed. A move shown optimistically
  // that the server never played (e.g. it reached the server after a flag)
  // leaves the board off it when the game ends.
  const serverFenRef = useRef<string | null>(null);
  const errorSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (errorSyncTimerRef.current) clearTimeout(errorSyncTimerRef.current);
    },
    []
  );

  /**
   * Replaces the local position with the server's. `playPremove`: play a
   * premove the player queued, if it's their turn now. False if the PGN
   * didn't load: the game, board and move list are then left as they were.
   */
  const syncFromServerState = useCallback(
    (pgn: string, playPremove = true) => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      if (!chess || !cg) return false;
      // The clocks restart from the server's times now
      turnStartedAtRef.current = performance.now();

      if (!loadServerPgn(chess, pgn)) return false;

      // Recorded first: the board's last-move highlight comes from the moves
      const moves = setTurn(getTurnColor(chess));
      syncBoard({
        cg,
        chess,
        movableColor: inputLockedRef.current ? undefined : color,
        lastMove: lastMoveSquares(moves),
        playPremove,
      });
      goToLastMove();
      return true;
    },
    [chessRef, cgRef, color, setTurn, goToLastMove, inputLockedRef, turnStartedAtRef]
  );

  const handleIncomingMove = useCallback(
    (data: MoveMessage) => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      if (!chess || !cg) return;

      setWhiteTimeLeft(data.whiteTimeLeft);
      setBlackTimeLeft(data.blackTimeLeft);
      setClockRunning(data.clockRunning);
      serverFenRef.current = data.fen;

      // Our own move was already shown optimistically; just confirm the position
      if (data.userId === currentUserId) {
        if (chess.fen() !== data.fen) requestSync();
        return;
      }

      // Before syncBoard, which may play a premove straight away
      turnStartedAtRef.current = performance.now();
      try {
        const move = chess.move(data.move.lan);
        const turn = syncBoard({
          cg,
          chess,
          movableColor: inputLockedRef.current ? undefined : color,
          lastMove: [move.from, move.to],
          playPremove: true,
        });
        setTurn(turn, move);
        playSoundForMove(move, chess.isCheckmate());
        goToLastMove();
        onOpponentMove?.(move.san, data.userId);
        // Applied, but not where the server is: take the server's position
        if (chess.fen() !== data.fen) requestSync();
      } catch {
        // Local board drifted (e.g. missed message): take the server's position
        requestSync();
      }
    },
    [
      chessRef,
      cgRef,
      color,
      setTurn,
      playSoundForMove,
      goToLastMove,
      currentUserId,
      inputLockedRef,
      onOpponentMove,
      requestSync,
      turnStartedAtRef,
    ]
  );

  const handleMoveRejected = useCallback(
    (data: MoveRejectedMessage) => {
      toast.error(data.message);
      // The refused move is still on the board: ask for the whole state
      if (syncFromServerState(data.pgn)) serverFenRef.current = chessRef.current.fen();
      else requestSync();
    },
    [syncFromServerState, chessRef, requestSync]
  );

  // An error instead of move_rejected (rate limited, game over, server
  // error) leaves a refused move on the board. Resync, a moment later so a
  // rate limit has refilled; the error for a sync itself isn't answered.
  const handleError = useCallback(
    (data: GameErrorMessage) => {
      // A refused chat message is reported in the chat itself (GameChatContext)
      if (data.data.request?.type === GAME_MESSAGE_TYPES.CHAT) return;
      toast.error(gameErrorText(data.data), { id: "game_error" });
      if (!errorMayHaveDroppedMove(data.data) || errorSyncTimerRef.current) return;
      errorSyncTimerRef.current = setTimeout(() => {
        errorSyncTimerRef.current = null;
        requestSync();
      }, ERROR_SYNC_DELAY_MS);
    },
    [requestSync]
  );

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      // Lock now, not after the next render, so nothing else can be played
      setInputLocked(true);
      setGameEnded(true);
      setClockRunning(false);
      if (data.ratingChanges) {
        setRatingChanges(data.ratingChanges);
      }
      // Show the final position, not a move the server didn't play
      const chess = chessRef.current;
      if (chess && serverFenRef.current !== null && chess.fen() !== serverFenRef.current) {
        requestSync();
      }
    },
    [setGameEnded, setRatingChanges, setInputLocked, chessRef, requestSync]
  );

  // Both players agreed to take moves back. Everyone on the game (spectators
  // too) gets the position as PGN, since moves are dropped, not added. A
  // premove or selection was made for the old position: drop it rather than
  // play it on the new one.
  const handleTakeback = useCallback(
    (data: TakebackMessage) => {
      setWhiteTimeLeft(data.whiteTimeLeft);
      setBlackTimeLeft(data.blackTimeLeft);
      setClockRunning(data.clockRunning);
      serverFenRef.current = data.fen;
      cgRef.current?.cancelPremove();
      cgRef.current?.cancelMove();
      const synced = syncFromServerState(data.pgn, false);
      playSound("move");
      onTakeback?.(data);
      if (!synced || chessRef.current.fen() !== data.fen) requestSync();
    },
    [cgRef, chessRef, syncFromServerState, requestSync, playSound, onTakeback]
  );

  // Only the clock that got the time changes: the other one keeps counting
  // from where this device has it
  const handleTimeAdded = useCallback(
    (data: TimeAddedMessage) => {
      if (data.color === "white") setWhiteTimeLeft(data.whiteTimeLeft);
      else setBlackTimeLeft(data.blackTimeLeft);
      onTimeAdded?.(data);
    },
    [onTimeAdded]
  );

  // Sent on connect and on every reconnect
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      if (data.isFinished) setInputLocked(true);
      // This is the answer to a sync, so a PGN that doesn't load isn't
      // asked for again (it would loop): the board stays as it was
      if (syncFromServerState(data.pgn)) serverFenRef.current = chessRef.current.fen();
      setClockRunning(data.clockRunning && !data.isFinished);
      if (data.whiteTimeLeft !== null) setWhiteTimeLeft(data.whiteTimeLeft);
      if (data.blackTimeLeft !== null) setBlackTimeLeft(data.blackTimeLeft);
      if (data.isFinished) {
        setGameEnded(true);
        if (data.ratingChanges) setRatingChanges(data.ratingChanges);
      }
    },
    [syncFromServerState, setGameEnded, setRatingChanges, setInputLocked, chessRef]
  );

  useMessageDispatcher<MoveMessage>(gameMessages, GAME_MESSAGE_TYPES.MOVE, handleIncomingMove);
  useMessageDispatcher<MoveRejectedMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.MOVE_REJECTED,
    handleMoveRejected
  );
  useMessageDispatcher<GameErrorMessage>(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);
  useMessageDispatcher<GameEndedMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.GAME_ENDED,
    handleGameEnded
  );
  useMessageDispatcher<TimeAddedMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.TIME_ADDED,
    handleTimeAdded
  );
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );
  useMessageDispatcher<TakebackMessage>(gameMessages, GAME_MESSAGE_TYPES.TAKEBACK, handleTakeback);

  return { whiteTimeLeft, blackTimeLeft, clockRunning };
};
