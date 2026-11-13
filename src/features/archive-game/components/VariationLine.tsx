import type { ReactNode } from "react";
import type { AnalysisNode, NodePath } from "../types/analysis.types";
import { isWhiteMove, moveLabel, moveNumber } from "../utils/analysisTree";
import { MoveButton } from "./MoveButton";

interface VariationLineProps {
  /** First move of the variation */
  start: AnalysisNode;
  /** Path to `start` */
  startPath: NodePath;
  activeId: string;
  onNavigate: (path: NodePath) => void;
}

/**
 * A variation as inline text, e.g. "12... Nf6 13. Bg5 (13. e5 Nd5) 13... Be7".
 * Same order as PGN: a move, its alternatives in parentheses, then the
 * continuation (with the move number repeated after a variation).
 */
export const VariationLine = ({ start, startPath, activeId, onNavigate }: VariationLineProps) => {
  const items: ReactNode[] = [];

  const pushMove = (node: AnalysisNode, path: NodePath, forceNumber: boolean) => {
    const showNumber = isWhiteMove(node) || forceNumber;
    items.push(
      <span key={node.id} className="inline-flex items-baseline">
        {showNumber && (
          <span className="mr-0.5 text-xs text-muted-foreground">
            {moveNumber(node)}
            {isWhiteMove(node) ? "." : "..."}
          </span>
        )}
        <MoveButton
          move={node.move!.san}
          label={moveLabel(node)}
          isVariation
          isActive={node.id === activeId}
          onClick={() => onNavigate(path)}
        />
      </span>
    );
  };

  const pushContinuation = (parent: AnalysisNode, parentPath: NodePath, forceNumber: boolean) => {
    const [main, ...alternatives] = parent.children;
    if (!main) return;
    const mainPath = [...parentPath, main.id];
    pushMove(main, mainPath, forceNumber);
    for (const alt of alternatives) {
      const altPath = [...parentPath, alt.id];
      items.push(
        <span key={`(${alt.id}`} className="text-muted-foreground">
          (
        </span>
      );
      pushMove(alt, altPath, true);
      pushContinuation(alt, altPath, false);
      items.push(
        <span key={`)${alt.id}`} className="text-muted-foreground">
          )
        </span>
      );
    }
    pushContinuation(main, mainPath, alternatives.length > 0);
  };

  pushMove(start, startPath, true);
  pushContinuation(start, startPath, false);

  return <span className="inline-flex flex-wrap items-baseline gap-x-0.5 gap-y-1">{items}</span>;
};
