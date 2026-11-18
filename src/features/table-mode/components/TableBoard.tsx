import { useEffect, useMemo, useRef, useState } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import type { PieceSymbol, Square } from "chess.js";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@/assets/pieces/chessground.merida.css";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
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
  const ref = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const [promotion, setPromotion] = useState<{ from: Square; to: Square; color: Side } | null>(null);
  const chess = useMemo(() => boardOf({ moves }), [moves]);
  const chessRef = useRef(chess);
  chessRef.current = chess;

  useEffect(() => {
    if (!ref.current) return;
    const cg = Chessground(ref.current, {
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
    });
    cgRef.current = cg;
    return () => {
      cg.destroy();
      cgRef.current = null;
    };
  }, []);

  useEffect(() => {
    const history = chess.history({ verbose: true });
    const last = history.at(-1);
    const turn: Side = chess.turn() === "w" ? "white" : "black";
    cgRef.current?.set({
      fen: chess.fen(),
      orientation,
      turnColor: turn,
      lastMove: last ? [last.from as Key, last.to as Key] : undefined,
      check: chess.inCheck(),
      movable: { color: enabled && !promotion ? turn : undefined, dests: calculateLegalMoves(chess) },
    });
  }, [chess, enabled, orientation, promotion]);

  return (
    <div className="board-frame relative aspect-square w-full">
      <div ref={ref} className="h-full w-full" role="img" aria-label={label} />
      {promotion && (
        <PromotionSelector
          color={promotion.color}
          square={promotion.to}
          boardOrientation={orientation}
          onSelect={(piece) => {
            onMoveRef.current({ from: promotion.from, to: promotion.to, promotion: piece });
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
