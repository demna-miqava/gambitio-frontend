import { describeMove } from "@/features/game/utils/describeMove";
import type { AnalysisNode } from "../types/analysis.types";
import { isWhiteMove, moveNumber } from "./analysisTree";

/** A move for screen readers: "Move 12, black: Knight to f6". */
export function spokenMove(node: AnalysisNode): string {
  if (!node.move) return "Start position";
  return `Move ${moveNumber(node)}, ${isWhiteMove(node) ? "white" : "black"}: ${describeMove(node.move.san)}`;
}

/** Read out after the current position changes on an analysis board. */
export function positionAnnouncement(node: AnalysisNode, inVariation: boolean): string {
  return inVariation && node.move ? `${spokenMove(node)}, in a variation` : spokenMove(node);
}

/** Accessible name of an analysis board: who's to move and the last move. */
export function boardLabel(node: AnalysisNode): string {
  const toMove = node.fen.split(" ")[1] === "b" ? "Black" : "White";
  const parts = ["Chess board", `${toMove} to move`];
  if (node.move) parts.push(`Last move: ${spokenMove(node)}`);
  return parts.join(". ");
}
