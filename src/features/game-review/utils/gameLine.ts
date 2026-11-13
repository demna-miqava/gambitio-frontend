import { Chess } from "chess.js";
import type { AnalysisNode, NodePath } from "@/features/archive-game/types/analysis.types";
import type { PositionEval, ReviewMove } from "../types";

export interface GameLineEntry {
  node: AnalysisNode;
  path: NodePath;
}

/**
 * The moves of the actual game, in order. Follows `isGameMove` rather than
 * children[0], so promoting a variation during analysis doesn't change what
 * gets reviewed.
 */
export function getGameLine(root: AnalysisNode): GameLineEntry[] {
  const line: GameLineEntry[] = [];
  const path: NodePath = [];
  for (let node = root.children.find((c) => c.isGameMove); node; ) {
    path.push(node.id);
    line.push({ node, path: [...path] });
    node = node.children.find((c) => c.isGameMove);
  }
  return line;
}

export function toReviewMoves(root: AnalysisNode, line: GameLineEntry[]): ReviewMove[] {
  return line.map(({ node }, i) => ({
    san: node.move!.san,
    uci: node.move!.uci,
    fenBefore: i === 0 ? root.fen : line[i - 1]!.node.fen,
  }));
}

/** Every position to evaluate: the start, then the position after each move. */
export function gamePositions(root: AnalysisNode, line: GameLineEntry[]): string[] {
  return [root.fen, ...line.map(({ node }) => node.fen)];
}

/**
 * The result when the game is over on the board (checkmate, stalemate,
 * insufficient material, fifty-move rule), so the engine isn't asked about
 * a position with no moves. Null when play can continue.
 */
export function terminalEval(fen: string): PositionEval | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  if (chess.isCheckmate()) return { type: "over", result: chess.turn() === "w" ? -1 : 1 };
  if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDrawByFiftyMoves()) {
    return { type: "over", result: 0 };
  }
  return null;
}

/** FNV-1a, enough to tell games apart in a cache key. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Identifies the game's content: same start and moves, same key. */
export function gameFingerprint(startFen: string, moves: ReviewMove[]): string {
  return `${moves.length}-${hash(`${startFen}|${moves.map((m) => m.uci).join(" ")}`)}`;
}
