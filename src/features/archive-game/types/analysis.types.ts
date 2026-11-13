import type { Square } from "chess.js";

export interface AnalysisMove {
  san: string;
  uci: string;
  from: Square;
  to: Square;
}

/**
 * One position in the analysis tree. The root is the starting position (no
 * move); every other node is the position after `move`.
 *
 * `children[0]` is the main continuation, later children are variations.
 * Variations can branch again to any depth.
 */
export interface AnalysisNode {
  /** Unique within the tree; stable across edits */
  id: string;
  /** Position after this node's move (or the start position for the root) */
  fen: string;
  /** Half-moves played before this position, counted from move 1 (so a FEN with black to move on move 1 has ply 1) */
  ply: number;
  move: AnalysisMove | null;
  children: AnalysisNode[];
  /** Part of the original game rather than added during analysis */
  isGameMove: boolean;
}

/** Node ids from the root (exclusive) to the current node; [] is the start position */
export type NodePath = string[];
