import { useCallback, useState, type RefObject } from "react";
import type {
  RatingChanges,
  MoveMessage,
  MoveRejectedMessage,
  GameErrorMessage,
  GameEndedMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import { getLastMove, syncBoard } from "@/features/game/utils/board-utils";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

interface UseLiveGameMessagesOptions {
  setGameEnded: (ended: boolean) => void;
  setRatingChanges: (changes: RatingChanges | null) => void;
  /**
   * Called with the SAN of each move not played on this device: the
   * opponent's, or either player's when spectating
   */
  onOpponentMove?: (san: string, userId: number) => void;
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
  requestSync,
  turnStartedAtRef,
}: UseLiveGameMessagesOptions) => {
  const { chessRef, cgRef, color, setTurn, inputLockedRef, setInputLocked } =
    useChessBoardContext();
  const { goToLastMove } = useGameNavigation();
  const { playSoundForMove } = useChessSound();
  const { id: currentUserId } = useUser();

  const [whiteTimeLeft, setWhiteTimeLeft] = useState<number | undefined>(
    undefined
  );
  const [blackTimeLeft, setBlackTimeLeft] = useState<number | undefined>(
    undefined
  );
  const [clockRunning, setClockRunning] = useState(false);

  /** Replaces the local position with the server's. */
  const syncFromServerState = useCallback(
    (pgn: string) => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      if (!chess || !cg) return false;
      // The clocks restart from the server's times now
      turnStartedAtRef.current = performance.now();

      try {
        if (pgn) chess.loadPgn(pgn);
        else chess.reset();
      } catch {
        return false;
      }

      const turn = syncBoard({
        cg,
        chess,
        movableColor: inputLockedRef.current ? undefined : color,
        lastMove: getLastMove(chess),
        playPremove: true,
      });
      setTurn(turn);
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
        setTurn(turn);
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
      syncFromServerState(data.pgn);
    },
    [syncFromServerState]
  );

  const handleError = useCallback((data: GameErrorMessage) => {
    toast.error(data.data.message, { id: "game_error" });
  }, []);

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      // Lock now, not after the next render, so nothing else can be played
      setInputLocked(true);
      setGameEnded(true);
      setClockRunning(false);
      if (data.ratingChanges) {
        setRatingChanges(data.ratingChanges);
      }
    },
    [setGameEnded, setRatingChanges, setInputLocked]
  );

  // Sent on connect and on every reconnect
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      if (data.isFinished) setInputLocked(true);
      syncFromServerState(data.pgn);
      setClockRunning(data.clockRunning && !data.isFinished);
      if (data.whiteTimeLeft !== null) setWhiteTimeLeft(data.whiteTimeLeft);
      if (data.blackTimeLeft !== null) setBlackTimeLeft(data.blackTimeLeft);
      if (data.isFinished) {
        setGameEnded(true);
        if (data.ratingChanges) setRatingChanges(data.ratingChanges);
      }
    },
    [syncFromServerState, setGameEnded, setRatingChanges, setInputLocked]
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
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );

  return { whiteTimeLeft, blackTimeLeft, clockRunning };
};
