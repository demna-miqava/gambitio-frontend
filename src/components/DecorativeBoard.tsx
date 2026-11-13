import { useEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";
import { cn } from "@/lib/utils";

// A position from the Italian Game, for illustration
const DEFAULT_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R b KQkq - 0 5";

/** Non-interactive board used for illustration on marketing/auth pages. */
export const DecorativeBoard = ({
  fen = DEFAULT_FEN,
  lastMove = ["c2", "c3"],
  className,
}: {
  fen?: string;
  lastMove?: [string, string];
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cg = Chessground(ref.current, {
      fen,
      viewOnly: true,
      coordinates: false,
      lastMove: lastMove as never,
      drawable: {
        visible: true,
        autoShapes: [{ orig: "f6", dest: "e4", brush: "green" } as never],
      },
    });
    return () => cg.destroy();
  }, [fen, lastMove]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/15 ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10",
        className
      )}
    >
      <div ref={ref} className="h-full w-full" />
    </div>
  );
};
