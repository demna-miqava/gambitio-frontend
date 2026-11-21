import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GameLayout } from "@/features/game/components/GameLayout";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { EditorBoard, type EditorTool } from "@/features/board-editor/components/EditorBoard";
import { EditorPanel } from "@/features/board-editor/components/EditorPanel";
import {
  STARTING_POSITION,
  normalizePosition,
  parseFen,
  positionProblem,
  toFen,
  type EditorPosition,
} from "@/features/board-editor/utils/editorPosition";

/**
 * Board editor: set up any position (drag pieces, spare pieces from the
 * trays, or a pasted FEN) and open it in the analysis board or play it
 * against the computer. The position is in the URL (?fen=), so it can be
 * linked and survives a reload; edits replace the history entry rather
 * than adding one per piece.
 */
const BoardEditor = () => {
  useDocumentTitle("Board editor");
  const [params, setParams] = useSearchParams();
  const linked = params.get("fen");
  const [position, setPositionState] = useState<EditorPosition>(
    () => (linked && parseFen(linked)) || STARTING_POSITION
  );
  const [badLink] = useState(() => !!linked && !parseFen(linked));
  const [orientation, setOrientation] = useState<PlayerColor>("white");
  const [tool, setTool] = useState<EditorTool>("move");

  const fen = toFen(position);
  useEffect(() => {
    if (params.get("fen") === fen) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("fen", fen);
        return next;
      },
      { replace: true }
    );
  }, [fen, params, setParams]);

  const setPosition = useCallback((next: EditorPosition) => setPositionState(normalizePosition(next)), []);
  const setPlacement = useCallback(
    (placement: string) => setPositionState((current) => normalizePosition({ ...current, placement })),
    []
  );

  const flip = useCallback(() => setOrientation((o) => (o === "white" ? "black" : "white")), []);
  useFlipBoardKey(flip);

  const problem = useMemo(() => positionProblem(position), [position]);
  const label = `Board editor, ${position.turn === "w" ? "White" : "Black"} to move. ${
    problem ?? "The position is legal."
  } Use the FEN field to set up a position from the keyboard.`;

  return (
    <GameLayout
      board={
        <EditorBoard
          placement={position.placement}
          onPlacementChange={setPlacement}
          orientation={orientation}
          tool={tool}
          onTool={setTool}
          label={label}
        />
      }
      sidebar={
        <div className="space-y-3">
          {badLink && (
            <p role="status" className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              The position in that link couldn't be read, so the board starts from the usual position.
            </p>
          )}
          <EditorPanel
            position={position}
            onChange={setPosition}
            orientation={orientation}
            onFlip={flip}
            problem={problem}
          />
        </div>
      }
    />
  );
};

export default BoardEditor;
