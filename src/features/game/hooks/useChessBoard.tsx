import type { Api } from "@lichess-org/chessground/api";
import { Chess } from "chess.js";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlayerColor } from "../types/game.types";
import { Chessground } from "@lichess-org/chessground";
import { calculateLegalMoves } from "../utils/board-utils";
import { BOARD_CONFIG } from "../constants/board-config";
import { useSettings } from "@/features/settings/SettingsContext";
import { useChessSound } from "../contexts/ChessSoundContext";
import { attachTouchDragAssist } from "../utils/touchDragAssist";
import { useBoardOrientation } from "./useBoardOrientation";

interface UseChessBoardOptions {
  color: PlayerColor;
  /** Decoration only: no moves, no selection, no start sound */
  viewOnly?: boolean;
}

export const useChessBoard = ({ color, viewOnly = false }: UseChessBoardOptions) => {
  const [turn, setTurnState] = useState<PlayerColor | undefined>();
  // Half-moves in chessRef as of the last setTurn. The chess instance is a
  // ref, so without this a resync that loads moves but leaves the side to
  // move unchanged (e.g. 1.e4 e5, white again) re-rendered nothing and the
  // move navigation kept a stale move count.
  const [ply, setPly] = useState(0);
  // See setInputLocked below. The ref is for callbacks that run between renders
  // (socket messages), the state for rendering.
  const inputLockedRef = useRef(false);
  const [inputLocked, setInputLockedState] = useState(false);
  const { settings } = useSettings();
  const { playGenericSound } = useChessSound();
  const boardRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess());
  const cgRef = useRef<Api | null>(null);

  /** Call after changing chessRef: records the side to move and move count */
  const setTurn = useCallback((next: PlayerColor) => {
    setTurnState(next);
    setPly(chessRef.current.history().length);
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

    if (!viewOnly) playGenericSound();

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
    ply,
    inputLocked,
    inputLockedRef,
    setInputLocked,
    orientation,
    flipBoard,
    setOrientation,
  };
};
