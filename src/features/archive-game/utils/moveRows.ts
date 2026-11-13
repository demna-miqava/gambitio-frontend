import type { AnalysisNode, NodePath } from "../types/analysis.types";
import { isWhiteMove, moveNumber } from "./analysisTree";

export interface MainMove {
  node: AnalysisNode;
  path: NodePath;
}

export type MoveRow =
  | { kind: "moves"; number: number; white: MainMove | null; black: MainMove | null }
  | { kind: "variations"; key: string; alternatives: MainMove[] };

/**
 * Main line in two columns. When a main-line move has alternatives, they
 * appear right after it (indented), and the game continues on a new row
 * ("1... e5") so it's clear which move each variation replaces.
 */
export function buildMoveRows(root: AnalysisNode): MoveRow[] {
  const rows: MoveRow[] = [];
  let open: Extract<MoveRow, { kind: "moves" }> | null = null;
  let parent = root;
  let parentPath: NodePath = [];

  for (let node = root.children[0]; node; node = node.children[0]) {
    const path = [...parentPath, node.id];
    if (isWhiteMove(node) || !open) {
      open = { kind: "moves", number: moveNumber(node), white: null, black: null };
      rows.push(open);
    }
    if (isWhiteMove(node)) open.white = { node, path };
    else {
      open.black = { node, path };
      open = null;
    }

    const alternatives = parent.children.slice(1);
    if (alternatives.length > 0) {
      rows.push({
        kind: "variations",
        key: `v-${node.id}`,
        alternatives: alternatives.map((alt) => ({ node: alt, path: [...parentPath, alt.id] })),
      });
      open = null;
    }
    parent = node;
    parentPath = path;
  }
  return rows;
}
