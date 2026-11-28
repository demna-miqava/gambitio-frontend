import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { PieceSymbol } from "chess.js";
import {
  PROMOTION_PIECES,
  PIECE_NAMES,
  PIECE_SVGS,
} from "@/features/game/constants/promotion";
import {
  calculatePromotionPosition,
  shouldReversePromotionOrder,
} from "@/features/game/utils/promotionUtils";

interface PromotionSelectorProps {
  color: PlayerColor;
  square: string;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
  boardOrientation: PlayerColor;
}

export const PromotionSelector = memo(
  ({
    color,
    square,
    onSelect,
    onCancel,
    boardOrientation,
  }: PromotionSelectorProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Memoize position calculation
    const position = useMemo(
      () => calculatePromotionPosition(square, boardOrientation),
      [square, boardOrientation]
    );

    // Memoize order calculation
    const reverseOrder = useMemo(
      () => shouldReversePromotionOrder(color, boardOrientation),
      [color, boardOrientation]
    );

    // Stable event handlers
    const handleClickOutside = useCallback(
      (event: PointerEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          onCancel();
        }
      },
      [onCancel]
    );

    const handleEscape = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          // Claimed: the page's own Escape (leaving focus mode) doesn't run too
          event.preventDefault();
          onCancel();
        }
      },
      [onCancel]
    );

    // Handle click outside and escape key. pointerdown (not mousedown) so a
    // tap works on touch screens: Chessground prevents default on touchstart,
    // which stops iOS from synthesizing mouse events over the board.
    // Capture phase so board handlers can't stop it first.
    useEffect(() => {
      document.addEventListener("pointerdown", handleClickOutside, true);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("pointerdown", handleClickOutside, true);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [handleClickOutside, handleEscape]);

    return (
      <>
        {/* The board dims and takes no input until a piece is picked; a
            click here (anywhere outside the column) cancels */}
        <div className="absolute inset-0 z-40 bg-black/45" aria-hidden="true" />
        {/* One square wide, from the promotion square towards the player */}
        <div
          ref={menuRef}
          role="group"
          aria-label="Promote to"
          className={`absolute z-50 flex w-[12.5%] overflow-hidden rounded-md bg-card shadow-lg ${
            reverseOrder ? "flex-col-reverse" : "flex-col"
          }`}
          style={position}
        >
          {PROMOTION_PIECES.map((piece, index) => {
            const pieceSvg = PIECE_SVGS[color][piece];
            return (
              <button
                key={piece}
                type="button"
                // The queen is the usual choice: Enter takes it
                autoFocus={index === 0}
                onClick={() => onSelect(piece)}
                className="aspect-square p-[4%] outline-none transition-colors hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-label={`Promote to ${PIECE_NAMES[piece]}`}
              >
                <img src={pieceSvg} alt="" className="h-full w-full object-contain" draggable={false} />
              </button>
            );
          })}
        </div>
      </>
    );
  }
);
