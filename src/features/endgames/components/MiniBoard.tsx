import { useEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";
import type { PlayerColor } from "@/features/game/types/game.types";
import { cn } from "@/lib/utils";

/** A small view-only board showing an exercise's starting position (decoration). */
export const MiniBoard = ({
  fen,
  orientation,
  className,
}: {
  fen: string;
  orientation: PlayerColor;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cg = Chessground(ref.current, {
      fen,
      orientation,
      viewOnly: true,
      coordinates: false,
      drawable: { enabled: false, visible: false },
    });
    return () => cg.destroy();
  }, [fen, orientation]);

  return (
    <div aria-hidden="true" className={cn("relative aspect-square w-full overflow-hidden rounded-lg", className)}>
      <div ref={ref} className="h-full w-full" />
    </div>
  );
};
