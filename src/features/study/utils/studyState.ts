import { DEFAULT_POSITION, type Square } from "chess.js";
import { isAxiosError } from "axios";
import type { AnalysisNode } from "@/features/archive-game/types/analysis.types";
import {
  STUDY_BRUSHES,
  STUDY_ROOT_ID,
  type StudyBrush,
  type StudyNode,
  type StudyRoomSnapshot,
  type StudyServerMessage,
  type StudyShape,
  type StudyState,
} from "../types";

/**
 * Pure helpers for a study room on the client: applying what the socket
 * sends, walking the tree, and exporting it.
 */

export interface AppliedMessage {
  snapshot: StudyRoomSnapshot | null;
  /** An update was missed: ask the server for the whole room ("sync") */
  needsSync: boolean;
}

/**
 * Applies a socket message to the room. Changes to the analysis carry the
 * room's new version: one that doesn't follow on from ours means we missed
 * something, so we ask for the whole room again. Old or repeated versions
 * are ignored.
 */
export function applyStudyMessage(
  snapshot: StudyRoomSnapshot | null,
  message: StudyServerMessage
): AppliedMessage {
  const keep = { snapshot, needsSync: false };
  switch (message.type) {
    case "study_state": {
      const { room, state, members, present } = message;
      return { snapshot: { room, state, members, present }, needsSync: false };
    }
    case "cursor":
    case "node":
    case "node_added":
    case "node_deleted":
    case "children": {
      if (!snapshot) return { snapshot, needsSync: true };
      if (message.version <= snapshot.room.version) return keep;
      if (message.version !== snapshot.room.version + 1) return { snapshot, needsSync: true };
      const state = applyChange(snapshot.state, message);
      // A change to a node we don't have means our tree is behind
      if (!state || !Object.hasOwn(state.nodes, state.cursor)) return { snapshot, needsSync: true };
      return {
        snapshot: { ...snapshot, room: { ...snapshot.room, version: message.version }, state },
        needsSync: false,
      };
    }
    case "presence":
      return snapshot ? { snapshot: { ...snapshot, present: message.userIds }, needsSync: false } : keep;
    case "members":
      return snapshot ? { snapshot: { ...snapshot, members: message.members }, needsSync: false } : keep;
    case "room_renamed":
      return snapshot
        ? { snapshot: { ...snapshot, room: { ...snapshot.room, name: message.name } }, needsSync: false }
        : keep;
    default:
      return keep;
  }
}

/** One versioned change to the analysis; null when it doesn't fit our tree. */
function applyChange(
  state: StudyState,
  message: Extract<StudyServerMessage, { version: number }>
): StudyState | null {
  switch (message.type) {
    case "cursor":
      return { ...state, cursor: message.cursor };
    case "node":
      return { ...state, nodes: { ...state.nodes, [message.node.id]: message.node } };
    case "node_added": {
      const { node } = message;
      const parent = node.parentId !== null ? nodeOf(state, node.parentId) : undefined;
      if (!parent) return null;
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [node.id]: node,
          [parent.id]: { ...parent, children: [...parent.children.filter((id) => id !== node.id), node.id] },
        },
        cursor: message.cursor,
        nextId: state.nextId + 1,
      };
    }
    case "node_deleted": {
      const parent = nodeOf(state, message.parentId);
      if (!parent || !nodeOf(state, message.nodeId)) return null;
      const removed = new Set([message.nodeId]);
      for (const id of removed) for (const child of nodeOf(state, id)?.children ?? []) removed.add(child);
      const nodes = Object.fromEntries(Object.entries(state.nodes).filter(([id]) => !removed.has(id)));
      nodes[parent.id] = { ...parent, children: parent.children.filter((id) => id !== message.nodeId) };
      return { ...state, nodes, cursor: message.cursor };
    }
    case "children": {
      const parent = nodeOf(state, message.parentId);
      // The same children, in a new order
      if (
        !parent ||
        message.children.length !== parent.children.length ||
        !message.children.every((id) => parent.children.includes(id))
      ) {
        return null;
      }
      return { ...state, nodes: { ...state.nodes, [parent.id]: { ...parent, children: message.children } } };
    }
  }
}

export function nodeOf(state: StudyState, id: string): StudyNode | undefined {
  return Object.hasOwn(state.nodes, id) ? state.nodes[id] : undefined;
}

export function rootOf(state: StudyState): StudyNode {
  return state.nodes[STUDY_ROOT_ID]!;
}

/** Node ids from the root (exclusive) to the node. */
export function pathTo(state: StudyState, id: string): string[] {
  const path: string[] = [];
  let node = nodeOf(state, id);
  while (node && node.parentId !== null) {
    path.unshift(node.id);
    node = nodeOf(state, node.parentId);
  }
  return path;
}

/** The last node reached by following main continuations from `id`. */
export function endOfLine(state: StudyState, id: string): string {
  let node = nodeOf(state, id);
  while (node?.children[0]) node = nodeOf(state, node.children[0]);
  return node?.id ?? id;
}

