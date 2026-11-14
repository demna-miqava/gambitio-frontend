import { useMemo, type ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { MoveButton } from "@/features/archive-game/components/MoveButton";
import { VariationLine } from "@/features/archive-game/components/VariationLine";
import { moveLabel } from "@/features/archive-game/utils/analysisTree";
import { buildMoveRows, type MainMove } from "@/features/archive-game/utils/moveRows";
import type { StudyState } from "../types";
import { nodeOf, toAnalysisTree } from "../utils/studyState";

/**
 * The room's moves: the main line in two columns with variations inline
 * (the analysis board's layout). Clicking a move takes everyone there.
 */
export const StudyMovesList = ({
  state,
  onGoTo,
}: {
  state: StudyState;
  onGoTo: (nodeId: string) => void;
}) => {
  const root = useMemo(() => toAnalysisTree(state), [state]);
  const rows = useMemo(() => buildMoveRows(root), [root]);
  const activeId = state.cursor;

  if (root.children.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-muted-foreground lg:flex lg:h-full lg:items-center lg:justify-center lg:py-0">
        No moves yet. Make a move on the board to start.
      </p>
    );
  }

  const cell = (move: MainMove | null, placeholder: boolean): ReactNode => {
    if (!move) {
      return placeholder ? (
        <span className="px-1.5 text-sm text-muted-foreground" aria-hidden="true">
          …
        </span>
      ) : null;
    }
    const isActive = move.node.id === activeId;
    const hasComment = !!nodeOf(state, move.node.id)?.comment;
    return (
      <MoveButton
        move={move.node.move!.san}
        label={moveLabel(move.node)}
        isActive={isActive}
        onClick={() => onGoTo(move.node.id)}
        {...(hasComment && {
          suffix: <MessageSquare className="ml-1 size-3 text-muted-foreground" aria-hidden="true" />,
          description: "has a comment",
        })}
      />
    );
  };

  return (
    <ol aria-label="Moves" className="flex flex-col gap-0.5">
      {rows.map((row) =>
        row.kind === "moves" ? (
          <li
            key={(row.white ?? row.black)!.node.id}
            className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-y-0.5 text-sm"
          >
            <span className="text-xs tabular-nums text-muted-foreground">{row.number}.</span>
            <span>{cell(row.white, true)}</span>
            <span>{cell(row.black, false)}</span>
          </li>
        ) : (
          <li
            key={row.key}
            aria-label="Variations"
            className="my-1 ml-10 flex flex-col gap-1 border-l-2 border-border pl-2"
          >
            {row.alternatives.map((alt) => (
              <VariationLine
                key={alt.node.id}
                start={alt.node}
                startPath={alt.path}
                activeId={activeId}
                onNavigate={(path) => {
                  const id = path[path.length - 1];
                  if (id) onGoTo(id);
                }}
              />
            ))}
          </li>
        )
      )}
    </ol>
  );
};
