import type { Square } from "chess.js";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import type { AnalysisNode } from "../types/analysis.types";
import { chessAt } from "./analysisTree";

export type TypedMovePlan =
  | { kind: "play"; from: Square; to: Square; promotion?: string }
  /** A promotion typed without a piece ("e7e8"): ask, like a board move */
  | { kind: "promote"; from: Square; to: Square }
  | { kind: "error"; message: string };

/** Ends with a promotion piece, e.g. "e8=Q", "e7e8q", "bxa8=N+" */
const NAMES_PIECE = /[qrbn][+#!?]*$/i;

/**
 * What to do with a move typed on an analysis board. Promotions without a
 * piece go through the same picker (or auto-queen setting) as board moves.
 */
export function planTypedMove(node: AnalysisNode, text: string): TypedMovePlan {
  const move = parseTypedMove(chessAt(node), text);
  if (!move) return { kind: "error", message: `"${text.trim()}" isn't a legal move here.` };
  if (move.promotion && !NAMES_PIECE.test(text.trim())) {
    return { kind: "promote", from: move.from, to: move.to };
  }
  return {
    kind: "play",
    from: move.from,
    to: move.to,
    ...(move.promotion ? { promotion: move.promotion } : {}),
  };
}
