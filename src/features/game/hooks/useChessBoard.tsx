import { Chess, DEFAULT_POSITION, type Move } from "chess.js";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { PlayerColor } from "../types/game.types";
import { calculateLegalMoves } from "../utils/board-utils";
import { currentHistory, nextHistory, type MoveHistory } from "../utils/moveHistory";
import { BOARD_CONFIG } from "../constants/board-config";
import { useBoardOrientation } from "./useBoardOrientation";
import { useBoardSettings } from "./useBoardSettings";
import { useChessground } from "./useChessground";

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
  const boardSettings = useBoardSettings();

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

  // The board, created once on mount, before any child's effects run (see
  // useChessground); settings changes are applied by the hook
  const { boardRef, cgRef } = useChessground(
    () => {
      const chess = chessRef.current;
      const playerColorCode = color === "white" ? "w" : "b";
      const isMyTurn = chess.turn() === playerColorCode;
      return {
        fen: chess.fen(),
        orientation: color,
        viewOnly,
        draggable: { enabled: BOARD_CONFIG.ENABLE_DRAGGABLE },
        turnColor: chess.turn() === "w" ? "white" : "black",
        // A position that starts with the side to move in check (set up in
        // the board editor) shows it before the first move
        check: chess.inCheck(),
        movable: {
          color: color,
          free: false,
          dests: isMyTurn ? calculateLegalMoves(chess) : new Map(),
        },
      };
    },
    { dragAssist: !viewOnly, settings: boardSettings }
  );

  // The side to move at the start (a layout effect too, after the board's)
  useLayoutEffect(() => {
    const currentTurn = chessRef.current.turn();
    setTurn(currentTurn === "w" ? "white" : "black");
  }, [setTurn]);

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
  }, [cgRef]);

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
