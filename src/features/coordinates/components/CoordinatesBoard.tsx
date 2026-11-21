import { useEffect, useRef } from "react";
import type { Key } from "@lichess-org/chessground/types";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useChessground } from "@/features/game/hooks/useChessground";
import { cn } from "@/lib/utils";
import { EMPTY_FEN, START_FEN, perspectiveLabel } from "../utils/coordinates";
import type { Feedback } from "../utils/runReducer";
import type { CoordinatePerspective } from "../types";

/** How long a right or wrong square stays lit */
const FLASH_MS = 350;

interface CoordinatesBoardProps {
  perspective: CoordinatePerspective;
  withPieces: boolean;
  /** Clicks count only while true */
  active: boolean;
  onSquare: (square: Key) => void;
  /** The last click's result, flashed on its square */
  feedback: Feedback | null;
  /** Shown over the board while a run is on */
  target?: Key;
  next?: Key;
}

/**
 * The board for the drill: no coordinate labels (whatever the player's
 * setting), no moving pieces, and every press on a square reported at once
 * (`blockTouchScroll`, so a tap on an empty square isn't held back for the
 * mouse event a phone sends after it).
 */
export const CoordinatesBoard = ({
  perspective,
  withPieces,
  active,
  onSquare,
  feedback,
  target,
  next,
}: CoordinatesBoardProps) => {
  const onSquareRef = useRef(onSquare);
  const activeRef = useRef(active);
  useEffect(() => {
    onSquareRef.current = onSquare;
    activeRef.current = active;
  });

  const { boardRef, cgRef } = useChessground(() => ({
    fen: withPieces ? START_FEN : EMPTY_FEN,
    orientation: perspective,
    coordinates: false,
    viewOnly: false,
    movable: { free: false, color: undefined, showDests: false },
    draggable: { enabled: false },
    selectable: { enabled: false },
    premovable: { enabled: false },
    drawable: { enabled: false, visible: false },
    highlight: { lastMove: false, check: false },
    animation: { enabled: false },
    blockTouchScroll: true,
    events: {
      select: (key) => {
        if (activeRef.current) onSquareRef.current(key);
      },
    },
  }));

  useEffect(() => {
    cgRef.current?.set({ orientation: perspective, fen: withPieces ? START_FEN : EMPTY_FEN });
  }, [cgRef, perspective, withPieces]);

  // Flash the clicked square green or red, then clear it
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    if (!feedback) {
      cg.set({ highlight: { custom: new Map() } });
      return;
    }
    cg.set({ highlight: { custom: new Map([[feedback.square, `coord-${feedback.kind}`]]) } });
    const clear = setTimeout(() => cg.set({ highlight: { custom: new Map() } }), FLASH_MS);
    return () => clearTimeout(clear);
  }, [cgRef, feedback]);

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={`Board seen from ${perspectiveLabel(perspective)}'s side, ${withPieces ? "pieces in the starting position" : "empty"}, without coordinates`}
    >
      {target && (
        // Over the board but never in the way of a click
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-[3cqw] select-none"
        >
          <span
            key={feedback?.id ?? 0}
            className={cn(
              "coord-target font-display-num text-[24cqw] leading-none text-foreground",
              feedback?.kind === "wrong" && "coord-target-wrong",
              feedback?.kind === "right" && "coord-target-right"
            )}
          >
            {target}
          </span>
          {next && (
            <span className="coord-target font-display-num self-center text-[9cqw] leading-none text-foreground/70">
              {next}
            </span>
          )}
        </div>
      )}
    </BoardLayout>
  );
};
