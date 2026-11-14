import { useEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@/assets/pieces/chessground.merida.css";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Small static board showing a live game's position. Decorative. */
export const LiveGamePreview = ({ fen }: { fen: string | null }) => {
  const ref = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cg = Chessground(ref.current, {
      fen: START_FEN,
      viewOnly: true,
      coordinates: false,
      animation: { enabled: false },
    });
    cgRef.current = cg;
    return () => {
      cg.destroy();
      cgRef.current = null;
    };
  }, []);

  // The lists refresh on a timer; move the pieces instead of rebuilding
  useEffect(() => {
    cgRef.current?.set({ fen: fen ?? START_FEN });
  }, [fen]);

  return (
    <div aria-hidden="true" className="board-frame relative aspect-square w-full">
      <div ref={ref} className="h-full w-full" />
    </div>
  );
};
