import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { MoveButton } from "./MoveButton";
import { VariationLine } from "./VariationLine";
import { moveLabel } from "../utils/analysisTree";
import { buildMoveRows, type MainMove } from "../utils/moveRows";
import { cn } from "@/lib/utils";
import { scrollIntoContainer } from "@/utils/scrollIntoContainer";
import { useGameReview } from "@/features/game-review/contexts/GameReviewContext";
import { ClassificationGlyph } from "@/features/game-review/components/ClassificationGlyph";
import { CLASSIFICATION_META, isFlagged } from "@/features/game-review/classificationMeta";

// Phones: a card of its own under the board. Desktop: part of the panel
// card, filling the height the rest of the panel leaves (the panel is as
// tall as the board, see AnalysisPanel), and the only part that scrolls
const CONTAINER =
  "w-full rounded-xl bg-card p-2 lg:min-h-0 lg:flex-1 lg:rounded-none lg:bg-transparent lg:px-3 lg:py-2";

export const AnalysisMovesList = () => {
  const { root, currentNode, goTo } = useArchiveGame();
  const rows = useMemo(() => buildMoveRows(root), [root]);
  const activeId = currentNode.id;
  const review = useGameReview();
  const listRef = useRef<HTMLDivElement>(null);
  const hasMoves = root.children.length > 0;

  // MoveButton scrolls the current move into view when it changes; the list
  // can also shrink under it (e.g. more engine lines above it), so follow
  // size changes too
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      scrollIntoContainer(list.querySelector<HTMLElement>('[aria-current="step"]'))
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, [hasMoves]);

  if (!hasMoves) {
    return (
      <div className={CONTAINER}>
        <p className="py-3 text-center text-sm text-muted-foreground lg:flex lg:h-full lg:items-center lg:justify-center lg:py-0">
          No moves yet. Make a move on the board to start analyzing.
        </p>
      </div>
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
    const judged = review?.moveReviewFor(move.node.id)?.classification;
    return (
      <MoveButton
        move={move.node.move!.san}
        label={moveLabel(move.node)}
        isActive={isActive}
        onClick={() => goTo(move.path)}
        {...(judged && isFlagged(judged)
          ? {
              suffix: <ClassificationGlyph classification={judged} inverted={isActive} />,
              description: CLASSIFICATION_META[judged].label.toLowerCase(),
            }
          : {})}
      />
    );
  };

  return (
    <div
      ref={listRef}
      className={cn(
        CONTAINER,
        // Phones: opened from the move strip, capped like the live game's list
        "max-h-[min(420px,55svh)] min-h-40 overflow-y-auto lg:max-h-none lg:min-h-0"
      )}
    >
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
                  onNavigate={goTo}
                />
              ))}
            </li>
          )
        )}
      </ol>
    </div>
  );
};
