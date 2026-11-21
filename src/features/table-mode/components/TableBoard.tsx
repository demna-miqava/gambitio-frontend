import { useEffect, useMemo, useRef, useState } from "react";
import type { Key } from "@lichess-org/chessground/types";
import type { PieceSymbol, Square } from "chess.js";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@/assets/pieces/chessground.merida.css";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { useChessground } from "@/features/game/hooks/useChessground";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import { boardOf, type Side } from "../utils/tableGame";

interface TableBoardProps {
  moves: string[];
  /** Pieces can be moved (the clock is running) */
  enabled: boolean;
  orientation: Side;
  onMove: (move: { from: string; to: string; promotion?: PieceSymbol }) => void;
  /** Accessible description of the position */
  label: string;
}

/**
 * The recorder's board: it mirrors the real one. The side to move makes
 * their move here too, which ends their turn on the clock.
 */
export const TableBoard = ({ moves, enabled, orientation, onMove, label }: TableBoardProps) => {
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const [promotion, setPromotion] = useState<{ from: Square; to: Square; color: Side } | null>(null);
  const chess = useMemo(() => boardOf({ moves }), [moves]);
  const chessRef = useRef(chess);
  chessRef.current = chess;

  const { boardRef, cgRef } = useChessground(() => ({
    coordinates: true,
    movable: { free: false, showDests: true },
    animation: { enabled: true, duration: 150 },
    draggable: { enabled: true },
    events: {
      move: (orig, dest) => {
        const board = chessRef.current;
        const piece = board.get(orig as Square);
        if (isPromotionMove(dest as Square, piece ?? undefined)) {
          setPromotion({ from: orig as Square, to: dest as Square, color: piece!.color === "w" ? "white" : "black" });
          return;
        }
        onMoveRef.current({ from: orig, to: dest });
        // A move the game refused (the flag fell first) goes back: once
        // React has rendered, the board shows the game's own position
        setTimeout(() => cgRef.current?.set({ fen: chessRef.current.fen() }), 0);
      },
    },
  }));

  // The clock stopped (paused, flag fell, game over) with the picker open:
  // it closes, and the pawn goes back below
  const pendingPromotion = enabled ? promotion : null;
  useEffect(() => {
    if (!enabled) setPromotion(null);
  }, [enabled]);

  useEffect(() => {
    // The pawn stays on the promotion square while the picker is open
    if (pendingPromotion) {
      cgRef.current?.set({ movable: { color: undefined } });
      return;
    }
    const history = chess.history({ verbose: true });
    const last = history.at(-1);
    const turn: Side = chess.turn() === "w" ? "white" : "black";
    cgRef.current?.set({
      fen: chess.fen(),
      orientation,
      turnColor: turn,
      lastMove: last ? [last.from as Key, last.to as Key] : undefined,
      check: chess.inCheck(),
      movable: { color: enabled ? turn : undefined, dests: calculateLegalMoves(chess) },
    });
  }, [chess, enabled, orientation, pendingPromotion, cgRef]);

  return (
    <div className="board-frame relative aspect-square w-full">
      <div ref={boardRef} className="h-full w-full" role="img" aria-label={label} />
      {pendingPromotion && (
        <PromotionSelector
          color={pendingPromotion.color}
          square={pendingPromotion.to}
          boardOrientation={orientation}
          onSelect={(piece) => {
            onMoveRef.current({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
            setPromotion(null);
          }}
          onCancel={() => {
            setPromotion(null);
            // Put the pawn back
            cgRef.current?.set({ fen: chessRef.current.fen() });
          }}
        />
      )}
    </div>
  );
};
