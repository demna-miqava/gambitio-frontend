import { useMemo } from "react";
import {
  ArrowUpToLine,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CornerUpLeft,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseMoveControls, type MoveControl } from "@/features/game/components/BaseMoveControls";
import { useArrowKeyNavigation } from "@/features/game/hooks/useArrowKeyNavigation";
import type { StudyClientMessage, StudyState } from "../types";
import { demotedBy, endOfLine, isInVariation, mainLineAt, nodeOf, protectedNodes } from "../utils/studyState";
import { STUDY_ROOT_ID } from "../types";

/**
 * Stepping through the room's moves (buttons and arrow keys) and the
 * actions on the variation being shown. Every step moves the whole room.
 */
export const StudyControls = ({
  state,
  onGoTo,
  send,
}: {
  state: StudyState;
  onGoTo: (nodeId: string) => void;
  send: (message: StudyClientMessage) => void;
}) => {
  const current = nodeOf(state, state.cursor);
  const isAtStart = !current?.parentId;
  const next = current?.children[0];
  const inVariation = isInVariation(state, state.cursor);
  // A watched game's moves stay the main line while it is being played
  const guarded = protectedNodes(state);
  const isGameMove = guarded.has(state.cursor);
  const demoted = inVariation ? demotedBy(state, state.cursor) : null;
  const canPromote = !(demoted && guarded.has(demoted));

  const goToStart = () => onGoTo(STUDY_ROOT_ID);
  const goBack = () => current?.parentId && onGoTo(current.parentId);
  const goForward = () => next && onGoTo(next);
  const goToEnd = () => onGoTo(endOfLine(state, state.cursor));

  useArrowKeyNavigation({ onLeft: goBack, onRight: goForward, onUp: goToStart, onDown: goToEnd });

  const controls = useMemo<MoveControl[]>(
    () => [
      { id: "first", icon: ChevronsLeft, title: "Start position (Home)", onClick: goToStart, disabled: isAtStart },
      { id: "previous", icon: ChevronLeft, title: "Previous move (←)", onClick: goBack, disabled: isAtStart },
      { id: "next", icon: ChevronRight, title: "Next move (→)", onClick: goForward, disabled: !next },
      { id: "last", icon: ChevronsRight, title: "End of line (End)", onClick: goToEnd, disabled: !next },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isAtStart, next]
  );

  return (
    <div className="flex flex-col gap-2">
      {inVariation && (
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onGoTo(mainLineAt(state, state.cursor))}
            title="Go to the same move on the main line"
            className="min-w-0 flex-1"
          >
            <CornerUpLeft className="size-4" aria-hidden="true" />
            Main line
          </Button>
          {canPromote && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => send({ type: "promote", nodeId: state.cursor })}
              title="Make this variation the main continuation"
              className="min-w-0 flex-[1.3]"
            >
              <ArrowUpToLine className="size-4" aria-hidden="true" />
              Make main line
            </Button>
          )}
        </div>
      )}
      <div className="flex gap-1.5">
        <BaseMoveControls controls={controls} className="min-w-0 flex-1" />
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          disabled={isAtStart || isGameMove}
          onClick={() => send({ type: "delete", nodeId: state.cursor })}
          aria-label={isGameMove ? "The game's moves can't be deleted while it is played" : "Delete this move and the moves after it"}
          title={isGameMove ? "The game's moves stay while it is played" : "Delete from here (for everyone)"}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
