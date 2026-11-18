import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type {
  GameEndReason,
  GameEndedMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { getGameEndMessage } from "../constants/gameEndMessages";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";

export type FinishState = {
  title: string;
  description?: string;
};

const NOT_CONNECTED = "Not connected. Try again when you're back online.";

/**
 * Endings caused by the last move on the board. The result dialog waits a
 * moment for these, so the final move is seen before the dialog covers it.
 */
const ENDED_ON_BOARD: ReadonlySet<GameEndReason> = new Set([
  "checkmate",
  "stalemate",
  "threefold_repetition",
  "insufficient_material",
  "fifty_move_rule",
]);
export const RESULT_DIALOG_DELAY_MS = 1000;

/**
 * Resign/abort, and the game result: `finish` is set when the game ends here
 * (and opens the result dialog) or when a finished game is opened.
 */
export const useGameActions = () => {
  const { game, sendMessage } = useLiveGame();
  const { ply } = useChessBoardContext();
  const { playGenericSound } = useChessSound();
  const { id: currentUserId } = useUser();

  const [openGameResultDialog, setOpenGameResultDialog] = useState(false);
  const [finish, setFinish] = useState<FinishState | null>(null);
  const dialogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
    },
    []
  );

  // The server allows aborting until both players have made a move of their
  // own: an opening's moves (startPly) don't count
  const hasMoves = ply - (game.startPly ?? 0) >= 2;

  const handleGameEnded = useCallback(
    (data: GameEndedMessage) => {
      const { reason, winnerId } = data;

      const isWinner = winnerId === currentUserId;
      const message = getGameEndMessage(reason, isWinner, winnerId === null);

      if (message) {
        setFinish(message);
        if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
        if (ENDED_ON_BOARD.has(reason)) {
          dialogTimerRef.current = setTimeout(() => {
            dialogTimerRef.current = null;
            setOpenGameResultDialog(true);
          }, RESULT_DIALOG_DELAY_MS);
        } else {
          setOpenGameResultDialog(true);
        }
        // No live-region announcement: the dialog takes focus and is read out
        playGenericSound();
      }
    },
    [playGenericSound, currentUserId]
  );

  // Opening an already finished game: show the result, without the dialog
  const handleInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      if (!data.isFinished || !data.reason) return;
      const winnerId = data.winnerId ?? null;
      const message = getGameEndMessage(
        data.reason,
        winnerId === currentUserId,
        winnerId === null
      );
      if (message) setFinish((current) => current ?? message);
    },
    [currentUserId]
  );

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

  const send = useCallback(
    (type: GAME_MESSAGE_TYPES) => {
      if (!sendMessage(JSON.stringify({ type }))) toast.error(NOT_CONNECTED);
    },
    [sendMessage]
  );

  const onResign = useCallback(() => send(GAME_MESSAGE_TYPES.RESIGN), [send]);
  const onAbort = useCallback(() => send(GAME_MESSAGE_TYPES.ABORT), [send]);

  return {
    openGameResultDialog,
    setOpenGameResultDialog,
    finish,
    onResign,
    onAbort,
    hasMoves,
  };
};
