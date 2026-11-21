import { useEffect, useState, type PointerEvent } from "react";
import type { PieceSymbol, Square } from "chess.js";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useCalculateMode } from "../../contexts";

/** Top-left corner of a square on the board, in percent. */
const squareOffset = (square: string, orientation: PlayerColor) => {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { left: `${col * 12.5}%`, top: `${row * 12.5}%` };
};

/**
 * Calculate first: covers the board while the line is entered, so pieces
 * never move. Tap a piece of the side to move in the line's hidden
 * position, then where it goes. The keyboard path is the typed field in the
 * panel, so this layer is hidden from assistive technology.
 */
export const CalculateBoardOverlay = () => {
  const { attempt, position, addMove, isGameOver, puzzle } = useCalculateMode();
  const { cgRef, orientation } = useChessBoardContext();
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const entering = attempt.phase === "entering" && !isGameOver && !!puzzle && !!position;
  const enteredCount = attempt.entered.length;

  // A new move, an undo or a new puzzle drops the selection
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
  }, [enteredCount, puzzle?.id, entering]);

  if (!entering || !position) return null;

  const side = position.turn();
  // Once per square: a promotion is four moves to the same one
  const dests = selected
    ? [...new Set(position.moves({ square: selected, verbose: true }).map((m) => m.to))]
    : [];

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (promotion) return;
    const key = cgRef.current?.getKeyAtDomPos([event.clientX, event.clientY]) as Square | undefined;
    if (!key) return;
    event.preventDefault();
    const piece = position.get(key);
    if (selected && dests.includes(key)) {
      if (isPromotionMove(key, position.get(selected) ?? undefined)) {
        setPromotion({ from: selected, to: key });
        return;
      }
      addMove({ from: selected, to: key });
      setSelected(null);
      return;
    }
    if (piece && piece.color === side) {
      setSelected(key === selected ? null : key);
      return;
    }
    if (selected) addMove({ from: selected, to: key });
    setSelected(null);
  };

  return (
    <>
      <div
        aria-hidden="true"
        data-testid="calculate-entry-layer"
        className="absolute inset-0 z-10 cursor-pointer touch-none"
        onPointerDown={onPointerDown}
      >
        {selected && (
          <div
            className="absolute size-[12.5%] bg-primary/35 ring-2 ring-primary ring-inset"
            style={squareOffset(selected, orientation)}
          />
        )}
        {dests.map((dest) => (
          <div
            key={dest}
            className="absolute flex size-[12.5%] items-center justify-center"
            style={squareOffset(dest, orientation)}
          >
            <span className="size-[28%] rounded-full bg-primary/45" />
          </div>
        ))}
      </div>
      {promotion && (
        <PromotionSelector
          color={side === "w" ? "white" : "black"}
          square={promotion.to}
          boardOrientation={orientation}
          onSelect={(piece: PieceSymbol) => {
            addMove({ ...promotion, promotion: piece });
            setPromotion(null);
            setSelected(null);
          }}
          onCancel={() => setPromotion(null)}
        />
      )}
    </>
  );
};