/** True when the node is off the main line somewhere along its path. */
export function isInVariation(state: StudyState, id: string): boolean {
  let node = nodeOf(state, id);
  while (node && node.parentId !== null) {
    const parent = nodeOf(state, node.parentId);
    if (parent && parent.children[0] !== node.id) return true;
    node = parent;
  }
  return false;
}

/**
 * The main-line node at the same move number as `id` (or the deepest one
 * before it, if the main line is shorter): "back to the main line".
 */
export function mainLineAt(state: StudyState, id: string): string {
  const target = nodeOf(state, id);
  let node = rootOf(state);
  while (target && node.ply < target.ply && node.children[0]) node = nodeOf(state, node.children[0])!;
  return node.id;
}

/** Number of moves in the study (the root isn't one). */
export function studyMoveCount(state: StudyState): number {
  return Object.keys(state.nodes).length - 1;
}

/**
 * The tree in the shape the analysis board's move list uses, so the same
 * components (move rows, variation lines) can render it. Node ids are kept.
 */
export function toAnalysisTree(state: StudyState): AnalysisNode {
  const convert = (node: StudyNode): AnalysisNode => ({
    id: node.id,
    fen: node.fen,
    ply: node.ply,
    move:
      node.san && node.uci
        ? {
            san: node.san,
            uci: node.uci,
            from: node.uci.slice(0, 2) as Square,
            to: node.uci.slice(2, 4) as Square,
          }
        : null,
    children: node.children.flatMap((id) => {
      const child = nodeOf(state, id);
      return child ? [convert(child)] : [];
    }),
    isGameMove: true,
  });
  return convert(rootOf(state));
}

const isWhiteMove = (node: StudyNode) => (node.ply - 1) % 2 === 0;
const moveNumber = (node: StudyNode) => Math.floor((node.ply - 1) / 2) + 1;

/** A comment as PGN: braces can't be nested, so they're dropped. */
const pgnComment = (text: string) => (text ? `{${text.replace(/[{}]/g, "")}}` : "");

/**
 * The study as PGN, with variations in parentheses and comments in braces
 * (a comment on the starting position goes before the first move).
 */
export function toStudyPgn(state: StudyState, headers: Record<string, string> = {}): string {
  const root = rootOf(state);
  const allHeaders = { ...headers };
  if (root.fen !== DEFAULT_POSITION) {
    allHeaders.SetUp = "1";
    allHeaders.FEN = root.fen;
  }
  const result = allHeaders.Result ?? "*";

  const moveText = (node: StudyNode, forceNumber: boolean) => {
    const san = node.san!;
    const text = isWhiteMove(node)
      ? `${moveNumber(node)}. ${san}`
      : forceNumber
        ? `${moveNumber(node)}... ${san}`
        : san;
    return node.comment ? `${text} ${pgnComment(node.comment)}` : text;
  };

  const writeLine = (parent: StudyNode, forceNumber: boolean, out: string[]) => {
    const [mainId, ...variationIds] = parent.children;
    const main = mainId ? nodeOf(state, mainId) : undefined;
    if (!main) return;
    out.push(moveText(main, forceNumber));
    for (const id of variationIds) {
      const variation = nodeOf(state, id);
      if (!variation) continue;
      const inner = [moveText(variation, true)];
      writeLine(variation, variation.comment !== "", inner);
      out.push(`(${inner.join(" ")})`);
    }
    // After a comment or a variation, black's reply needs its number again
    writeLine(main, variationIds.length > 0 || main.comment !== "", out);
  };

  const moves: string[] = [];
  if (root.comment) moves.push(pgnComment(root.comment));
  writeLine(root, true, moves);
  const headerText = Object.entries(allHeaders)
    .map(([key, value]) => `[${key} "${value.replace(/["\\]/g, "\\$&")}"]`)
    .join("\n");
  const movetext = [...moves, result].join(" ");
  return headerText ? `${headerText}\n\n${movetext}` : movetext;
}

/** A shape drawn on the board (chessground's DrawShape, as far as we use it). */
export interface BoardShape {
  orig: string;
  dest?: string | undefined;
  brush?: string | undefined;
}

const isStudyBrush = (brush: string | undefined): brush is StudyBrush =>
  STUDY_BRUSHES.includes(brush as StudyBrush);

/** Shapes the user drew, as the room stores them (other brushes are dropped). */
export function toStudyShapes(shapes: BoardShape[]): StudyShape[] {
  return shapes.flatMap((shape) =>
    isStudyBrush(shape.brush)
      ? [{ orig: shape.orig, brush: shape.brush, ...(shape.dest && shape.dest !== shape.orig ? { dest: shape.dest } : {}) }]
      : []
  );
}

/** Same shapes, compared by squares and colour, in any order. */
export function sameShapes(a: StudyShape[], b: StudyShape[]): boolean {
  if (a.length !== b.length) return false;
  const key = (s: StudyShape) => `${s.orig}${s.dest ?? ""}${s.brush}`;
  const keys = new Set(a.map(key));
  return b.every((s) => keys.has(key(s)));
}

/** The server's message for a failed request, or `fallback`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** The server's error code for a failed request, if any. */
export function apiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : undefined;
}
