import type { Api } from "@lichess-org/chessground/api";
import { Chess, DEFAULT_POSITION, type Move } from "chess.js";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlayerColor } from "../types/game.types";
import { Chessground } from "@lichess-org/chessground";
import { calculateLegalMoves } from "../utils/board-utils";
import { currentHistory, nextHistory, type MoveHistory } from "../utils/moveHistory";
import { BOARD_CONFIG } from "../constants/board-config";
import { useSettings } from "@/features/settings/SettingsContext";
import { attachTouchDragAssist } from "../utils/touchDragAssist";
import { useBoardOrientation } from "./useBoardOrientation";

interface UseChessBoardOptions {
  color: PlayerColor;
  /** Decoration only: no moves, no selection, no start sound */
  viewOnly?: boolean;
}

// A new Chess() is at the start, with no moves
const START_HISTORY: MoveHistory = { fen: DEFAULT_POSITION, moves: [] };

export const useChessBoard = ({ color, viewOnly = false }: UseChessBoardOptions) => {
  const [turn, setTurnState] = useState<PlayerColor | undefined>();
  const chessRef = useRef(new Chess());
  // The moves in chessRef as of the last setTurn, read once per change
  // (chess.history() replays the game) and shared by everything that shows
  // them. State, since the chess instance is a ref: a resync that replaces
  // moves without changing their count (or the side to move) still gives a
  // new array and re-renders. The ref is for callbacks between renders.
  const historyRef = useRef<MoveHistory>(START_HISTORY);
  const [moves, setMoves] = useState<Move[]>(START_HISTORY.moves);
  const ply = moves.length;
  // See setInputLocked below. The ref is for callbacks that run between renders
  // (socket messages), the state for rendering.
  const inputLockedRef = useRef(false);
  const [inputLocked, setInputLockedState] = useState(false);
  const { settings } = useSettings();
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  /**
   * Call after changing chessRef: records the side to move and the moves.
   * Pass the move just played (chess.move()'s result) to add it without
   * replaying the game. Returns the moves.
   */
  const setTurn = useCallback((next: PlayerColor, appended?: Move) => {
    const history = nextHistory(chessRef.current, historyRef.current, appended);
    historyRef.current = history;
    setTurnState(next);
    setMoves(history.moves);
    return history.moves;
  }, []);

  /**
   * The moves in chessRef now, for callbacks and effects: those of the last
   * setTurn, or a fresh read if the game moved on without one.
   */
  const getMoves = useCallback(() => {
    historyRef.current = currentHistory(chessRef.current, historyRef.current);
    return historyRef.current.moves;
  }, []);

  const pendingDestroyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detachDragAssistRef = useRef<(() => void) | null>(null);

  // Initialize board once on mount. A layout effect, so the board exists
  // before any child's useEffect runs (effects run child-first): children
  // attach move handlers and sync positions from their own effects.
  useLayoutEffect(() => {
    // Remounted right after a cleanup (React StrictMode in development):
    // keep the existing board, since child components have already attached
    // their move handlers to it
    if (pendingDestroyRef.current) {
      clearTimeout(pendingDestroyRef.current);
      pendingDestroyRef.current = null;
    }
    const scheduleDestroy = () => {
      // Chessground adds document-level mouse/touch/scroll listeners that only
      // destroy() removes; deferred so a StrictMode remount can cancel it
      pendingDestroyRef.current = setTimeout(() => {
        pendingDestroyRef.current = null;
        detachDragAssistRef.current?.();
        detachDragAssistRef.current = null;
        cgRef.current?.destroy();
        cgRef.current = null;
      }, 0);
    };
    if (!boardRef.current || cgRef.current) return scheduleDestroy;
    const chess = chessRef.current;
    const playerColorCode = color === "white" ? "w" : "b";
    const isMyTurn = chess.turn() === playerColorCode;

    cgRef.current = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation: color,
      viewOnly,
      coordinates: settings?.boardCoordinatesEnabled ?? true,
      premovable: { enabled: settings?.premovesEnabled },
      draggable: { enabled: BOARD_CONFIG.ENABLE_DRAGGABLE },
      turnColor: chess.turn() === "w" ? "white" : "black",
      highlight: {
        lastMove: settings?.moveHighlightEnabled ?? true,
        check: true,
      },
      movable: {
        showDests: settings?.showLegalMovesEnabled,
        color: color,
        free: false,
        dests: isMyTurn ? calculateLegalMoves(chess) : new Map(),
      },
    });

    if (!viewOnly) detachDragAssistRef.current = attachTouchDragAssist(cgRef.current);

    const currentTurn = chess.turn();
    setTurn(currentTurn === "w" ? "white" : "black");

    return scheduleDestroy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update board configuration when settings change
  useEffect(() => {
    if (!cgRef.current) return;

    cgRef.current.set({
      coordinates: settings?.boardCoordinatesEnabled ?? true,
      premovable: { enabled: settings?.premovesEnabled },
      highlight: {
        lastMove: settings?.moveHighlightEnabled ?? true,
        check: true,
      },
      movable: {
        ...cgRef.current.state.movable,
        showDests: settings?.showLegalMovesEnabled,
      },
    });
  }, [
    settings?.boardCoordinatesEnabled,
    settings?.premovesEnabled,
    settings?.moveHighlightEnabled,
    settings?.showLegalMovesEnabled,
  ]);

  /**
   * Locks or unlocks the board for the player (game over, connection lost).
   * Locking takes effect at once: it drops any selection, drag or premove and
   * stops moves. Code that re-syncs the board should check inputLockedRef and
   * pass no movable color while it's set. Unlocking doesn't touch the board;
   * the caller re-syncs it with the player's color.
   */
  const setInputLocked = useCallback((locked: boolean) => {
    inputLockedRef.current = locked;
    setInputLockedState(locked);
    if (locked) cgRef.current?.stop();
  }, []);

  // The side at the bottom: the player's colour until the board is flipped
  const { orientation, flip: flipBoard, setOrientation } = useBoardOrientation(cgRef, color);

  return {
    boardRef,
    chessRef,
    cgRef,
    turn,
    setTurn,
    moves,
    getMoves,
    ply,
    inputLocked,
    inputLockedRef,
    setInputLocked,
    orientation,
    flipBoard,
    setOrientation,
  };
};
