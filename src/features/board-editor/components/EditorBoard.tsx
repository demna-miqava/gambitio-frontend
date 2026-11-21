import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import type { Key, Piece, Role } from "@lichess-org/chessground/types";
import { Hand, Trash2 } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useChessground } from "@/features/game/hooks/useChessground";
import type { PlayerColor } from "@/features/game/types/game.types";
import { cn } from "@/lib/utils";
import { withPieceAt } from "../utils/editorPosition";

/**
 * What a press on the board does: "move" drags and taps pieces around (and
 * dropping one off the board removes it), a piece letter (FEN: "K", "p")
 * puts that piece on every square tapped, "delete" empties them. Tapping is
 * how phones add pieces: dragging out of a tray is awkward on touch.
 */
export type EditorTool = "move" | "delete" | string;

const ROLES: { letter: string; role: Role; name: string }[] = [
  { letter: "k", role: "king", name: "king" },
  { letter: "q", role: "queen", name: "queen" },
  { letter: "r", role: "rook", name: "rook" },
  { letter: "b", role: "bishop", name: "bishop" },
  { letter: "n", role: "knight", name: "knight" },
  { letter: "p", role: "pawn", name: "pawn" },
];

const pieceOf = (letter: string): Piece => ({
  role: ROLES.find((r) => r.letter === letter.toLowerCase())!.role,
  color: letter === letter.toUpperCase() ? "white" : "black",
});

const toolLabel = (tool: EditorTool) => {
  if (tool === "move") return "Move pieces";
  if (tool === "delete") return "Remove pieces";
  const { color, role } = pieceOf(tool);
  return `${color === "white" ? "White" : "Black"} ${role}`;
};

/**
 * A spare piece drawn by the board's piece set: Chessground's own <piece>
 * element in a .cg-wrap, which is what the piece stylesheet targets. Made
 * through the DOM, since React doesn't know the tag.
 */
const TrayPiece = ({ piece }: { piece: Piece }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = document.createElement("piece");
    el.className = `${piece.color} ${piece.role}`;
    ref.current?.replaceChildren(el);
  }, [piece.color, piece.role]);
  return <span ref={ref} aria-hidden="true" className="cg-wrap pointer-events-none aspect-square w-[82%]" />;
};

const TOOL_BUTTON =
  "relative flex aspect-square max-w-12 min-w-0 flex-1 items-center justify-center rounded-md sm:max-w-14 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active=true]:bg-primary/15 data-[active=true]:ring-2 data-[active=true]:ring-primary";

/**
 * A row of spare pieces for one colour, with the move or delete tool at its
 * end. Click or tap picks a tool; with a mouse a piece can also be dragged
 * straight onto the board. Same height as a player row, so the board sizes
 * as on every other page.
 */
const SpareTray = ({
  color,
  tool,
  onTool,
  onDragPiece,
  edge,
}: {
  color: PlayerColor;
  tool: EditorTool;
  onTool: (tool: EditorTool) => void;
  onDragPiece: (piece: Piece, event: MouseEvent) => void;
  /** The tool at the end of the row */
  edge: "move" | "delete";
}) => {
  const EdgeIcon = edge === "move" ? Hand : Trash2;
  return (
    <div
      role="group"
      aria-label={`${color === "white" ? "White" : "Black"} pieces`}
      className="editor-tray flex min-h-12 items-center justify-between gap-0.5 py-1 sm:min-h-16 sm:gap-1"
    >
      {ROLES.map(({ letter }) => {
        const fen = color === "white" ? letter.toUpperCase() : letter;
        const piece = pieceOf(fen);
        const active = tool === fen;
        return (
          <button
            key={fen}
            type="button"
            aria-pressed={active}
            aria-label={toolLabel(fen)}
            title={toolLabel(fen)}
            data-active={active}
            className={TOOL_BUTTON}
            onClick={() => onTool(active ? "move" : fen)}
            onMouseDown={(event: ReactMouseEvent) => {
              if (event.button === 0) onDragPiece(piece, event.nativeEvent);
            }}
          >
            <TrayPiece piece={piece} />
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={tool === edge}
        aria-label={toolLabel(edge)}
        title={toolLabel(edge)}
        data-active={tool === edge}
        className={cn(TOOL_BUTTON, "text-muted-foreground")}
        onClick={() => onTool(edge)}
      >
        <EdgeIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
};

interface EditorBoardProps {
  placement: string;
  onPlacementChange: (placement: string) => void;
  orientation: PlayerColor;
  tool: EditorTool;
  onTool: (tool: EditorTool) => void;
  label: string;
}

/**
 * The board of the editor (Chessground in free mode: any piece can go to
 * any square, captures replace, dropping off the board deletes) between two
 * trays of spare pieces, the top one for the colour at the top.
 */
export const EditorBoard = ({ placement, onPlacementChange, orientation, tool, onTool, label }: EditorBoardProps) => {
  const latest = useRef({ placement, onPlacementChange, tool });
  useEffect(() => {
    latest.current = { placement, onPlacementChange, tool };
  });

  const { boardRef, cgRef } = useChessground(
    () => ({
      fen: placement,
      orientation,
      coordinates: true,
      movable: { free: true, color: "both", showDests: false },
      draggable: { enabled: true, deleteOnDropOff: true, showGhost: true },
      selectable: { enabled: true },
      premovable: { enabled: false },
      highlight: { lastMove: false, check: false },
      animation: { enabled: true, duration: 150 },
      drawable: { enabled: false, visible: false },
      events: {
        // A piece moved, dropped from a tray, or dragged off the board
        change: () => {
          const cg = cgRef.current;
          if (cg && cg.getFen() !== latest.current.placement) latest.current.onPlacementChange(cg.getFen());
        },
        // With a tray tool picked, a press puts or removes a piece there
        select: (key: Key) => {
          const { tool: current, placement: now, onPlacementChange: change } = latest.current;
          if (current === "move") return;
          const next = withPieceAt(now, key, current === "delete" ? null : current);
          if (next !== now) change(next);
        },
      },
    }),
    { dragAssist: true }
  );

  // Pieces follow the position (pasted FEN, Starting position, a tool tap)
  useEffect(() => {
    const cg = cgRef.current;
    if (cg && cg.getFen() !== placement) cg.set({ fen: placement, lastMove: undefined });
  }, [cgRef, placement]);

  useEffect(() => {
    cgRef.current?.set({ orientation });
  }, [cgRef, orientation]);

  // A tray tool turns moving off, so a tap on a piece places or removes
  // instead of picking it up
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    const moving = tool === "move";
    cg.selectSquare(null);
    cg.set({
      movable: { free: true, color: moving ? "both" : undefined },
      draggable: { enabled: moving },
      selectable: { enabled: moving },
      // Touches are for the board while placing, never a page scroll
      blockTouchScroll: !moving,
    });
  }, [cgRef, tool]);

  const dragPiece = (piece: Piece, event: MouseEvent) => cgRef.current?.dragNewPiece(piece, event, true);
  const top: PlayerColor = orientation === "white" ? "black" : "white";

  return (
    <div className="flex w-full max-w-(--board-max) flex-col">
      <SpareTray color={top} tool={tool} onTool={onTool} onDragPiece={dragPiece} edge="move" />
      <BoardLayout boardRef={boardRef} boardLabel={label} />
      <SpareTray color={orientation} tool={tool} onTool={onTool} onDragPiece={dragPiece} edge="delete" />
    </div>
  );
};
