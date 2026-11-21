import { useEffect, useState, type RefObject } from "react";
import type { Chess, PieceSymbol, Square } from "chess.js";
import type { Api } from "@lichess-org/chessground/api";
import { isPromotionMove } from "../utils/promotionUtils";

export type PendingPromotion = { from: Square; to: Square };

/**
 * Routes the player's board moves to `playMove`, by way of the promotion
 * picker when a pawn reaches the last rank (or straight to a queen with
 * auto-queen on), for local games whose rules run in chess.js (bot games,
 * endgame exercises).
 *
 * While pendingPromotion is set the picker is open, with the pawn left on
 * the promotion square; selectPromotion plays the move. Cancelling, and
 * closing the picker for other reasons (undo, resign, a typed move), is the
 * caller's: clear it with setPendingPromotion(null) and put the board back.
 */
export const usePromotionPicker = (
  cgRef: RefObject<Api | null>,
  chessRef: RefObject<Chess>,
  playMove: (from: Square, to: Square, promotion?: PieceSymbol) => unknown,
  autoQueen: boolean
) => {
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  useEffect(() => {
    cgRef.current?.set({
      movable: {
        events: {
          after: (orig, dest) => {
            const from = orig as Square;
            const to = dest as Square;
            if (isPromotionMove(to, chessRef.current.get(from))) {
              if (autoQueen) playMove(from, to, "q");
              else setPendingPromotion({ from, to });
              return;
            }
            playMove(from, to);
          },
        },
      },
    });
  }, [cgRef, chessRef, playMove, autoQueen]);

  const selectPromotion = (piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    playMove(from, to, piece);
  };

  return { pendingPromotion, setPendingPromotion, selectPromotion };
};
