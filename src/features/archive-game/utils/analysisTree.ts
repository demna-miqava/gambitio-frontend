import { Chess, DEFAULT_POSITION, type Move } from "chess.js";
import type { AnalysisNode, NodePath } from "../types/analysis.types";

/**
 * Pure, immutable operations on the analysis tree. Every edit returns a new
 * root and copies only the nodes along the edited path, so React state
 * updates stay cheap and old trees remain valid for undo.
 */

let idCounter = 0;
const nextId = () => (++idCounter).toString(36);

/** Ply of a position from its FEN (side to move + fullmove number). */
export function plyFromFen(fen: string): number {
  const [, turn = "w", , , , fullmove = "1"] = fen.split(" ");
  return (Number(fullmove) - 1) * 2 + (turn === "b" ? 1 : 0);
}

export function createRoot(startFen: string = DEFAULT_POSITION): AnalysisNode {
  return {
    id: "root",
    fen: startFen,
    ply: plyFromFen(startFen),
    move: null,
    children: [],
    isGameMove: true,
  };
}

export function createNode(parent: AnalysisNode, move: Move, isGameMove = false): AnalysisNode {
  return {
    id: nextId(),
    fen: move.after,
    ply: parent.ply + 1,
    move: {
      san: move.san,
      uci: move.from + move.to + (move.promotion ?? ""),
      from: move.from,
      to: move.to,
    },
    children: [],
    isGameMove,
  };
}

/** True if the node's move was played by white. */
export function isWhiteMove(node: AnalysisNode): boolean {
  return (node.ply - 1) % 2 === 0;
}

/** Full-move number of the node's move (1. e4 → 1, 1... e5 → 1). */
export function moveNumber(node: AnalysisNode): number {
  return Math.floor((node.ply - 1) / 2) + 1;
}

/** Spoken/visible label for a move, e.g. "12. Nf3" or "12... Nf6". */
export function moveLabel(node: AnalysisNode): string {
  return `${moveNumber(node)}${isWhiteMove(node) ? "." : "..."} ${node.move?.san ?? ""}`;
}

/** Root and every node along the path; stops early if the path is broken. */
export function nodesAlong(root: AnalysisNode, path: NodePath): AnalysisNode[] {
  const nodes = [root];
  let current = root;
  for (const id of path) {
    const next = current.children.find((c) => c.id === id);
    if (!next) break;
    nodes.push(next);
    current = next;
  }
  return nodes;
}

export function nodeAt(root: AnalysisNode, path: NodePath): AnalysisNode {
  const nodes = nodesAlong(root, path);
  return nodes[nodes.length - 1]!;
}

/** True when every step of the path follows children[0]. */
export function isMainLine(root: AnalysisNode, path: NodePath): boolean {
  const nodes = nodesAlong(root, path);
  return nodes.every((node, i) => i === 0 || nodes[i - 1]!.children[0] === node);
}

/** Extends the path along main continuations to the end of the line. */
export function endOfLine(root: AnalysisNode, path: NodePath): NodePath {
  const result = [...path];
  let node = nodeAt(root, path);
  while (node.children[0]) {
    node = node.children[0];
    result.push(node.id);
  }
  return result;
}

/** Path of the deepest node of `path` that is still on the main line. */
export function mainLineAncestor(root: AnalysisNode, path: NodePath): NodePath {
  const nodes = nodesAlong(root, path);
  let i = 1;
  while (i < nodes.length && nodes[i - 1]!.children[0] === nodes[i]) i++;
  return path.slice(0, i - 1);
}

/** Rebuilds the nodes along `path`, applying `update` to the last one. */
function updateAt(
  root: AnalysisNode,
  path: NodePath,
  update: (node: AnalysisNode) => AnalysisNode
): AnalysisNode {
  if (path.length === 0) return update(root);
  const [head, ...rest] = path;
  return {
    ...root,
    children: root.children.map((child) => (child.id === head ? updateAt(child, rest, update) : child)),
  };
}

/**
 * Plays a move from the node at `path`. If that move already exists there,
 * the existing node is reused (no duplicates); otherwise it's added as the
 * main continuation when the node has none, or as a new variation.
 */
export function addMove(
  root: AnalysisNode,
  path: NodePath,
  move: Move
): { root: AnalysisNode; path: NodePath } {
  const parent = nodeAt(root, path);
  const uci = move.from + move.to + (move.promotion ?? "");
  const existing = parent.children.find((c) => c.move?.uci === uci);
  if (existing) return { root, path: [...path, existing.id] };

  const node = createNode(parent, move);
  return {
    root: updateAt(root, path, (n) => ({ ...n, children: [...n.children, node] })),
    path: [...path, node.id],
  };
}

/** Removes the node at `path` and everything after it. */
export function deleteNode(root: AnalysisNode, path: NodePath): AnalysisNode {
  if (path.length === 0) return root;
  const id = path[path.length - 1];
  return updateAt(root, path.slice(0, -1), (parent) => ({
    ...parent,
    children: parent.children.filter((c) => c.id !== id),
  }));
}

/**
 * Promotes the variation containing `path` one level: at the deepest point
 * where the path leaves the main continuation, its node becomes children[0].
 */
export function promoteVariation(root: AnalysisNode, path: NodePath): AnalysisNode {
  const nodes = nodesAlong(root, path);
  for (let i = nodes.length - 1; i >= 1; i--) {
    const parent = nodes[i - 1]!;
    const node = nodes[i]!;
    if (parent.children[0] !== node) {
      return updateAt(root, path.slice(0, i - 1), (p) => ({
        ...p,
        children: [node, ...p.children.filter((c) => c !== node)],
      }));
    }
  }
  return root;
}

/** Drops everything added during analysis, keeping only the original game. */
export function pruneToGame(root: AnalysisNode): AnalysisNode {
  return {
    ...root,
    children: root.children.filter((c) => c.isGameMove).map(pruneToGame),
  };
}

/**
 * "Clear analysis": back to the original game. Keeps the position if it
 * survived, otherwise goes to where it branched off. The old root stays
 * valid, so undo is restoring it with the old path.
 */
export function clearAnalysis(root: AnalysisNode, path: NodePath): { root: AnalysisNode; path: NodePath } {
  const pruned = pruneToGame(root);
  const surviving = nodesAlong(pruned, path).length - 1;
  return { root: pruned, path: path.slice(0, surviving) };
}

/**
 * Recomputes isGameMove on `tree` so exactly the nodes matching the game's
 * main line are game moves. Used when restoring saved analysis.
 */
export function markGameMoves(tree: AnalysisNode, game: AnalysisNode): AnalysisNode {
  const gameNext = game.children[0];
  return {
    ...tree,
    isGameMove: true,
    children: tree.children.map((child) =>
      gameNext && child.move?.uci === gameNext.move?.uci
        ? markGameMoves(child, gameNext)
        : markAll(child, false)
    ),
  };
}

function markAll(node: AnalysisNode, isGameMove: boolean): AnalysisNode {
  return { ...node, isGameMove, children: node.children.map((c) => markAll(c, isGameMove)) };
}

/** True if anything beyond the original game has been added. */
export function hasAnalysis(node: AnalysisNode): boolean {
  return node.children.some((c) => !c.isGameMove || hasAnalysis(c));
}

/** Makes a chess.js instance at the node's position, for validating the next move. */
export function chessAt(node: AnalysisNode): Chess {
  return new Chess(node.fen);
}
