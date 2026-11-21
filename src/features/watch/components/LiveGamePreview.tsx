import { useEffect } from "react";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@/assets/pieces/chessground.merida.css";
import { useChessground } from "@/features/game/hooks/useChessground";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Small static board showing a live game's position. Decorative. */
export const LiveGamePreview = ({ fen }: { fen: string | null }) => {
  const { boardRef, cgRef } = useChessground(() => ({
    fen: START_FEN,
    viewOnly: true,
    coordinates: false,
    animation: { enabled: false },
  }));

  // The lists refresh on a timer; move the pieces instead of rebuilding
  useEffect(() => {
    cgRef.current?.set({ fen: fen ?? START_FEN });
  }, [cgRef, fen]);

  return (
    <div aria-hidden="true" className="board-frame relative aspect-square w-full">
      <div ref={boardRef} className="h-full w-full" />
    </div>
  );
};
