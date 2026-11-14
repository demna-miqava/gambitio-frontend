import { useEffect, useMemo, useRef } from "react";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { isWhiteMove, moveLabel, moveNumber } from "../utils/analysisTree";
import type { AnalysisNode, NodePath } from "../types/analysis.types";
import { scrollIntoContainer } from "@/utils/scrollIntoContainer";
import { cn } from "@/lib/utils";
import { useGameReview } from "@/features/game-review/contexts/GameReviewContext";
import { ClassificationGlyph } from "@/features/game-review/components/ClassificationGlyph";
import { CLASSIFICATION_META, isFlagged } from "@/features/game-review/classificationMeta";

/**
 * Phone move list: the line you're on as one scrolling row. It follows the
 * current path (including a variation you've entered) and continues along
 * that line's main moves.
 */
export const MoveStrip = () => {
  const { root, path, currentNode, goTo } = useArchiveGame();
  const listRef = useRef<HTMLOListElement>(null);
  const review = useGameReview();

  const line = useMemo(() => {
    const items: { node: AnalysisNode; path: NodePath }[] = [];
    const walked: string[] = [];
    let node = root;
    for (const id of path) {
      const next = node.children.find((c) => c.id === id);
      if (!next) break;
      node = next;
      walked.push(id);
      items.push({ node, path: [...walked] });
    }
    for (let next = node.children[0]; next; next = next.children[0]) {
      walked.push(next.id);
      items.push({ node: next, path: [...walked] });
    }
    return items;
  }, [root, path]);

  useEffect(() => {
    scrollIntoContainer(listRef.current?.querySelector<HTMLElement>('[aria-current="step"]'));
  }, [currentNode.id]);

  if (line.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">
        No moves yet. Make a move on the board to start.
      </p>
    );
  }

  return (
    <ol
      ref={listRef}
      aria-label="Moves"
      className="scrollbar-none flex items-center gap-0.5 overflow-x-auto whitespace-nowrap py-1"
    >
      {line.map(({ node, path: nodePath }, index) => {
        const white = isWhiteMove(node);
        const active = node.id === currentNode.id;
        const judged = review?.moveReviewFor(node.id)?.classification;
        const flagged = judged && isFlagged(judged) ? judged : undefined;
        return (
          <li key={node.id} className="flex items-center">
            {(white || index === 0) && (
              <span className="pl-1.5 text-xs tabular-nums text-muted-foreground">
                {moveNumber(node)}
                {white ? "." : "..."}
              </span>
            )}
            <button
              type="button"
              onClick={() => goTo(nodePath)}
              aria-label={
                flagged ? `${moveLabel(node)}, ${CLASSIFICATION_META[flagged].label.toLowerCase()}` : moveLabel(node)
              }
              aria-current={active ? "step" : undefined}
              // 36px tall: a 44px touch-target overlay would overlap the
              // neighbouring chips in this dense row and steal their taps
              className={cn(
                "flex min-h-9 items-center rounded-md px-2 text-sm tabular-nums transition-colors",
                active
                  ? "bg-foreground font-medium text-background"
                  : node.isGameMove
                    ? "text-foreground/85 hover:bg-accent"
                    : "text-primary hover:bg-accent"
              )}
            >
              {node.move?.san}
              {flagged && <ClassificationGlyph classification={flagged} />}
            </button>
          </li>
        );
      })}
    </ol>
  );
};
