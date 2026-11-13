import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import type { PuzzleStatus } from "../types/puzzle.types";

/**
 * After a puzzle ends, lets the player move pieces freely (either side) and
 * see engine lines for the position on the board.
 *
 * Exploration runs on its own Chess copy, so the puzzle's state is never
 * touched; Retry / Next puzzle rebuild the board from the puzzle anyway.
 */
export const usePuzzleExploration = (status: PuzzleStatus, puzzleId?: string) => {
  const { cgRef, chessRef } = useChessBoardContext();
  const { playSoundForMove } = useChessSound();
  const explorerRef = useRef<Chess | null>(null);
  const startFenRef = useRef<string | null>(null);
  const [active, setActive] = useState(false);
  const [fen, setFen] = useState<string | null>(null);

  const sync = useCallback(
    (lastMove?: [Key, Key]) => {
      const chess = explorerRef.current;
      const cg = cgRef.current;
      if (!chess || !cg) return;
      const turn = chess.turn() === "w" ? "white" : "black";
      cg.set({
        fen: chess.fen(),
        turnColor: turn,
        check: chess.inCheck(),
        lastMove,
        movable: { color: turn, free: false, showDests: true, dests: calculateLegalMoves(chess) },
      });
      setFen(chess.fen());
    },
    [cgRef]
  );

  const playMove = useCallback(
    (from: string, to: string, promotion = "q") => {
      const chess = explorerRef.current;
      if (!chess) return;
      try {
        const move = chess.move({ from: from as Square, to: to as Square, promotion });
        playSoundForMove(move, chess.isCheckmate());
        sync([move.from as Key, move.to as Key]);
      } catch {
        sync();
      }
    },
    [sync, playSoundForMove]
  );

  const start = useCallback(() => {
    const cg = cgRef.current;
    if (!cg) return;
    const startFen = chessRef.current.fen();
    // The wrong-move mark belongs to the puzzle position, not the exploration
    cg.setAutoShapes([]);
    startFenRef.current = startFen;
    explorerRef.current = new Chess(startFen);
    // Replaces the puzzle's move handler while exploring
    cg.set({ events: { move: (orig, dest) => playMove(orig, dest) } });
    sync();
    setActive(true);
  }, [cgRef, chessRef, playMove, sync]);

  /** Back to the position the puzzle ended on */
  const resetPosition = useCallback(() => {
    if (!startFenRef.current) return;
    explorerRef.current = new Chess(startFenRef.current);
    sync();
  }, [sync]);

  const stop = useCallback(() => {
    const cg = cgRef.current;
    const chess = chessRef.current;
    if (cg) {
      cg.set({
        fen: chess.fen(),
        turnColor: chess.turn() === "w" ? "white" : "black",
        check: chess.inCheck(),
        lastMove: undefined,
        movable: { color: undefined, dests: new Map() },
        events: { move: undefined },
      });
    }
    explorerRef.current = null;
    setActive(false);
    setFen(null);
  }, [cgRef, chessRef]);

  /** Plays the first move of an engine line (UCI, e.g. "e7e8q") */
  const playUci = useCallback(
    (uci: string) => playMove(uci.slice(0, 2), uci.slice(2, 4), uci[4] || "q"),
    [playMove]
  );

  // A new attempt or a new puzzle resets the board itself; just drop our state
  useEffect(() => {
    if (status === "solving") {
      explorerRef.current = null;
      setActive(false);
      setFen(null);
    }
  }, [status, puzzleId]);

  return {
    canExplore: status === "success" || status === "failed",
    active,
    fen,
    start,
    stop,
    resetPosition,
    playUci,
  };
};
