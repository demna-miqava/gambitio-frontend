import { useEffect, useRef } from "react";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useArchiveGame } from "../contexts/ArchiveGameContext";

/** Promotion picker for analysis boards (either side can promote). */
export const AnalysisPromotion = () => {
  const { color: orientation } = useChessBoardContext();
  const { pendingPromotion, handlePromotionSelect, cancelPromotion } = useArchiveGame();
  const ref = useRef<HTMLDivElement>(null);

  // Opened from the typed-move field ("e7e8"): the picker takes keyboard
  // focus, and the field gets it back once a piece is picked or it's closed
  useEffect(() => {
    if (!pendingPromotion) return;
    const typedFrom = document.activeElement;
    if (!(typedFrom instanceof HTMLInputElement)) return;
    const picker = ref.current;
    picker?.querySelector("button")?.focus();
    return () => {
      const focused = document.activeElement;
      if (!focused || focused === document.body || picker?.contains(focused)) typedFrom.focus();
    };
  }, [pendingPromotion]);

  if (!pendingPromotion) return null;
  return (
    // Not a box: the picker positions itself on the board
    <div ref={ref} className="contents">
      <PromotionSelector
        color={pendingPromotion.color}
        square={pendingPromotion.to}
        onSelect={handlePromotionSelect}
        onCancel={cancelPromotion}
        boardOrientation={orientation}
      />
    </div>
  );
};
